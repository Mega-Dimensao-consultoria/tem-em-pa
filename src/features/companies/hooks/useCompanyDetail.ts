import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCompanyById } from "@/features/companies/functions/getById";
import { queryKeys } from "@/lib/queryKeys";

export type CompanyData = NonNullable<Awaited<ReturnType<typeof getCompanyById>>>;

export const publicCompanyQO = (id: string) =>
  queryOptions({
    queryKey: queryKeys.companies.public(id),
    queryFn: () => getCompanyById({ data: { id } }),
  });

/** Owner/admin fallback for non-public (pending) companies. */
export const privateCompanyQO = (id: string) =>
  queryOptions({
    queryKey: queryKeys.companies.private(id),
    queryFn: async (): Promise<CompanyData | null> => {
      const { data: company, error } = await supabase
        .from("companies")
        .select(
          "id, name, description, cep, address, number, complement, neighborhood, city, state, lat, lng, phone, whatsapp, email, website, instagram_url, facebook_url, hours, gallery_urls, logo_url, cover_url, status, owner_id, is_featured, category_id, categories:category_id(name, slug, icon)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!company) return null;
      const [products, reviews] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, description, price, image_url_1, image_url_2")
          .eq("company_id", id)
          .eq("is_active", true),
        supabase
          .from("reviews")
          .select("id, rating, comment, created_at, owner_reply, owner_reply_at")
          .eq("company_id", id)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      return {
        ...(company as unknown as CompanyData),
        products: products.data ?? [],
        reviews: reviews.data ?? [],
      } as CompanyData;
    },
  });
