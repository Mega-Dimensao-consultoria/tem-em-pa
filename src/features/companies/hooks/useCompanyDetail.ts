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
      const { data: rawCompany, error } = await supabase
        .from("companies")
        .select(
          "id, name, description, cep, address, number, complement, city_id, neighborhood_id, state, lat, lng, phone, phone_ddd, whatsapp, email, website, instagram_url, facebook_url, hours, gallery_urls, logo_url, cover_url, status, owner_id, is_featured, category_id, categories:category_id(name, slug, icon), cities:city_id(name, slug, state), neighborhoods:neighborhood_id(name, slug)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!rawCompany) return null;
      const row = rawCompany as unknown as {
        cities: { name: string | null; slug: string | null; state: string | null } | null;
        neighborhoods: { name: string | null; slug: string | null } | null;
      } & Record<string, unknown>;
      const flat = {
        ...row,
        city: row.cities?.name ?? null,
        city_slug: row.cities?.slug ?? null,
        neighborhood: row.neighborhoods?.name ?? null,
        neighborhood_slug: row.neighborhoods?.slug ?? null,
      };
      const [products, reviews] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, description, price, image_url_1, image_url_2")
          .eq("company_id", id)
          .eq("is_active", true),
        supabase
          .from("reviews_public")
          .select("id, rating, comment, created_at, owner_reply, owner_reply_at, photos")
          .eq("company_id", id)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      return {
        ...(flat as unknown as CompanyData),
        products: products.data ?? [],
        reviews: reviews.data ?? [],
      } as CompanyData;
    },
  });
