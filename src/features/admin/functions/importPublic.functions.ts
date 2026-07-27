import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Import em lote de empresas / entidades públicas.
 *
 * O cliente lê o CSV local, mapeia colunas para o shape `RowInput` e envia
 * lotes de até 500 linhas por chamada. O servidor:
 * - Verifica que o usuário é admin (RLS extra além do middleware).
 * - Resolve `city_id` pelo par (nome do município, UF) usando slugify.
 * - Resolve `category_id` por slug (opcional, fallback = Utilidade Pública p/
 *   fontes públicas, ou obrigatório p/ import genérico de empresas).
 * - Faz upsert em `companies` deduplicando por (source, external_id).
 * - Retorna contagem de inseridas / duplicadas / puladas por lote.
 */

const rowInputSchema = z.object({
  external_id: z.string().min(1).max(64),
  name: z.string().min(2).max(160),
  city_name: z.string().min(2).max(120),
  state: z.string().length(2),
  address: z.string().max(240).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  description: z.string().max(600).nullable().optional(),
  // Campos ricos (opcionais) — usados principalmente pelo preset "empresas"
  category_slug: z.string().max(80).nullable().optional(),
  cep: z.string().max(12).nullable().optional(),
  number: z.string().max(20).nullable().optional(),
  complement: z.string().max(120).nullable().optional(),
  whatsapp: z.string().max(40).nullable().optional(),
  email: z.string().max(160).nullable().optional(),
  website: z.string().max(240).nullable().optional(),
  instagram_url: z.string().max(240).nullable().optional(),
  facebook_url: z.string().max(240).nullable().optional(),
});

export type RowInput = z.infer<typeof rowInputSchema>;

const batchSchema = z.object({
  source: z.enum(["inep_escolas", "cnes_saude", "empresas"]),
  rows: z.array(rowInputSchema).min(1).max(500),
});

export type ImportBatchResult = {
  inserted: number;
  skipped_no_city: number;
  skipped_duplicate: number;
  errors: number;
};

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const importPublicBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => batchSchema.parse(input))
  .handler(async ({ data, context }): Promise<ImportBatchResult> => {
    const { supabase, userId } = context;

    // Verifica admin no servidor
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("forbidden");

    // Carrega categorias (para mapear por slug + fallback)
    const { data: catsRaw } = await supabase.from("categories").select("id, slug");
    const cats = catsRaw ?? [];
    const catBySlug = new Map(cats.map((c) => [c.slug, c.id]));
    const fallbackCatId = catBySlug.get("utilidade-publica");

    // Pré-carrega cidades relevantes do lote (por UF)
    const { data: cities } = await supabase
      .from("cities")
      .select("id, name, state")
      .eq("is_active", true)
      .in("state", Array.from(new Set(data.rows.map((r) => r.state.toUpperCase()))));

    const cityIndex = new Map<string, string>();
    for (const c of cities ?? []) {
      cityIndex.set(`${slugify(c.name)}|${c.state}`, c.id);
    }

    const result: ImportBatchResult = {
      inserted: 0,
      skipped_no_city: 0,
      skipped_duplicate: 0,
      errors: 0,
    };

    // Já registrados: consulta os external_ids do lote
    const externalIds = data.rows.map((r) => r.external_id);
    const { data: existing } = await supabase
      .from("companies")
      .select("external_id")
      .eq("source", data.source)
      .in("external_id", externalIds);
    const existingSet = new Set((existing ?? []).map((e) => e.external_id));

    const toInsert: Array<Record<string, unknown>> = [];

    for (const row of data.rows) {
      if (existingSet.has(row.external_id)) {
        result.skipped_duplicate++;
        continue;
      }
      const key = `${slugify(row.city_name)}|${row.state.toUpperCase()}`;
      const cityId = cityIndex.get(key);
      if (!cityId) {
        result.skipped_no_city++;
        continue;
      }

      // Categoria: por slug (se informado) ou fallback
      let categoryId: string | undefined;
      if (row.category_slug) {
        categoryId = catBySlug.get(row.category_slug.trim().toLowerCase());
      }
      if (!categoryId) categoryId = fallbackCatId;
      if (!categoryId) {
        result.errors++;
        continue;
      }

      // Compõe endereço completo se veio quebrado
      const fullAddress =
        row.address?.trim() ||
        [row.number, row.complement].filter(Boolean).join(" ") ||
        null;

      const baseSlug = `${slugify(row.name)}-${row.state.toLowerCase()}-${row.external_id}`.slice(0, 100);

      toInsert.push({
        name: row.name.trim(),
        slug: baseSlug,
        city_id: cityId,
        category_id: categoryId,
        status: "approved",
        source: data.source,
        external_id: row.external_id,
        description: row.description?.trim() || null,
        address: fullAddress,
        number: row.number?.trim() || null,
        complement: row.complement?.trim() || null,
        cep: row.cep?.trim() || null,
        phone: row.phone?.trim() || null,
        whatsapp: row.whatsapp?.trim() || null,
        email: row.email?.trim() || null,
        website: row.website?.trim() || null,
        instagram_url: row.instagram_url?.trim() || null,
        facebook_url: row.facebook_url?.trim() || null,
      });
    }

    if (toInsert.length > 0) {
      const { error, count } = await supabase
        .from("companies")
        .insert(toInsert as never, { count: "exact" });
      if (error) {
        // Fallback: tenta uma-a-uma para não perder o lote inteiro
        for (const row of toInsert) {
          const { error: e2 } = await supabase.from("companies").insert(row as never);
          if (e2) result.errors++;
          else result.inserted++;
        }
      } else {
        result.inserted = count ?? toInsert.length;
      }
    }

    return result;
  });

export const IMPORT_BATCH_SIZE = 300;
