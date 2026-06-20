import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

/** Returns full user info (profile + auth metadata) for the admin user editor. */
export const adminGetUserDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, avatar_url, phone, is_banned, created_at, updated_at")
      .eq("id", data.userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    const { data: authUser, error: aErr } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (aErr) throw new Error(aErr.message);
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    return {
      profile,
      email: authUser.user?.email ?? null,
      email_confirmed_at: authUser.user?.email_confirmed_at ?? null,
      last_sign_in_at: authUser.user?.last_sign_in_at ?? null,
      created_at: authUser.user?.created_at ?? null,
      provider: authUser.user?.app_metadata?.provider ?? null,
      roles: (roles ?? []).map((r) => r.role as string),
    };
  });

/** Updates the profile fields of any user (admin only). */
export const adminUpdateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        full_name: z.string().trim().max(120).nullable().optional(),
        phone: z.string().trim().max(40).nullable().optional(),
        avatar_url: z.string().trim().max(500).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.full_name !== undefined) patch.full_name = data.full_name || null;
    if (data.phone !== undefined) patch.phone = data.phone || null;
    if (data.avatar_url !== undefined) patch.avatar_url = data.avatar_url || null;
    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Sends a password-recovery email to the user. */
export const adminSendPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authUser, error: aErr } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (aErr) throw new Error(aErr.message);
    const email = authUser.user?.email;
    if (!email) throw new Error("Usuário sem e-mail cadastrado");
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const, email };
  });

/** Permanently deletes a user account (admin only). */
export const adminDeleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) {
      throw new Error("Você não pode excluir a sua própria conta por aqui.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
