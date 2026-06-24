import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const ContactSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(5).max(4000),
  website: z.string().optional(), // honeypot
})

export const Route = createFileRoute('/api/public/contact-submit')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = process.env.SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !serviceKey) {
          return Response.json({ error: 'misconfigured' }, { status: 500 })
        }

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'bad_request' }, { status: 400 })
        }

        const parsed = ContactSchema.safeParse(body)
        if (!parsed.success) {
          return Response.json({ error: 'invalid_input' }, { status: 400 })
        }

        // Honeypot — silently succeed for bots
        if (parsed.data.website && parsed.data.website.trim().length > 0) {
          return Response.json({ ok: true })
        }

        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, serviceKey)

        const { data: inserted, error } = await supabase
          .from('contact_messages')
          .insert({
            full_name: parsed.data.full_name,
            email: parsed.data.email.toLowerCase(),
            subject: parsed.data.subject,
            message: parsed.data.message,
          })
          .select('id')
          .single()

        if (error || !inserted) {
          return Response.json({ error: 'insert_failed' }, { status: 500 })
        }

        // Fire-and-forget admin notification
        try {
          const { enqueueContactEmail, ADMIN_CONTACT_EMAIL } = await import(
            '@/lib/contact-email.server'
          )
          await enqueueContactEmail({
            supabase,
            templateName: 'contact-admin-notification',
            to: ADMIN_CONTACT_EMAIL,
            messageId: `contact-${inserted.id}`,
            data: {
              fullName: parsed.data.full_name,
              fromEmail: parsed.data.email,
              subjectLine: parsed.data.subject,
              message: parsed.data.message,
              adminUrl: 'https://tem-em-pa.lovable.app/admin',
            },
          })
        } catch {
          // do not fail the user-facing submission if email enqueue fails
        }

        return Response.json({ ok: true, id: inserted.id })
      },
    },
  },
})
