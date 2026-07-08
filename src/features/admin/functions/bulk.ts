import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { toastError } from "@/lib/safe";
import { useAuth } from "@/features/auth/use-auth";
import { adminKeys } from "./keys";
import { logAdminAction } from "./audit";

export type BulkAction = "approve" | "suspend" | "republish" | "delete";

async function applyOne(id: string, action: BulkAction) {
  if (action === "delete") {
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const status =
    action === "approve" ? "approved" : action === "suspend" ? "rejected" : "approved";
  const { error } = await supabase.from("companies").update({ status }).eq("id", id);
  if (error) throw error;
}

export function useBulkCompanyAction() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (vars: {
      action: BulkAction;
      items: { id: string; name: string }[];
    }) => {
      const results = { ok: 0, fail: 0 as number };
      for (const it of vars.items) {
        try {
          await applyOne(it.id, vars.action);
          results.ok += 1;
        } catch {
          results.fail += 1;
        }
      }
      return results;
    },
    onError: (e) => toastError(e, "Falha na ação em lote"),
    onSuccess: async (res, vars) => {
      if (user) {
        await logAdminAction(user.id, `company.bulk.${vars.action}`, "company", null, {
          count: vars.items.length,
          ok: res.ok,
          fail: res.fail,
          ids: vars.items.map((i) => i.id),
        });
      }
      toast.success(`${res.ok} concluída(s)${res.fail ? `, ${res.fail} falharam` : ""}`);
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}
