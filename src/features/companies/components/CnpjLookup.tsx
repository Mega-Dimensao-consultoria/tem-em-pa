import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { maskPhone } from "@/lib/masks";
import type { CompanyFormValues } from "./CompanyForm";

type CnpjLookupResult = {
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

function maskCnpj(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function toPrefill(r: CnpjLookupResult): Partial<CompanyFormValues> {
  return {
    name: r.nome_fantasia || r.razao_social,
    description: r.atividade || "",
    cep: r.cep,
    address: r.address,
    number: r.number,
    complement: r.complement,
    neighborhood: r.neighborhood,
    city: r.city,
    state: r.state,
    phone: r.phone ? maskPhone(r.phone) : "",
    email: r.email,
  };
}

type Props = {
  onPrefill: (values: Partial<CompanyFormValues>) => void;
  onSkip: () => void;
};

export function CnpjLookup({ onPrefill, onSkip }: Props) {
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [noCnpj, setNoCnpj] = useState(false);

  async function handleLookup() {
    setLoading(true);
    try {
      const response = await fetch("/api/public/cnpj-lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cnpj }),
      });
      const payload = (await response.json()) as CnpjLookupResult | { error?: string };
      if (!response.ok) {
        throw new Error("error" in payload && payload.error ? payload.error : "Falha ao consultar CNPJ");
      }
      const r = payload as CnpjLookupResult;
      onPrefill(toPrefill(r));
      toast.success("Dados preenchidos a partir do CNPJ");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao consultar CNPJ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5">
      <h2 className="font-semibold">Preencher pelo CNPJ</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Informe o CNPJ e nós buscamos os dados na Receita Federal automaticamente.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <Label htmlFor="cnpj-lookup" className="mb-1.5 block">
            CNPJ
          </Label>
          <Input
            id="cnpj-lookup"
            value={cnpj}
            onChange={(e) => setCnpj(maskCnpj(e.target.value))}
            placeholder="00.000.000/0000-00"
            inputMode="numeric"
            maxLength={18}
            disabled={noCnpj}
          />
        </div>
        <Button
          type="button"
          onClick={handleLookup}
          disabled={loading || noCnpj || cnpj.replace(/\D/g, "").length !== 14}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando…
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" /> Buscar CNPJ
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="no-cnpj"
          checked={noCnpj}
          onChange={(e) => {
            const checked = e.target.checked;
            setNoCnpj(checked);
            if (checked) onSkip();
          }}
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor="no-cnpj" className="text-sm font-normal">
          Meu negócio ainda não tem um CNPJ (cadastrar manualmente)
        </Label>
      </div>
    </div>
  );
}
