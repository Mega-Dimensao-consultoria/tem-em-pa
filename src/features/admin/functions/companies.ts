import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminKeys } from "./keys";
import { useAdminMutation } from "./_mutation";

export type AdminCompany = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  city_id: string | null;
  city_slug: string | null;
  status: string;
  created_at: string;
};

export type PendingCompany = AdminCompany;

export type FlaggedCompany = AdminCompany & {
  pending_claims: number;
  pending_reports: number;
};

type RawAdminRow = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  city_id: string | null;
  cities: { name: string | null; slug: string | null } | null;
};

function toAdmin(rows: RawAdminRow[]): AdminCompany[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    city: r.cities?.name ?? null,
    city_id: r.city_id,
    city_slug: r.cities?.slug ?? null,
    status: r.status,
    created_at: r.created_at,
  }));
}

const ADMIN_SELECT =
  "id, name, description, status, created_at, city_id, cities:city_id(name, slug)" as const;

export function usePendingCompanies() {
  return useQuery({
    queryKey: adminKeys.pendingCompanies(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select(ADMIN_SELECT)
        .in("status", ["pending", "claimed_pending"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return toAdmin((data ?? []) as unknown as RawAdminRow[]) as PendingCompany[];
    },
  });
}

export function useAllCompanies() {
  return useQuery({
    queryKey: [...adminKeys.all, "all-companies"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select(ADMIN_SELECT)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return toAdmin((data ?? []) as unknown as RawAdminRow[]);
    },
  });
}

export function useFlaggedCompanies() {
  return useQuery({
    queryKey: [...adminKeys.all, "flagged-companies"] as const,
    queryFn: async (): Promise<FlaggedCompany[]> => {
      const { data: claims, error: cErr } = await supabase
        .from("company_claims")
        .select("company_id")
        .eq("status", "pending");
      if (cErr) throw cErr;

      const { data: reports, error: rErr } = await supabase
        .from("review_reports")
        .select("review_id, reviews:review_id(company_id)")
        .eq("status", "pending");
      if (rErr) throw rErr;

      const claimsByCompany = new Map<string, number>();
      (claims ?? []).forEach((c) => {
        claimsByCompany.set(c.company_id, (claimsByCompany.get(c.company_id) ?? 0) + 1);
      });
      const reportsByCompany = new Map<string, number>();
      (reports ?? []).forEach((r: { reviews: { company_id: string } | null }) => {
        const cid = r.reviews?.company_id;
        if (cid) reportsByCompany.set(cid, (reportsByCompany.get(cid) ?? 0) + 1);
      });

      const ids = Array.from(new Set([...claimsByCompany.keys(), ...reportsByCompany.keys()]));
      if (ids.length === 0) return [];

      const { data: companies, error: coErr } = await supabase
        .from("companies")
        .select(ADMIN_SELECT)
        .in("id", ids);
      if (coErr) throw coErr;

      const admins = toAdmin((companies ?? []) as unknown as RawAdminRow[]);
      return admins.map((c) => ({
        ...c,
        pending_claims: claimsByCompany.get(c.id) ?? 0,
        pending_reports: reportsByCompany.get(c.id) ?? 0,
      }));
    },
  });
}

type Decision = "approved" | "rejected";

export function useDecideCompany() {
  return useAdminMutation<{ id: string; name: string; status: Decision }>({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from("companies").update({ status }).eq("id", id);
      if (error) throw error;
    },
    audit: ({ id, name, status }) => ({
      action: status === "approved" ? "company.approve" : "company.reject",
      entityType: "company",
      entityId: id,
      details: { name },
    }),
    successMessage: ({ status }) =>
      status === "approved" ? "Empresa aprovada" : "Empresa rejeitada",
  });
}

export function useSuspendCompany() {
  return useAdminMutation<{ id: string; name: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase
        .from("companies")
        .update({ status: "rejected" })
        .eq("id", id);
      if (error) throw error;
    },
    audit: ({ id, name }) => ({
      action: "company.suspend",
      entityType: "company",
      entityId: id,
      details: { name },
    }),
    successMessage: "Empresa suspensa",
  });
}

export function useRepublishCompany() {
  return useAdminMutation<{ id: string; name: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase
        .from("companies")
        .update({ status: "approved" })
        .eq("id", id);
      if (error) throw error;
    },
    audit: ({ id, name }) => ({
      action: "company.republish",
      entityType: "company",
      entityId: id,
      details: { name },
    }),
    successMessage: "Empresa republicada",
  });
}

export function useDeleteCompany() {
  return useAdminMutation<{ id: string; name: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    audit: ({ id, name }) => ({
      action: "company.delete",
      entityType: "company",
      entityId: id,
      details: { name },
    }),
    successMessage: "Empresa removida",
  });
}
