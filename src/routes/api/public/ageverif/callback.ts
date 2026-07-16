import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

/**
 * Webhook receiver for the AgeVerif provider.
 * The provider must POST a JSON body signed via HMAC-SHA256 with the shared
 * secret AGEVERIF_WEBHOOK_SECRET, sent in the `x-ageverif-signature` header.
 */
export const Route = createFileRoute("/api/public/ageverif/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.AGEVERIF_WEBHOOK_SECRET;
        if (!secret) return new Response("Not configured", { status: 503 });

        const signature = request.headers.get("x-ageverif-signature") ?? "";
        const body = await request.text();

        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const sig = Buffer.from(signature);
        const exp = Buffer.from(expected);
        if (sig.length !== exp.length || !timingSafeEqual(sig, exp)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const parsed = z
          .object({
            external_reference: z.string().min(1),
            status: z.enum(["approved", "rejected", "pending", "expired"]),
            verified_at: z.string().datetime().optional().nullable(),
            expires_at: z.string().datetime().optional().nullable(),
            rejection_reason: z.string().max(500).optional().nullable(),
          })
          .safeParse(JSON.parse(body));
        if (!parsed.success) return new Response("Invalid payload", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("age_verifications")
          .update({
            status: parsed.data.status,
            verified_at: parsed.data.verified_at ?? null,
            expires_at: parsed.data.expires_at ?? null,
            rejection_reason: parsed.data.rejection_reason ?? null,
          })
          .eq("provider_reference", parsed.data.external_reference);
        if (error) return new Response(error.message, { status: 500 });

        return new Response("ok");
      },
    },
  },
});
