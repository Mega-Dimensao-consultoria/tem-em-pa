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

export const adminListContactMessages = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase
      .from('contact_messages')
      .select(
        'id, full_name, email, subject, message, status, admin_reply, replied_at, replied_by, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) throw new Error(error.message)
    return data ?? []
  })

export const adminMarkContactRead = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase
      .from('contact_messages')
      .update({ status: 'read' })
      .eq('id', data.id)
      .eq('status', 'new')
    if (error) throw new Error(error.message)
    return { ok: true as const }
  })

export const adminDeleteContactMessage = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase
      .from('contact_messages')
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true as const }
  })

export const adminReplyContactMessage = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        reply: z.string().trim().min(2).max(4000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)

    const { data: msg, error: fErr } = await context.supabase
      .from('contact_messages')
      .select('id, full_name, email, subject, message')
      .eq('id', data.id)
      .maybeSingle()
    if (fErr) throw new Error(fErr.message)
    if (!msg) throw new Error('Mensagem não encontrada')

    const { error: uErr } = await context.supabase
      .from('contact_messages')
      .update({
        status: 'replied',
        admin_reply: data.reply,
        replied_at: new Date().toISOString(),
        replied_by: context.userId,
      })
      .eq('id', data.id)
    if (uErr) throw new Error(uErr.message)

    // Send the reply email using the service-role client (the user-scoped
    // client cannot insert into email_send_log / call enqueue_email RPC).
    try {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
      const { enqueueContactEmail } = await import('@/lib/contact-email.server')
      await enqueueContactEmail({
        supabase: supabaseAdmin,
        templateName: 'contact-reply',
        to: msg.email,
        messageId: `contact-reply-${data.id}-${Date.now()}`,
        data: {
          fullName: msg.full_name,
          subjectLine: msg.subject,
          originalMessage: msg.message,
          reply: data.reply,
        },
      })
    } catch {
      // reply is persisted even if email enqueue fails
    }
    return { ok: true as const }
  })
