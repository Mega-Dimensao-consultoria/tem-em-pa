import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CnpjLookupResult = {
  razao_social: string;
  nome_fantasia: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  atividade: string;
};

export const lookupCnpj = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        cnpj: z
          .string()
          .transform((v) => v.replace(/\D/g, ""))
          .refine((v) => v.length === 14, "CNPJ inválido"),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<CnpjLookupResult> => {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${data.cnpj}`);
    if (res.status === 404) throw new Error("CNPJ não encontrado");
    if (!res.ok) throw new Error("Falha ao consultar CNPJ");
    const j = (await res.json()) as Record<string, unknown>;
    const s = (k: string) => (typeof j[k] === "string" ? (j[k] as string) : "");
    const n = (k: string) =>
      j[k] === null || j[k] === undefined ? "" : String(j[k]);
    const cepRaw = n("cep").replace(/\D/g, "");
    const cep = cepRaw.length === 8 ? `${cepRaw.slice(0, 5)}-${cepRaw.slice(5)}` : "";
    return {
      razao_social: s("razao_social"),
      nome_fantasia: s("nome_fantasia") || s("razao_social"),
      cep,
      address: s("logradouro"),
      number: n("numero"),
      complement: s("complemento"),
      neighborhood: s("bairro"),
      city: s("municipio"),
      state: s("uf"),
      phone: n("ddd_telefone_1"),
      email: s("email"),
      atividade: s("cnae_fiscal_descricao"),
    };
  });
