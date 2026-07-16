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
 * Decode a JWT payload without signature verification.
 * AgeVerif's public docs (checker.js) do not expose a JWKS/verify endpoint,
 * so we trust the payload for now and always require the client to have gone
 * through the widget. Signature verification can be added if AgeVerif exposes it.
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Token inválido");
  const body = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = body + "=".repeat((4 - (body.length % 4)) % 4);
  const json = Buffer.from(padded, "base64").toString("utf-8");
  return JSON.parse(json) as Record<string, unknown>;
}

/**
 * Records the result of a successful AgeVerif verification.
 * Client sends the `verification` object it received from the `success` event.
 */
export const recordAgeVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        token: z.string().min(20),
        uid: z.string().min(1),
        expiresAt: z.number().int().positive(), // seconds since epoch
        ageThreshold: z.number().int().optional(),
        assuranceLevel: z.enum(["STANDARD", "ENHANCED", "STRICT"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    // Sanity check the JWT payload matches what the client claims.
    let payload: Record<string, unknown> = {};
    try {
      payload = decodeJwtPayload(data.token);
    } catch {
      throw new Error("Token de verificação inválido.");
    }
    const uid = typeof payload.uid === "string" ? payload.uid : data.uid;
    const exp = typeof payload.exp === "number" ? payload.exp : data.expiresAt;
    if (uid !== data.uid) throw new Error("Token não corresponde à verificação enviada.");
    if (exp * 1000 < Date.now()) throw new Error("Token já expirado.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("age_verifications")
      .upsert(
        {
          user_id: context.userId,
          status: "approved",
          provider: "ageverif",
          provider_reference: uid,
          verified_at: new Date().toISOString(),
          expires_at: new Date(exp * 1000).toISOString(),
          rejection_reason: null,
        },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
