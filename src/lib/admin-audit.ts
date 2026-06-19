import { supabase } from "@/integrations/supabase/client";

export async function logAdminAction(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details?: Record<string, unknown>,
) {
  try {
    await supabase.from("admin_audit_log").insert({
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: (details ?? null) as never,
    });
  } catch {
    // best-effort — never block primary admin action
  }
}
