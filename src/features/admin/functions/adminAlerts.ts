import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc('has_role', {
    _user_id: ctx.userId,
    _role: 'admin',
  })
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Forbidden')
}

/** Lists every address that receives administrative alerts. */
export const adminGetAlertRecipients = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { getAdminRecipients } = await import('@/lib/admin-recipients.server')
    const recipients = await getAdminRecipients(supabaseAdmin)
    const { data: setting } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'admin_notification_emails')
      .maybeSingle()
    return { recipients, extras: (setting?.value ?? '') as string }
  })

/** Saves extra (non-user) addresses that should also receive admin alerts. */
export const adminSetAlertExtras = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ extras: z.string().trim().max(1000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error } = await supabaseAdmin
      .from('app_settings')
      .upsert({ key: 'admin_notification_emails', value: data.extras }, { onConflict: 'key' })
    if (error) throw new Error(error.message)
    return { ok: true as const }
  })

/** Clears e-mails stuck in the dead-letter queues. */
export const adminPurgeEmailDlq = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase.rpc('purge_email_dlq')
    if (error) throw new Error(error.message)
    return data as Record<string, number>
  })

/** Histórico de envios de e-mail (somente admin). */
export const adminGetEmailLog = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z.enum(['all', 'sent', 'pending', 'failed', 'suppressed']).default('all'),
        search: z.string().trim().max(200).default(''),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(10).max(100).default(15),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const from = (data.page - 1) * data.pageSize
    let q = supabaseAdmin
      .from('email_send_log')
      .select(
        'id, message_id, template_name, recipient_email, status, error_message, created_at',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(from, from + data.pageSize - 1)

    if (data.status !== 'all') q = q.eq('status', data.status)
    if (data.search) {
      q = q.or(
        `recipient_email.ilike.%${data.search}%,template_name.ilike.%${data.search}%`,
      )
    }

    const { data: rows, count, error } = await q
    if (error) throw new Error(error.message)
    return { rows: rows ?? [], total: count ?? 0 }
  })

/** Resumo por status dos últimos 30 dias. */
export const adminGetEmailStats = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const statuses = ['sent', 'pending', 'failed', 'suppressed'] as const
    const out: Record<string, number> = {}
    for (const s of statuses) {
      const { count } = await supabaseAdmin
        .from('email_send_log')
        .select('id', { count: 'exact', head: true })
        .eq('status', s)
        .gte('created_at', since)
      out[s] = count ?? 0
    }
    return out
  })

/** Re-enviar um e-mail que falhou. */
export const adminRetryEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    
    const { data: logEntry, error: logError } = await supabaseAdmin
      .from('email_send_log')
      .select('*')
      .eq('id', data.id)
      .single()

    if (logError || !logEntry) throw new Error('E-mail não encontrado')
    
    const { error } = await supabaseAdmin.rpc('retry_email_by_id', { _message_id: logEntry.message_id })
    if (error) throw new Error(error.message)
    
    return { ok: true }
  })
