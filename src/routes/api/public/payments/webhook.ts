import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

async function handlePromotionSession(session: any, env: StripeEnv) {
  const md = session.metadata ?? {};
  if (md.kind !== "company_promotion") return;
  if (session.payment_status !== "paid") return;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing } = await supabaseAdmin
    .from("company_promotions")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) return;

  const days = Math.max(1, parseInt(md.days ?? "1", 10));
  const now = new Date();
  const endsAt = new Date(now.getTime() + days * 86_400_000);

  await supabaseAdmin.from("company_promotions").insert({
    company_id: md.company_id,
    starts_at: now.toISOString(),
    ends_at: endsAt.toISOString(),
    source: "paid",
    status: "active",
    stripe_session_id: session.id,
    stripe_environment: env,
    plan_code: md.plan ?? null,
    amount_cents: session.amount_total ?? null,
    days_purchased: days,
    created_by: md.userId ?? null,
  });
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  if (
    event.type === "checkout.session.completed" ||
    event.type === "transaction.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    await handlePromotionSession(event.data.object, env);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
