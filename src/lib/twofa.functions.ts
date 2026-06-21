import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Deletes all MFA factors of the currently signed-in user. Used as the last
 * step of the "I lost my device" e-mail recovery flow: after the user proves
 * ownership via Supabase email OTP, their account is downgraded out of MFA so
 * they can sign in again.
 */
export const resetMyMfa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.mfa.listFactors({
      userId: context.userId,
    });
    if (error) throw new Error(error.message);
    for (const f of data?.factors ?? []) {
      await supabaseAdmin.auth.admin.mfa.deleteFactor({
        userId: context.userId,
        id: f.id,
      });
    }
    return { ok: true as const, removed: data?.factors?.length ?? 0 };
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
