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

const HEAD = { count: "exact" as const, head: true };

async function unwrap(p: PromiseLike<{ count: number | null; error: unknown }>): Promise<number> {
  const { count, error } = await p;
  if (error) throw error;
  return count ?? 0;
}

async function fetchAdminStats(): Promise<AdminStats> {
  const [
    companiesTotal,
    companiesApproved,
    companiesPending,
    companiesRejected,
    claimsPending,
    removalsPending,
    reviewsTotal,
    reviewsPending,
    reportsPending,
    users,
    contactMessagesPending,
    contactMessagesTotal,
    blogPostsTotal,
    blogPostsPublished,
    sitePagesTotal,
    cities,
    neighborhoods,
    categories,
  ] = await Promise.all([
    unwrap(supabase.from("companies").select("id", HEAD)),
    unwrap(supabase.from("companies").select("id", HEAD).eq("status", "approved")),
    unwrap(supabase.from("companies").select("id", HEAD).in("status", ["pending", "claimed_pending"])),
    unwrap(supabase.from("companies").select("id", HEAD).eq("status", "rejected")),
    unwrap(supabase.from("company_claims").select("id", HEAD).eq("status", "pending")),
    unwrap(supabase.from("company_removal_requests").select("id", HEAD).eq("status", "pending")),
    unwrap(supabase.from("reviews").select("id", HEAD)),
    unwrap(supabase.from("reviews").select("id", HEAD).in("status", ["pending_moderation", "flagged"])),
    unwrap(supabase.from("review_reports").select("id", HEAD).eq("status", "pending")),
    unwrap(supabase.from("profiles").select("id", HEAD)),
    unwrap(supabase.from("contact_messages").select("id", HEAD).eq("status", "pending")),
    unwrap(supabase.from("contact_messages").select("id", HEAD)),
    unwrap(supabase.from("blog_posts").select("id", HEAD)),
    unwrap(supabase.from("blog_posts").select("id", HEAD).eq("status", "published")),
    unwrap(supabase.from("site_pages").select("slug", HEAD)),
    unwrap(supabase.from("cities").select("id", HEAD)),
    unwrap(supabase.from("neighborhoods").select("id", HEAD)),
    unwrap(supabase.from("categories").select("id", HEAD)),
  ]);
  return {
    companiesTotal,
    companiesApproved,
    companiesPending,
    companiesRejected,
    claimsPending,
    removalsPending,
    reviewsTotal,
    reviewsPending,
    reportsPending,
    users,
    contactMessagesPending,
    contactMessagesTotal,
    blogPostsTotal,
    blogPostsPublished,
    sitePagesTotal,
    cities,
    neighborhoods,
    categories,
  };
}

export function useAdminStats() {
  return useQuery({ queryKey: adminKeys.stats(), queryFn: fetchAdminStats });
}
