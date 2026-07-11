import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient } from "./_client";

export const getCategoryBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().trim().max(60) }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: cat, error } = await sb
      .from("categories")
      .select("id, name, slug, icon, seo_title, seo_description, og_image_url, canonical_url, noindex")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return cat;
  });
