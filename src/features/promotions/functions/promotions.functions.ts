import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

type Plan = "daily" | "monthly";
const PLAN_META: Record<Plan, { priceLookup: string; days: number; unitLabel: string }> = {
  daily: { priceLookup: "promotion_daily_490", days: 1, unitLabel: "dia(s)" },
  monthly: { priceLookup: "promotion_monthly_5000", days: 30, unitLabel: "mês(es) de 30 dias" },
};

type CheckoutResult = { clientSecret: string } | { error: string };

export const createPromotionCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      companyId: z.string().uuid(),
      plan: z.enum(["daily", "monthly"]),
      quantity: z.number().int().min(1).max(90),
      returnUrl: z.string().url(),
      environment: z.enum(["sandbox", "live"]),
    }).parse(input),
  )
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const { supabase, userId } = context;

    // Ownership OR admin
    const { data: company } = await supabase
      .from("companies")
      .select("id, name, owner_id, status")
      .eq("id", data.companyId)
      .maybeSingle();
    if (!company) return { error: "Empresa não encontrada" };

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId, _role: "admin",
    });
    if (company.owner_id !== userId && !isAdmin) return { error: "Você não é dono desta empresa" };
    if (company.status !== "approved") return { error: "A empresa precisa estar aprovada" };

    // Eligibility check
    const { data: elig } = await supabase.rpc("company_promotion_eligibility", {
      _company_id: data.companyId,
    });
    const row = Array.isArray(elig) ? elig[0] : elig;
    if (!row?.eligible) return { error: "A empresa não cumpre os requisitos para ser destacada" };

    const { data: { user } } = await supabase.auth.getUser();
    const meta = PLAN_META[data.plan as Plan];
    const totalDays = meta.days * data.quantity;

    try {
      const stripe = createStripeClient(data.environment as StripeEnv);
      const prices = await stripe.prices.list({ lookup_keys: [meta.priceLookup] });
      if (!prices.data.length) return { error: "Plano não configurado" };
      const price = prices.data[0];

      // Resolve/create customer with userId metadata
      let customerId: string | undefined;
      const found = await stripe.customers.search({
        query: `metadata['userId']:'${userId}'`, limit: 1,
      });
      if (found.data.length) customerId = found.data[0].id;
      if (!customerId && user?.email) {
        const byEmail = await stripe.customers.list({ email: user.email, limit: 1 });
        if (byEmail.data.length) {
          customerId = byEmail.data[0].id;
          await stripe.customers.update(customerId, { metadata: { userId } });
        }
      }
      if (!customerId) {
        const created = await stripe.customers.create({
          ...(user?.email && { email: user.email }),
          metadata: { userId },
        });
        customerId = created.id;
      }

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: data.quantity }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        payment_intent_data: {
          description: `Destaque para ${company.name} — ${totalDays} dia(s)`,
        },
        metadata: {
          kind: "company_promotion",
          userId,
          company_id: data.companyId,
          plan: data.plan,
          quantity: String(data.quantity),
          days: String(totalDays),
        },
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

type ConfirmResult =
  | { status: "activated"; promotionId: string; endsAt: string }
  | { status: "already_active"; promotionId: string; endsAt: string }
  | { status: "pending" }
  | { status: "not_paid" }
  | { error: string };

export const confirmPromotionPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      sessionId: z.string().min(3),
      environment: z.enum(["sandbox", "live"]),
    }).parse(input),
  )
  .handler(async ({ data, context }): Promise<ConfirmResult> => {
    const { userId } = context;
    try {
      const stripe = createStripeClient(data.environment as StripeEnv);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);

      const md = session.metadata ?? {};
      if (md.kind !== "company_promotion") return { error: "Sessão inválida" };
      if (md.userId !== userId) return { error: "Sessão de outro usuário" };
      if (session.payment_status !== "paid") return { status: "not_paid" };

      const companyId = md.company_id as string;
      const days = Math.max(1, parseInt(md.days ?? "1", 10));

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      // Idempotent: unique on stripe_session_id
      const { data: existing } = await supabaseAdmin
        .from("company_promotions")
        .select("id, ends_at, status")
        .eq("stripe_session_id", data.sessionId)
        .maybeSingle();
      if (existing) {
        return { status: "already_active", promotionId: existing.id as string, endsAt: existing.ends_at as string };
      }

      const now = new Date();
      const endsAt = new Date(now.getTime() + days * 86_400_000);

      const { data: inserted, error: insErr } = await supabaseAdmin
        .from("company_promotions")
        .insert({
          company_id: companyId,
          starts_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
          source: "paid",
          status: "active",
          stripe_session_id: data.sessionId,
          stripe_environment: data.environment,
          plan_code: (md.plan as string) ?? null,
          amount_cents: session.amount_total ?? null,
          days_purchased: days,
          created_by: userId,
        })
        .select("id, ends_at")
        .single();
      if (insErr) return { error: insErr.message };

      return { status: "activated", promotionId: inserted!.id as string, endsAt: inserted!.ends_at as string };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const adminGrantPromotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      companyId: z.string().uuid(),
      startsAt: z.string(),
      endsAt: z.string(),
    }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ promotionId: string } | { error: string }> => {
    const { data: newId, error } = await context.supabase.rpc("admin_grant_promotion", {
      _company_id: data.companyId,
      _starts_at: data.startsAt,
      _ends_at: data.endsAt,
    });
    if (error) return { error: error.message };
    return { promotionId: newId as string };
  });

export const adminCancelPromotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ promotionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ok: true } | { error: string }> => {
    const { error } = await context.supabase.rpc("admin_cancel_promotion", {
      _promotion_id: data.promotionId,
    });
    if (error) return { error: error.message };
    return { ok: true };
  });
