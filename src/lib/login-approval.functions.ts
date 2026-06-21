import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const APPROVAL_TTL_SEC = 180;

/**
 * Creates a pending login-approval request and inserts a notification so the
 * user's other logged-in devices receive a push prompt. Returns the request
 * id + ttl so the caller can poll for status.
 */
export const requestLoginApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Make sure the user has at least one push subscription, otherwise the
    // prompt would never arrive.
    const { count } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId);
    if (!count || count === 0) {
      throw new Error(
        "Você ainda não tem dispositivos com notificações ativas. Ative as notificações em outro dispositivo já logado antes de usar esse método.",
      );
    }

    let ip: string | null = null;
    let userAgent: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
      userAgent = getRequestHeader("user-agent") ?? null;
    } catch {
      /* ignore */
    }

    const expiresAt = new Date(Date.now() + APPROVAL_TTL_SEC * 1000).toISOString();
    const { data: req, error: insErr } = await supabaseAdmin
      .from("login_approval_requests")
      .insert({
        user_id: context.userId,
        status: "pending",
        expires_at: expiresAt,
        requester_ip: ip,
        requester_user_agent: userAgent,
      })
      .select("id")
      .single();
    if (insErr || !req) throw new Error(insErr?.message ?? "Falha ao criar solicitação.");

    // Notification triggers the existing push dispatch automatically.
    await supabaseAdmin.from("notifications").insert({
      user_id: context.userId,
      type: "login_approval",
      title: "Tentativa de login",
      message:
        "Alguém está tentando entrar na sua conta. Se for você, toque para aprovar.",
      link: `/aprovar-login?token=${req.id}`,
      metadata: {
        approval_id: req.id,
        ip,
        user_agent: userAgent,
      },
    });

    return { id: req.id, ttlSec: APPROVAL_TTL_SEC, expiresAt };
  });

/**
 * Polled by the login page. Returns the current status of an approval
 * request owned by the caller, downgrading expired pending rows.
 */
export const getLoginApprovalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("login_approval_requests")
      .select("id, status, expires_at, approved_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Solicitação não encontrada.");
    if (row.status === "pending" && new Date(row.expires_at).getTime() < Date.now()) {
      // Caller-side expiry; mark it so future polls see the right state.
      await context.supabase
        .from("login_approval_requests")
        .update({ status: "expired" })
        .eq("id", row.id)
        .eq("status", "pending");
      return { ...row, status: "expired" as const };
    }
    return row;
  });

/**
 * Called by the user on an already-logged-in device when they tap "approve"
 * or "deny" on the login prompt.
 */
export const respondLoginApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        approve: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("login_approval_requests")
      .select("id, status, expires_at, user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Solicitação não encontrada.");
    if (row.user_id !== context.userId) throw new Error("Forbidden");
    if (row.status !== "pending") {
      throw new Error("Essa solicitação já foi respondida ou expirou.");
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await context.supabase
        .from("login_approval_requests")
        .update({ status: "expired" })
        .eq("id", row.id);
      throw new Error("A solicitação expirou. Tente novamente no outro dispositivo.");
    }
    const nextStatus = data.approve ? "approved" : "denied";
    const { error: upErr } = await context.supabase
      .from("login_approval_requests")
      .update({
        status: nextStatus,
        approved_at: data.approve ? new Date().toISOString() : null,
      })
      .eq("id", row.id)
      .eq("status", "pending");
    if (upErr) throw new Error(upErr.message);
    return { ok: true as const, status: nextStatus };
  });
