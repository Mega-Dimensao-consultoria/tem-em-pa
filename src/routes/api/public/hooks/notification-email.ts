import * as React from 'react'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import {
  TEMPLATES,
  NOTIFICATION_TYPE_TO_TEMPLATE,
} from '@/lib/email-templates/registry'

const SITE_NAME = 'tem-em-pa'
const SENDER_DOMAIN = 'notificacoes.sistemas.megadimensao.com.br'
const FROM_DOMAIN = 'notificacoes.sistemas.megadimensao.com.br'
const APP_URL = 'https://tem-em-pa.lovable.app'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const Route = createFileRoute('/api/public/hooks/notification-email')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = process.env.SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        const dispatchSecret = process.env.PUSH_DISPATCH_SECRET
        if (!supabaseUrl || !serviceKey || !dispatchSecret) {
          return Response.json({ error: 'misconfigured' }, { status: 500 })
        }

        const provided = request.headers.get('x-dispatch-secret')
        if (!provided || provided !== dispatchSecret) {
          return Response.json({ error: 'forbidden' }, { status: 403 })
        }

        let notificationId: string
        try {
          const body = (await request.json()) as { notification_id?: string }
          if (!body.notification_id) throw new Error('missing id')
          notificationId = body.notification_id
        } catch {
          return Response.json({ error: 'bad request' }, { status: 400 })
        }

        const supabase = createClient(supabaseUrl, serviceKey)

        const { data: notif, error: nerr } = await supabase
          .from('notifications')
          .select('id, user_id, type, title, message, link, metadata')
          .eq('id', notificationId)
          .maybeSingle()

        if (nerr || !notif) {
          return Response.json({ error: 'notification not found' }, { status: 404 })
        }

        const templateName = NOTIFICATION_TYPE_TO_TEMPLATE[notif.type as string]
        if (!templateName) {
          return Response.json({ skipped: 'unmapped_type' })
        }
        const template = TEMPLATES[templateName]
        if (!template) {
          return Response.json({ skipped: 'unknown_template' })
        }

        // Lookup recipient email via auth admin
        const { data: userRes, error: uerr } = await supabase.auth.admin.getUserById(
          notif.user_id as string
        )
        if (uerr || !userRes?.user?.email) {
          return Response.json({ skipped: 'no_email' })
        }
        const recipientEmail = userRes.user.email

        // Suppression check
        const { data: suppressed } = await supabase
          .from('suppressed_emails')
          .select('id')
          .eq('email', recipientEmail.toLowerCase())
          .maybeSingle()
        if (suppressed) return Response.json({ skipped: 'suppressed' })

        // Build template data based on notification metadata
        const meta = (notif.metadata as Record<string, any> | null) ?? {}
        const templateData: Record<string, any> = {
          ...meta,
          appUrl: APP_URL,
        }

        // Enrich with company name when available
        if (meta.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('name')
            .eq('id', meta.company_id)
            .maybeSingle()
          if (company?.name) templateData.companyName = company.name
          templateData.companyId = meta.company_id
        }

        // Enrich review-specific fields
        if (meta.review_id) {
          const { data: review } = await supabase
            .from('reviews')
            .select('comment, owner_reply, rating')
            .eq('id', meta.review_id)
            .maybeSingle()
          if (review) {
            if (review.rating != null) templateData.rating = review.rating
            if (notif.type === 'review_new' && review.comment) {
              templateData.comment = review.comment
            }
            if (notif.type === 'review_reply' && review.owner_reply) {
              templateData.reply = review.owner_reply
            }
          }
        }

        // Idempotency: one email per notification
        const messageId = `notif-${notif.id}`

        // Skip if already sent
        const { data: already } = await supabase
          .from('email_send_log')
          .select('id')
          .eq('message_id', messageId)
          .in('status', ['sent', 'pending'])
          .maybeSingle()
        if (already) return Response.json({ skipped: 'already_queued' })

        // Unsubscribe token (reuse if exists)
        const normalized = recipientEmail.toLowerCase()
        let unsubscribeToken: string
        const { data: existingToken } = await supabase
          .from('email_unsubscribe_tokens')
          .select('token, used_at')
          .eq('email', normalized)
          .maybeSingle()
        if (existingToken?.used_at) {
          await supabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: recipientEmail,
            status: 'suppressed',
          })
          return Response.json({ skipped: 'unsubscribed' })
        }
        if (existingToken) {
          unsubscribeToken = existingToken.token
        } else {
          unsubscribeToken = generateToken()
          await supabase
            .from('email_unsubscribe_tokens')
            .upsert(
              { token: unsubscribeToken, email: normalized },
              { onConflict: 'email', ignoreDuplicates: true }
            )
          const { data: stored } = await supabase
            .from('email_unsubscribe_tokens')
            .select('token')
            .eq('email', normalized)
            .maybeSingle()
          if (stored?.token) unsubscribeToken = stored.token
        }

        // Render
        const element = React.createElement(template.component, templateData)
        const html = await render(element)
        const plainText = await render(element, { plainText: true })
        const subject =
          typeof template.subject === 'function'
            ? template.subject(templateData)
            : template.subject

        await supabase.from('email_send_log').insert({
          message_id: messageId,
          template_name: templateName,
          recipient_email: recipientEmail,
          status: 'pending',
        })

        const { error: enqErr } = await supabase.rpc('enqueue_email', {
          queue_name: 'transactional_emails',
          payload: {
            message_id: messageId,
            to: recipientEmail,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text: plainText,
            purpose: 'transactional',
            label: templateName,
            idempotency_key: messageId,
            unsubscribe_token: unsubscribeToken,
            queued_at: new Date().toISOString(),
          },
        })

        if (enqErr) {
          await supabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: recipientEmail,
            status: 'failed',
            error_message: 'enqueue failed',
          })
          return Response.json({ error: 'enqueue_failed' }, { status: 500 })
        }

        return Response.json({ queued: true })
      },
    },
  },
})
