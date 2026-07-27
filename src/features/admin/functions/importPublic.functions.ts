import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Import em lote de entidades públicas (escolas INEP / saúde CNES).
 *
 * O cliente lê o CSV local, mapeia colunas para o shape `RowInput` e envia
 * lotes de até 500 linhas por chamada. O servidor:
 * - Verifica que o usuário é admin (RLS extra além do middleware).
 * - Resolve `city_id` pelo par (nome do município, UF) usando slugify.
 * - Faz upsert em `companies` deduplicando por (source, external_id).
 * - Retorna contagem de inseridas / atualizadas / puladas por lote.
 *
 * Não usa admin/service-role. Insere como usuário admin logado — a policy
 * de admin em `companies` permite. Isso mantém o audit trail correto.
 */

const rowInputSchema = z.object({
  external_id: z.string().min(1).max(32),
  name: z.string().min(2).max(160),
  city_name: z.string().min(2).max(120),
  state: z.string().length(2),
  address: z.string().max(240).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  description: z.string().max(600).nullable().optional(),
});

export type RowInput = z.infer<typeof rowInputSchema>;

const batchSchema = z.object({
  source: z.enum(["inep_escolas", "cnes_saude"]),
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

    // Verifica admin no servidor (não confia no cliente)
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("forbidden");

    // Categoria "Utilidade Pública"
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", "utilidade-publica")
      .maybeSingle();
    if (!cat) throw new Error("Categoria 'utilidade-publica' não encontrada");

    // Pré-carrega cidades relevantes do lote (nome+UF)
    const cityKeys = Array.from(
      new Set(
        data.rows.map((r) => `${slugify(r.city_name)}|${r.state.toUpperCase()}`),
      ),
    );
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

    const toInsert: Array<{
      name: string;
      slug: string;
      city_id: string;
      category_id: string;
      status: "approved";
      source: string;
      external_id: string;
      description: string | null;
      address: string | null;
      phone: string | null;
    }> = [];

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
      const baseSlug = `${slugify(row.name)}-${row.state.toLowerCase()}-${row.external_id}`.slice(0, 100);
      toInsert.push({
        name: row.name.trim(),
        slug: baseSlug,
        city_id: cityId,
        category_id: cat.id,
        status: "approved",
        source: data.source,
        external_id: row.external_id,
        description: row.description?.trim() || null,
        address: row.address?.trim() || null,
        phone: row.phone?.trim() || null,
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
