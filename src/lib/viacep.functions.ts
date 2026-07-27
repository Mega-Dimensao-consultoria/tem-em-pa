import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const lookupCep = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido") }).parse(input),
  )
  .handler(async ({ data }) => {
    const clean = data.cep.replace(/\D/g, "");
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) throw new Error("Falha ao consultar CEP");
    const json = (await res.json()) as {
      erro?: boolean;
      logradouro?: string;
      complemento?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };
    if (json.erro) throw new Error("CEP não encontrado");
    return {
      address: json.logradouro ?? "",
      complement: json.complemento ?? "",
      neighborhood: json.bairro ?? "",
      city: json.localidade ?? "",
      state: json.uf ?? "",
    };
  });
