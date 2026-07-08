import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

/**
 * DLQ retry job. Re-enqueues messages from `<queue>_dlq` back into `<queue>`
 * so the regular processor can try again. Skips messages older than
 * MAX_AGE_HOURS to avoid infinite retries on permanently broken payloads.
 *
 * Called hourly by pg_cron. Authenticates via the Supabase publishable key
 * (`apikey` header) — the route is under /api/public/* which bypasses edge
 * auth, so validation happens here.
 */
const MAX_AGE_HOURS = 24
const BATCH_SIZE = 25
const VISIBILITY_SECONDS = 60

const QUEUES = ['auth_emails', 'transactional_emails'] as const

export const Route = createFileRoute('/api/public/hooks/retry-email-dlq')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.PUSH_DISPATCH_SECRET
        const provided = request.headers.get('x-dispatch-secret')
        if (!expected || !provided || provided !== expected) {
          return new Response('Unauthorized', { status: 401 })
        }

        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        )

        const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000
        const report: Record<string, { retried: number; expired: number }> = {}

        for (const queue of QUEUES) {
          const dlq = `${queue}_dlq`
          const { data: rows, error } = await supabase.rpc('read_email_batch', {
            queue_name: dlq,
            batch_size: BATCH_SIZE,
            vt: VISIBILITY_SECONDS,
          })

          if (error) {
            console.error('retry-email-dlq: read failed', { dlq, error })
            report[dlq] = { retried: 0, expired: 0 }
            continue
          }

          let retried = 0
          let expired = 0
          for (const row of rows ?? []) {
            const payload = row.message as Record<string, unknown>
            const enqueuedAt = Number(payload.enqueued_at ?? 0)
            const messageId = String(payload.message_id ?? row.msg_id)

            if (enqueuedAt && enqueuedAt < cutoff) {
              await supabase.from('email_send_log').insert({
                message_id: messageId,
                template_name: (payload.label || queue) as string,
                recipient_email: (payload.to ?? '') as string,
                status: 'dlq_expired',
                error_message: `DLQ age > ${MAX_AGE_HOURS}h`,
              })
              await supabase.rpc('delete_email', {
                queue_name: dlq,
                message_id: row.msg_id,
              })
              expired++
              continue
            }

            const requeued = { ...payload, dlq_retry_at: Date.now() }
            const { error: enqErr } = await supabase.rpc('enqueue_email', {
              queue_name: queue,
              payload: requeued,
            })
            if (enqErr) {
              console.error('retry-email-dlq: enqueue failed', { queue, enqErr })
              continue
            }
            await supabase.rpc('delete_email', {
              queue_name: dlq,
              message_id: row.msg_id,
            })
            await supabase.from('email_send_log').insert({
              message_id: messageId,
              template_name: (payload.label || queue) as string,
              recipient_email: (payload.to ?? '') as string,
              status: 'dlq_retried',
              error_message: null,
            })
            retried++
          }

          report[dlq] = { retried, expired }
        }

        return Response.json({ ok: true, report })
      },
    },
  },
})
