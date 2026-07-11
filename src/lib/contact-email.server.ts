/**
 * Server-only helper that renders a contact email template and enqueues it into
 * the existing `transactional_emails` pgmq queue. Mirrors the enqueue shape
 * used by `src/routes/api/public/hooks/notification-email.ts`.
 */
import * as React from 'react'
import { render } from '@react-email/components'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'Tem na minha cidade'
const SENDER_DOMAIN = 'notificacoes.www.temnaminhacidade.com.br'
const FROM_DOMAIN = 'notificacoes.www.temnaminhacidade.com.br'

export async function enqueueContactEmail(args: {
  supabase: any
  templateName: 'contact-admin-notification' | 'contact-reply'
  to: string
  data: Record<string, any>
  messageId: string
}) {
  const template = TEMPLATES[args.templateName]
  if (!template) throw new Error(`Template not found: ${args.templateName}`)

  const normalized = args.to.toLowerCase()

  // Suppression check (bounces, complaints, unsubscribes)
  const { data: suppressed } = await args.supabase
    .from('suppressed_emails')
    .select('id')
    .eq('email', normalized)
    .maybeSingle()
  if (suppressed) return { skipped: 'suppressed' as const }

  // Idempotency
  const { data: already } = await args.supabase
    .from('email_send_log')
    .select('id')
    .eq('message_id', args.messageId)
    .in('status', ['sent', 'pending'])
    .maybeSingle()
  if (already) return { skipped: 'already_queued' as const }

  const element = React.createElement(template.component as any, args.data)
  const html = await render(element)
  const plainText = await render(element, { plainText: true })
  const subject =
    typeof template.subject === 'function' ? template.subject(args.data) : template.subject

  await args.supabase.from('email_send_log').insert({
    message_id: args.messageId,
    template_name: args.templateName,
    recipient_email: args.to,
    status: 'pending',
  })

  const { error: enqErr } = await args.supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: args.messageId,
      to: args.to,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text: plainText,
      purpose: 'transactional',
      label: args.templateName,
      idempotency_key: args.messageId,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqErr) {
    await args.supabase.from('email_send_log').insert({
      message_id: args.messageId,
      template_name: args.templateName,
      recipient_email: args.to,
      status: 'failed',
      error_message: 'enqueue failed',
    })
    return { error: 'enqueue_failed' as const }
  }
  return { queued: true as const }
}

export const ADMIN_CONTACT_EMAIL = 'contato@temnaminhacidade.com.br'
