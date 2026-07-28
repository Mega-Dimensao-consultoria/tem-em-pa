import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminKeys } from "./keys";

export type AdminStats = {
  companiesTotal: number;
  companiesApproved: number;
  companiesPending: number;
  companiesRejected: number;
  claimsPending: number;
  removalsPending: number;
  reviewsTotal: number;
  reviewsPending: number;
  reportsPending: number;
  users: number;
  contactMessagesPending: number;
  contactMessagesTotal: number;
  blogPostsTotal: number;
  blogPostsPublished: number;
  sitePagesTotal: number;
  cities: number;
  neighborhoods: number;
  categories: number;
};

const KEY_MAP: Record<string, keyof AdminStats> = {
  companies_total: "companiesTotal",
  companies_approved: "companiesApproved",
  companies_pending: "companiesPending",
  companies_rejected: "companiesRejected",
  claims_pending: "claimsPending",
  removals_pending: "removalsPending",
  reviews_total: "reviewsTotal",
  reviews_pending: "reviewsPending",
  reports_pending: "reportsPending",
  users_total: "users",
  contact_pending: "contactMessagesPending",
  contact_total: "contactMessagesTotal",
  blog_total: "blogPostsTotal",
  blog_published: "blogPostsPublished",
  pages_total: "sitePagesTotal",
  cities_total: "cities",
  neighborhoods_total: "neighborhoods",
  categories_total: "categories",
};

function zeroStats(): AdminStats {
  return {
    companiesTotal: 0,
    companiesApproved: 0,
    companiesPending: 0,
    companiesRejected: 0,
    claimsPending: 0,
    removalsPending: 0,
    reviewsTotal: 0,
    reviewsPending: 0,
    reportsPending: 0,
    users: 0,
    contactMessagesPending: 0,
    contactMessagesTotal: 0,
    blogPostsTotal: 0,
    blogPostsPublished: 0,
    sitePagesTotal: 0,
    cities: 0,
    neighborhoods: 0,
    categories: 0,
  };
}

async function fetchAdminStats(): Promise<AdminStats> {
  // Reads from admin_stats_cache — exact counts kept in sync by triggers.
  // Instant even at 200k+ rows.
  const { data, error } = await supabase
    .from("admin_stats_cache")
    .select("key, value");
  if (error) throw error;
  const out = zeroStats();
  for (const row of data ?? []) {
    const field = KEY_MAP[row.key as string];
    if (field) out[field] = Number(row.value) || 0;
  }
  return out;
}

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: fetchAdminStats,
    // Refresh on window focus / every minute so the cards feel live after mutations.
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
}

export async function reseedAdminStats(): Promise<void> {
  const { error } = await supabase.rpc("admin_reseed_stats");
  if (error) throw error;
}
