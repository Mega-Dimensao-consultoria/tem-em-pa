import { createServerFn } from "@tanstack/react-start";
import { publicClient, CARD_COLS } from "./_client";

export const listFeaturedCompanies = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("companies")
    .select(CARD_COLS)
    .eq("status", "approved")
    .eq("is_featured", true)
    .limit(8);
  if (error) throw new Error(error.message);
  return data ?? [];
});
