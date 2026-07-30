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
const MAX_RETRIES = 3
const BATCH_SIZE = 25
const VISIBILITY_SECONDS = 60

const QUEUES = ['auth_emails', 'transactional_emails'] as const

export const Route = createFileRoute('/api/public/hooks/retry-email-dlq')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Requires a server-only shared secret. The Supabase publishable key
        // ships in the client bundle and MUST NOT be accepted here.
        const providedSecret = request.headers.get('x-dispatch-secret')
        const expectedSecret = process.env.PUSH_DISPATCH_SECRET
        if (!expectedSecret || providedSecret !== expectedSecret) {
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
            // `enqueued_at` is not always present; fall back to `queued_at`
            // (ISO string set by the enqueue helpers) so old payloads expire
            // instead of being retried forever.
            const enqueuedAt =
              Number(payload.enqueued_at ?? 0) ||
              (payload.queued_at ? Date.parse(String(payload.queued_at)) : 0)
            const retryCount = Number(payload.dlq_retry_count ?? 0)
            const messageId = String(payload.message_id ?? row.msg_id)

            const tooOld = enqueuedAt ? enqueuedAt < cutoff : retryCount >= MAX_RETRIES
            if (tooOld || retryCount >= MAX_RETRIES) {
              await supabase.from('email_send_log').insert({
                message_id: messageId,
                template_name: (payload.label || queue) as string,
                recipient_email: (payload.to ?? '') as string,
                status: 'failed',
                error_message: `descartado: idade > ${MAX_AGE_HOURS}h ou ${MAX_RETRIES} tentativas`,
              })
              await supabase.rpc('delete_email', {
                queue_name: dlq,
                message_id: row.msg_id,
              })
              expired++
              continue
            }

            const requeued = {
              ...payload,
              dlq_retry_at: Date.now(),
              dlq_retry_count: retryCount + 1,
            }
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
              status: 'pending',
              error_message: 'reenfileirado a partir da DLQ',

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
