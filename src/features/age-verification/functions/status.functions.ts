import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AgeVerificationStatus = "not_started" | "pending" | "approved" | "rejected" | "expired";

export type AgeVerification = {
  status: AgeVerificationStatus;
  verified_at: string | null;
  expires_at: string | null;
  rejection_reason: string | null;
  provider: string;
};

function isExpired(expires_at: string | null): boolean {
  if (!expires_at) return false;
  return new Date(expires_at).getTime() < Date.now();
}

/** Read the current user's age verification record. */
export const getMyAgeVerification = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AgeVerification> => {
    const { data, error } = await context.supabase
      .from("age_verifications")
      .select("status, verified_at, expires_at, rejection_reason, provider")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      return {
        status: "not_started",
        verified_at: null,
        expires_at: null,
        rejection_reason: null,
        provider: "ageverif",
      };
    }
    const status = (data.status as AgeVerificationStatus) ?? "pending";
    const effective: AgeVerificationStatus =
      status === "approved" && isExpired(data.expires_at) ? "expired" : status;
    return {
      status: effective,
      verified_at: data.verified_at,
      expires_at: data.expires_at,
      rejection_reason: data.rejection_reason,
      provider: data.provider ?? "ageverif",
    };
  });

/**
 * Starts a new age verification flow with the configured provider.
 * Returns a redirect URL the user must open to complete verification.
 */
export const startAgeVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ returnUrl: z.string().url() }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ redirectUrl: string }> => {
    const apiKey = process.env.AGEVERIF_API_KEY;
    const baseUrl = process.env.AGEVERIF_BASE_URL;
    if (!apiKey || !baseUrl) {
      throw new Error(
        "A integração com o provedor de verificação de idade ainda não está configurada. Contate o suporte.",
      );
    }

    // Upsert a pending record so we track the request even before the callback.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const reference = crypto.randomUUID();
    const { error: upsertErr } = await supabaseAdmin
      .from("age_verifications")
      .upsert(
        {
          user_id: context.userId,
          status: "pending",
          provider: "ageverif",
          provider_reference: reference,
          rejection_reason: null,
          verified_at: null,
          expires_at: null,
        },
        { onConflict: "user_id" },
      );
    if (upsertErr) throw new Error(upsertErr.message);

    // Provider-specific handshake. Adjust body/headers to match AgeVerif's API.
    const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/verifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        external_reference: reference,
        return_url: data.returnUrl,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Falha ao iniciar verificação (${resp.status}): ${text.slice(0, 200)}`);
    }
    const payload = (await resp.json()) as { redirect_url?: string; url?: string };
    const redirectUrl = payload.redirect_url ?? payload.url;
    if (!redirectUrl) throw new Error("Provedor não retornou URL de redirecionamento.");
    return { redirectUrl };
  });
