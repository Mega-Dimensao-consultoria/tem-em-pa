import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { toastError } from "@/lib/safe";
import { useAuth } from "@/features/auth/use-auth";
import { adminKeys } from "./keys";
import { logAdminAction } from "./audit";

export type DupCandidate = {
  id: string;
  name: string;
  city: string | null;
  neighborhood: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  created_at: string;
};

export type DupGroup = {
  key: string;
  reason: "name" | "phone";
  items: DupCandidate[];
};

const coreName = coreCompanyName;


function digits(s: string | null | undefined): string {
  return (s ?? "").replace(/\D+/g, "");
}

type RawDupRow = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  created_at: string;
  city_id: string | null;
  cities: { name: string | null } | null;
  neighborhoods: { name: string | null } | null;
};


export function useDuplicateGroups() {
  return useQuery({
    queryKey: [...adminKeys.all, "duplicates"] as const,
    queryFn: async (): Promise<DupGroup[]> => {
      const { data, error } = await supabase
        .from("companies")
        .select(
          "id, name, phone, whatsapp, status, created_at, city_id, cities:city_id(name), neighborhoods:neighborhood_id(name)",
        )
        .in("status", ["approved", "pending", "claimed_pending", "rejected"])
        .order("created_at", { ascending: true })
        .limit(2000);
      if (error) throw error;
      const rows: (DupCandidate & { cityId: string | null })[] = (
        (data ?? []) as unknown as RawDupRow[]
      ).map((r) => ({
        id: r.id,
        name: r.name,
        city: r.cities?.name ?? null,
        cityId: r.city_id,
        neighborhood: r.neighborhoods?.name ?? null,
        phone: r.phone,
        whatsapp: r.whatsapp,
        status: r.status,
        created_at: r.created_at,
      }));

      const byName = new Map<string, DupCandidate[]>();
      const byPhone = new Map<string, DupCandidate[]>();

      for (const r of rows) {
        // Nome completo sem prefixo institucional genérico, sempre escopado
        // pela cidade — prefeituras/escolas de cidades diferentes não colidem.
        const core = coreName(r.name);
        if (core.length >= 4) {
          const nk = `${r.cityId ?? "-"}|${core}`;
          const arr = byName.get(nk) ?? [];
          arr.push(r);
          byName.set(nk, arr);
        }
        for (const d of [digits(r.phone), digits(r.whatsapp)]) {
          if (d.length >= 8) {
            const pk = `${r.cityId ?? "-"}|${d}`;
            const arr = byPhone.get(pk) ?? [];
            if (!arr.find((x) => x.id === r.id)) arr.push(r);
            byPhone.set(pk, arr);
          }
        }
      }


      const groups: DupGroup[] = [];
      for (const [k, items] of byName) {
        if (items.length >= 2) groups.push({ key: `name:${k}`, reason: "name", items });
      }
      for (const [k, items] of byPhone) {
        if (items.length >= 2) groups.push({ key: `phone:${k}`, reason: "phone", items });
      }
      return groups.sort((a, b) => b.items.length - a.items.length);
    },
  });
}

export function useMergeCompanies() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (vars: {
      sourceId: string;
      targetId: string;
      sourceName: string;
      targetName: string;
    }) => {
      const { error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ error: unknown }>)("admin_merge_companies", {
        _source_id: vars.sourceId,
        _target_id: vars.targetId,
      });
      if (error) throw error;
    },
    onError: (e) => toastError(e, "Falha ao mesclar empresas"),
    onSuccess: async (_d, vars) => {
      if (user) {
        await logAdminAction(user.id, "company.merge", "company", vars.targetId, {
          source_id: vars.sourceId,
          source_name: vars.sourceName,
          target_name: vars.targetName,
        });
      }
      toast.success("Empresas mescladas");
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}
