import { queryOptions } from "@tanstack/react-query";
import { listFaqItems } from "./publicFaq.functions";

export const faqQO = queryOptions({
  queryKey: ["faq", "public"] as const,
  queryFn: () => listFaqItems(),
  staleTime: 5 * 60_000,
});
