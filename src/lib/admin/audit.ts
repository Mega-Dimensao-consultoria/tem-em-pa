import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminKeys } from "./keys";

export type AuditLogRow = {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: unknown;
  created_at: string;
};

export function useAuditLog(limit = 200) {
  return useQuery({
    queryKey: adminKeys.auditLog(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select(
          "id, actor_id, action, entity_type, entity_id, details, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as AuditLogRow[];
    },
  });
}
