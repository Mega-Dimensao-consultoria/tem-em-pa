import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SITE_NAME = "tem-em-pa";
const SENDER_DOMAIN = "notificacoes.sistemas.megadimensao.com.br";
const FROM_DOMAIN = "notificacoes.sistemas.megadimensao.com.br";
const OTP_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;

async function sha256Hex(input: string) {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generates a 6-digit OTP, stores its hash in two_fa_email_otp, renders the
 * branded e-mail and enqueues it for the user's own e-mail. Caller must be
 * authenticated (AAL1 session is enough — the user just verified their
 * password).
 */
export const requestTwoFaEmailOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get the user's e-mail
    const { data: userRes, error: uErr } =
      await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (uErr || !userRes?.user?.email) {
      throw new Error("Sua conta não tem e-mail cadastrado.");
    }
    const email = userRes.user.email;
    const normalized = email.toLowerCase();

    // Refuse if e-mail is suppressed (bounced / complained / unsubscribed)
    const { data: suppressed } = await supabaseAdmin
      .from("suppressed_emails")
      .select("id")
      .eq("email", normalized)
      .maybeSingle();
    if (suppressed) {
      throw new Error(
        "Seu e-mail está bloqueado para envios. Contate o suporte para recuperar o acesso.",
      );
    }

    // Generate 6-digit code
    const buf = new Uint8Array(4);
    crypto.getRandomValues(buf);
    const num = ((buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8) | buf[3]) >>> 0;
    const code = (num % 1_000_000).toString().padStart(6, "0");
    const codeHash = await sha256Hex(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60_000).toISOString();

    const { error: upErr } = await supabaseAdmin
      .from("two_fa_email_otp")
      .upsert(
        {
          user_id: context.userId,
          code_hash: codeHash,
          expires_at: expiresAt,
          attempts: 0,
        },
        { onConflict: "user_id" },
      );
    if (upErr) throw new Error(upErr.message);

    // Render template
    const [{ default: React }, { render }, { template }] = await Promise.all([
      import("react"),
      import("@react-email/components"),
      import("@/lib/email-templates/two-fa-recovery"),
    ]);
    const element = React.createElement(template.component as any, {
      code,
      minutes: OTP_TTL_MIN,
    });
    const html = await render(element);
    const text = await render(element, { plainText: true });

    // Ensure unsubscribe token exists for this address
    let unsubscribeToken: string | null = null;
    const { data: existing } = await supabaseAdmin
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", normalized)
      .maybeSingle();
    if (existing?.token) {
      unsubscribeToken = existing.token;
    } else {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      unsubscribeToken = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      await supabaseAdmin
        .from("email_unsubscribe_tokens")
        .upsert(
          { token: unsubscribeToken, email: normalized },
          { onConflict: "email", ignoreDuplicates: true },
        );
      const { data: stored } = await supabaseAdmin
        .from("email_unsubscribe_tokens")
        .select("token")
        .eq("email", normalized)
        .maybeSingle();
      if (stored?.token) unsubscribeToken = stored.token;
    }

    const messageId = `two-fa-recovery-${context.userId}-${Date.now()}`;
    const subject =
      typeof template.subject === "function"
        ? (template.subject as (d: Record<string, any>) => string)({ code, minutes: OTP_TTL_MIN })
        : (template.subject as string);

    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: "two-fa-recovery",
      recipient_email: email,
      status: "pending",
    });

    const { error: enqErr } = await (supabaseAdmin.rpc as any)("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: email,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: "transactional",
        label: "two-fa-recovery",
        idempotency_key: messageId,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    });
    if (enqErr) {
      await supabaseAdmin.from("email_send_log").insert({
        message_id: messageId,
        template_name: "two-fa-recovery",
        recipient_email: email,
        status: "failed",
        error_message: enqErr.message,
      });
      throw new Error("Falha ao enviar o e-mail. Tente novamente em instantes.");
    }

    return { ok: true as const };
  });

/**
 * Verifies the 6-digit OTP submitted by the user. On success, removes every
 * MFA factor so the user can sign in normally and reconfigure 2FA.
 */
export const verifyTwoFaEmailOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().regex(/^\d{6}$/) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("two_fa_email_otp")
      .select("code_hash, expires_at, attempts")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Nenhum código pendente. Solicite um novo código.");

    if (new Date(row.expires_at).getTime() < Date.now()) {
      await supabaseAdmin
        .from("two_fa_email_otp")
        .delete()
        .eq("user_id", context.userId);
      throw new Error("O código expirou. Solicite um novo código.");
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      await supabaseAdmin
        .from("two_fa_email_otp")
        .delete()
        .eq("user_id", context.userId);
      throw new Error("Muitas tentativas. Solicite um novo código.");
    }

    const submittedHash = await sha256Hex(data.code);
    if (submittedHash !== row.code_hash) {
      await supabaseAdmin
        .from("two_fa_email_otp")
        .update({ attempts: row.attempts + 1 })
        .eq("user_id", context.userId);
      throw new Error("Código incorreto. Verifique e tente novamente.");
    }

    // Consume the OTP
    await supabaseAdmin
      .from("two_fa_email_otp")
      .delete()
      .eq("user_id", context.userId);

    // Remove every MFA factor
    const { data: list } = await supabaseAdmin.auth.admin.mfa.listFactors({
      userId: context.userId,
    });
    for (const f of list?.factors ?? []) {
      await supabaseAdmin.auth.admin.mfa.deleteFactor({
        userId: context.userId,
        id: f.id,
      });
    }
    return { ok: true as const, removed: list?.factors?.length ?? 0 };
  });


async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

/** Admin-only: remove every MFA factor from a target user. */
export const adminResetUserMfa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list, error } = await supabaseAdmin.auth.admin.mfa.listFactors({
      userId: data.userId,
    });
    if (error) throw new Error(error.message);
    for (const f of list?.factors ?? []) {
      await supabaseAdmin.auth.admin.mfa.deleteFactor({
        userId: data.userId,
        id: f.id,
      });
    }
    return { ok: true as const, removed: list?.factors?.length ?? 0 };
  });
