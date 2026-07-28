import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  ImportBatchInput,
  ImportBatchResult,
  ImportRowLog,
} from "./importPublic.shared";

type CompanyInsert = Database["public"]["Tables"]["companies"]["Insert"];

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createImportAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Importação indisponível: credenciais administrativas ausentes.");
  }

  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (serviceKey.startsWith("sb_") && headers.get("Authorization") === `Bearer ${serviceKey}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", serviceKey);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

async function getOrCreateNeighborhood(
  supabase: ReturnType<typeof createImportAdminClient>,
  cityId: string,
  name: string,
): Promise<string | null> {
  const cleanName = name.trim();
  const slug = slugify(cleanName);
  if (cleanName.length < 2 || slug.length < 2) return null;

  const { data: existing } = await supabase
    .from("neighborhoods")
    .select("id")
    .eq("city_id", cityId)
    .eq("slug", slug)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("neighborhoods")
    .insert({ city_id: cityId, name: cleanName, slug, is_active: true })
    .select("id")
    .single();
  if (!error && created?.id) return created.id;

  const { data: recovered } = await supabase
    .from("neighborhoods")
    .select("id")
    .eq("city_id", cityId)
    .eq("slug", slug)
    .maybeSingle();
  return recovered?.id ?? null;
}

export async function handleImportPublicBatch(
  data: ImportBatchInput,
): Promise<ImportBatchResult> {
  const supabase = createImportAdminClient();

  const { data: catsRaw } = await supabase.from("categories").select("id, slug");
  const cats = catsRaw ?? [];
  const catBySlug = new Map(cats.map((c) => [c.slug, c.id]));
  const fallbackCatId = catBySlug.get("utilidade-publica");

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
    logs: [],
  };

  const externalIds = data.rows.map((r) => r.external_id);
  const { data: existing } = await supabase
    .from("companies")
    .select("external_id")
    .eq("source", data.source)
    .in("external_id", externalIds);
  const existingSet = new Set((existing ?? []).map((e) => e.external_id));
  const seenInBatch = new Set<string>();

  const toInsert: CompanyInsert[] = [];
  const metaByExternalId = new Map<string, Omit<ImportRowLog, "level" | "reason">>();
  const neighborhoodCache = new Map<string, string>();

  for (const row of data.rows) {
    const meta = {
      external_id: row.external_id,
      name: row.name,
      city_name: row.city_name,
      state: row.state.toUpperCase(),
    };
    if (existingSet.has(row.external_id) || seenInBatch.has(row.external_id)) {
      result.skipped_duplicate++;
      result.logs.push({ level: "duplicate", ...meta, reason: "external_id já importado nesta fonte" });
      continue;
    }
    seenInBatch.add(row.external_id);

    const key = `${slugify(row.city_name)}|${row.state.toUpperCase()}`;
    const cityId = cityIndex.get(key);
    if (!cityId) {
      result.skipped_no_city++;
      result.logs.push({ level: "no_city", ...meta, reason: `Cidade "${row.city_name}/${row.state.toUpperCase()}" não existe na base` });
      continue;
    }

    let categoryId: string | undefined;
    if (row.category_slug) {
      categoryId = catBySlug.get(row.category_slug.trim().toLowerCase());
    }
    if (!categoryId) categoryId = fallbackCatId;
    if (!categoryId) {
      result.errors++;
      result.logs.push({ level: "error", ...meta, reason: `Categoria não encontrada (slug="${row.category_slug ?? ""}") e sem fallback` });
      continue;
    }

    let neighborhoodId: string | null = null;
    if (row.neighborhood && row.neighborhood.trim().length >= 2) {
      const nName = row.neighborhood.trim();
      const nKey = `${cityId}|${slugify(nName)}`;
      const cached = neighborhoodCache.get(nKey);
      if (cached) {
        neighborhoodId = cached;
      } else {
        neighborhoodId = await getOrCreateNeighborhood(supabase, cityId, nName);
        if (neighborhoodId) neighborhoodCache.set(nKey, neighborhoodId);
      }
    }

    const baseSlug = `${slugify(row.name)}-${row.state.toLowerCase()}-${row.external_id}`.slice(0, 100);
    metaByExternalId.set(row.external_id, meta);
    toInsert.push({
      name: row.name.trim(),
      slug: baseSlug,
      city_id: cityId,
      neighborhood_id: neighborhoodId,
      category_id: categoryId,
      status: "approved",
      source: data.source,
      external_id: row.external_id,
      description: row.description?.trim() || null,
      address: row.address?.trim() || null,
      number: row.number?.trim() || null,
      complement: row.complement?.trim() || null,
      cep: row.cep?.trim() || null,
      phone: row.phone?.trim() || null,
      phone_ddd: row.phone_ddd?.trim() || null,
      whatsapp: row.whatsapp?.trim() || null,
      email: row.email?.trim() || null,
      website: row.website?.trim() || null,
      instagram_url: row.instagram_url?.trim() || null,
      facebook_url: row.facebook_url?.trim() || null,
    });
  }

  if (toInsert.length === 0) return result;

  const { error, count } = await supabase
    .from("companies")
    .insert(toInsert, { count: "exact" });
  if (!error) {
    result.inserted = count ?? toInsert.length;
    for (const row of toInsert) {
      const meta = metaByExternalId.get(row.external_id ?? "");
      if (meta) result.logs.push({ level: "ok", ...meta });
    }
    return result;
  }

  for (const row of toInsert) {
    const meta = metaByExternalId.get(row.external_id ?? "") ?? {
      external_id: row.external_id ?? "",
      name: row.name,
      city_name: "",
      state: "",
    };
    const { error: rowError } = await supabase.from("companies").insert(row);
    if (rowError) {
      result.errors++;
      result.logs.push({ level: "error", ...meta, reason: rowError.message });
    } else {
      result.inserted++;
      result.logs.push({ level: "ok", ...meta });
    }
  }

  return result;
}