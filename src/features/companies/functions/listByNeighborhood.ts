import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient, CARD_COLS, normalizeCompanies } from "./_client";

export type NeighborhoodPayload = {
  neighborhood: string | null;
  neighborhoodSlug: string | null;
  city: string | null;
  citySlug: string | null;
  companies: Array<ReturnType<typeof normalizeCompanies>[number]>;
};

/**
 * Lista empresas aprovadas de um bairro. Requer citySlug para desambiguar
 * bairros com mesmo nome em cidades diferentes.
 */
export const listCompaniesByNeighborhood = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        citySlug: z.string().trim().regex(/^[a-z0-9-]+$/).max(80),
        slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(80),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<NeighborhoodPayload> => {
    const sb = publicClient();

    const { data: city } = await sb
      .from("cities")
      .select("id, name, slug")
      .eq("slug", data.citySlug)
      .eq("is_active", true)
      .maybeSingle();
    if (!city) {
      return { neighborhood: null, neighborhoodSlug: null, city: null, citySlug: null, companies: [] };
    }

    const { data: hood } = await sb
      .from("neighborhoods")
      .select("id, name, slug")
      .eq("city_id", city.id)
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!hood) {
      return { neighborhood: null, neighborhoodSlug: null, city: city.name, citySlug: city.slug, companies: [] };
    }

    const { data: companies, error } = await sb
      .from("companies")
      .select(CARD_COLS)
      .eq("status", "approved")
      .eq("neighborhood_id", hood.id)
      .limit(60);
    if (error) throw new Error(error.message);

    return {
      neighborhood: hood.name,
      neighborhoodSlug: hood.slug,
      city: city.name,
      citySlug: city.slug,
      companies: normalizeCompanies(companies as unknown as Record<string, unknown>[]),
    };
  });
