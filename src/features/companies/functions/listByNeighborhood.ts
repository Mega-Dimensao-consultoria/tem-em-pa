import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient, CARD_COLS } from "./_client";

/**
 * Lista empresas aprovadas de um bairro. Slug é normalizado no servidor para
 * casar com `neighborhood` da tabela `companies`.
 */
export const listCompaniesByNeighborhood = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        slug: z
          .string()
          .trim()
          .min(1)
          .max(80)
          .regex(/^[a-z0-9-]+$/, "slug inválido"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();

    // Busca distinct neighborhoods aprovados e bate o slug no servidor.
    const { data: rows, error } = await sb
      .from("companies")
      .select("neighborhood, city")
      .eq("status", "approved")
      .not("neighborhood", "is", null);
    if (error) throw new Error(error.message);

    const match = (rows ?? []).find((r) => slugifyServer(r.neighborhood) === data.slug);
    if (!match || !match.neighborhood) {
      return { neighborhood: null as string | null, city: null as string | null, companies: [] as Array<Record<string, unknown>> };
    }

    const { data: companies, error: err2 } = await sb
      .from("companies")
      .select(CARD_COLS)
      .eq("status", "approved")
      .eq("neighborhood", match.neighborhood)
      .limit(60);
    if (err2) throw new Error(err2.message);

    return {
      neighborhood: match.neighborhood,
      city: match.city,
      companies: companies ?? [],
    };
  });

function slugifyServer(input: string | null): string {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
