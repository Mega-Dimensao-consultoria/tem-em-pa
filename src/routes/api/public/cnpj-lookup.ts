import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CnpjLookupSchema = z.object({
  cnpj: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 14, "CNPJ inválido"),
});

function stringField(data: Record<string, unknown>, key: string) {
  return typeof data[key] === "string" ? data[key] : "";
}

function normalizedField(data: Record<string, unknown>, key: string) {
  return data[key] === null || data[key] === undefined ? "" : String(data[key]);
}

export const Route = createFileRoute("/api/public/cnpj-lookup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Requisição inválida" }, { status: 400 });
        }

        const parsed = CnpjLookupSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const response = await fetch(
          `https://brasilapi.com.br/api/cnpj/v1/${parsed.data.cnpj}`,
          { headers: { accept: "application/json" } },
        );

        if (response.status === 404) {
          return Response.json({ error: "CNPJ não encontrado" }, { status: 404 });
        }
        if (!response.ok) {
          return Response.json({ error: "Falha ao consultar CNPJ" }, { status: 502 });
        }

        const data = (await response.json()) as Record<string, unknown>;
        const cepRaw = normalizedField(data, "cep").replace(/\D/g, "");
        const cep = cepRaw.length === 8 ? `${cepRaw.slice(0, 5)}-${cepRaw.slice(5)}` : "";

        return Response.json({
          razao_social: stringField(data, "razao_social"),
          nome_fantasia: stringField(data, "nome_fantasia") || stringField(data, "razao_social"),
          cep,
          address: stringField(data, "logradouro"),
          number: normalizedField(data, "numero"),
          complement: stringField(data, "complemento"),
          neighborhood: stringField(data, "bairro"),
          city: stringField(data, "municipio"),
          state: stringField(data, "uf"),
          phone: normalizedField(data, "ddd_telefone_1"),
          email: stringField(data, "email"),
          atividade: stringField(data, "cnae_fiscal_descricao"),
        });
      },
    },
  },
});