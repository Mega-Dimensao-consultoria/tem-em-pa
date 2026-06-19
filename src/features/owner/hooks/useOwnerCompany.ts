import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/queryKeys";

export function useOwnerCompany(id: string, userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.owner.company(id, userId),
    enabled: !!userId && enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select(
          "id, name, owner_id, status, logo_url, cover_url, description, phone, whatsapp, website, instagram_url, facebook_url, hours, gallery_urls, lat, lng",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
