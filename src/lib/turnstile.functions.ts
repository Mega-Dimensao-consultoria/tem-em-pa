import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestIP } from "@tanstack/react-start/server";

/**
 * Valida o token do Cloudflare Turnstile no servidor.
 * Retorna { ok: true } se o token é válido, ou { ok: false, error } caso contrário.
 */
export const verifyTurnstileToken = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ token: z.string().trim().min(10).max(4096) }).parse(input),
  )
  .handler(async ({ data }) => {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      // Falha aberta em dev se não houver secret — em prod ele estará configurado.
      return { ok: false as const, error: "captcha_not_configured" };
    }

    let remoteip: string | undefined;
    try {
      remoteip = getRequestIP({ xForwardedFor: true }) ?? undefined;
    } catch {
      remoteip = undefined;
    }

    const body = new URLSearchParams();
    body.append("secret", secret);
    body.append("response", data.token);
    if (remoteip) body.append("remoteip", remoteip);

    try {
      const res = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        { method: "POST", body },
      );
      const json = (await res.json()) as {
        success: boolean;
        "error-codes"?: string[];
      };
      if (!json.success) {
        return {
          ok: false as const,
          error: json["error-codes"]?.join(",") ?? "verification_failed",
        };
      }
      return { ok: true as const };
    } catch {
      return { ok: false as const, error: "network_error" };
    }
  });
