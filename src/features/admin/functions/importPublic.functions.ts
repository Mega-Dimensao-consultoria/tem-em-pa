import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { handleImportPublicBatch } from "./importPublic.server";
import { parseImportBatchInput } from "./importPublic.shared";

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

export const importPublicBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parseImportBatchInput)
  .handler(async ({ data, context }) => {
    const { supabase: userClient, userId } = context;

    // Verifica admin no servidor (usa client do usuário para checar identidade)
    const { data: isAdmin } = await userClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("forbidden");
    return handleImportPublicBatch(data);
  });
