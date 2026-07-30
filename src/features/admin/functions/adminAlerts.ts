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
