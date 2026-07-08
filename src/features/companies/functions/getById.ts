import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient, DETAIL_COLS, normalizeCompany } from "./_client";

export const getCompanyById = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rawCompany, error } = await sb
      .from("companies")
      .select(DETAIL_COLS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!rawCompany) return null;

    const [products, reviews] = await Promise.all([
      sb
        .from("products")
        .select("id, name, description, price, image_url_1, image_url_2")
        .eq("company_id", data.id)
        .eq("is_active", true),
      sb
        .from("reviews")
        .select("id, rating, comment, created_at, owner_reply, owner_reply_at, photos")
        .eq("company_id", data.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const company = normalizeCompany(rawCompany as unknown as Record<string, unknown>);
    return {
      ...company,
      products: products.data ?? [],
      reviews: reviews.data ?? [],
    };
  });
