import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminKeys } from "./keys";
import { useAdminMutation } from "./_mutation";

export type AdminCompany = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  status: string;
  created_at: string;
};

export type PendingCompany = AdminCompany;

export type FlaggedCompany = AdminCompany & {
  pending_claims: number;
  pending_reports: number;
};

export function usePendingCompanies() {
  return useQuery({
    queryKey: adminKeys.pendingCompanies(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, description, city, status, created_at")
        .in("status", ["pending", "claimed_pending"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PendingCompany[];
    },
  });
}

export function useAllCompanies() {
  return useQuery({
    queryKey: [...adminKeys.all, "all-companies"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, description, city, status, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as AdminCompany[];
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
      (reports ?? []).forEach((r: any) => {
        const cid = r.reviews?.company_id;
        if (cid) reportsByCompany.set(cid, (reportsByCompany.get(cid) ?? 0) + 1);
      });

      const ids = Array.from(new Set([...claimsByCompany.keys(), ...reportsByCompany.keys()]));
      if (ids.length === 0) return [];

      const { data: companies, error: coErr } = await supabase
        .from("companies")
        .select("id, name, description, city, status, created_at")
        .in("id", ids);
      if (coErr) throw coErr;

      return (companies ?? []).map((c) => ({
        ...(c as AdminCompany),
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
      const { error } = await supabase
        .from("companies")
        .update({ status })
        .eq("id", id);
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

/** Suspend a published company (hides it from the public catalog). */
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

/** Re-publish a previously rejected/suspended company. */
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

/** Permanently delete a company and all related records (cascade). */
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

