import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PublicProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  handle: string;
  review_count: number;
};

export type PublicProfileReview = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  company_id: string;
  company_name: string;
  company_slug: string | null;
  photos: string[] | null;
};

export function usePublicProfile(handle: string) {
  return useQuery({
    queryKey: ["public-profile", handle],
    enabled: !!handle,
    queryFn: async (): Promise<PublicProfile | null> => {
      const { data, error } = await supabase.rpc("get_public_profile", { _handle: handle });
      if (error) throw error;
      const row = (data as PublicProfile[] | null)?.[0];
      return row ?? null;
    },
  });
}

export function usePublicProfileReviews(handle: string) {
  return useQuery({
    queryKey: ["public-profile", handle, "reviews"],
    enabled: !!handle,
    queryFn: async (): Promise<PublicProfileReview[]> => {
      const { data, error } = await supabase.rpc("get_public_profile_reviews", {
        _handle: handle,
        lim: 30,
      });
      if (error) throw error;
      return (data ?? []) as PublicProfileReview[];
    },
  });
}
