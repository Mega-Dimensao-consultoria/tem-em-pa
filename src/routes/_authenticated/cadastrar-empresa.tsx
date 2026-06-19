import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { listCategories } from "@/lib/categories.functions";
import { lookupCep } from "@/lib/viacep.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cadastrar-empresa")({
  head: () => ({ meta: [{ title: "Cadastrar empresa — Tem em P.A" }] }),
  component: CadastrarPage,
});

function CadastrarPage() {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
  });

  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("Pouso Alegre");
  const [state, setState] = useState("MG");
  const [loadingCep, setLoadingCep] = useState(false);

  async function onCepBlur() {
    if (!/^\d{5}-?\d{3}$/.test(cep)) return;
    setLoadingCep(true);
    try {
      const res = await lookupCep({ data: { cep } });
      setAddress(res.address);
      setNeighborhood(res.neighborhood);
      setCity(res.city || "Pouso Alegre");
      setState(res.state || "MG");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao consultar CEP");
    } finally {
      setLoadingCep(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.info("Envio de cadastro será habilitado na próxima etapa.");
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">Cadastrar empresa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Após o envio, sua empresa passa por aprovação do nosso time antes de ficar visível.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <Field label="Nome da empresa" id="name"><Input id="name" required maxLength={120} /></Field>

          <Field label="Categoria" id="cat">
            <Select>
              <SelectTrigger id="cat"><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Descrição" id="desc">
            <Textarea id="desc" maxLength={500} rows={4} placeholder="Conte um pouco sobre seu negócio…" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CEP" id="cep">
              <Input id="cep" value={cep} onChange={(e) => setCep(e.target.value)} onBlur={onCepBlur} placeholder="37550-000" maxLength={9} />
              {loadingCep ? <p className="text-xs text-muted-foreground">Consultando…</p> : null}
            </Field>
            <Field label="Número" id="num"><Input id="num" maxLength={10} /></Field>
          </div>

          <Field label="Endereço" id="addr">
            <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Bairro" id="bairro"><Input id="bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} /></Field>
            <Field label="Cidade" id="city"><Input id="city" value={city} onChange={(e) => setCity(e.target.value)} /></Field>
            <Field label="UF" id="uf"><Input id="uf" value={state} onChange={(e) => setState(e.target.value)} maxLength={2} /></Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone" id="phone"><Input id="phone" type="tel" maxLength={20} /></Field>
            <Field label="WhatsApp" id="wpp"><Input id="wpp" type="tel" maxLength={20} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-mail" id="email"><Input id="email" type="email" maxLength={120} /></Field>
            <Field label="Site" id="site"><Input id="site" type="url" maxLength={200} /></Field>
          </div>

          <Button type="submit" className="w-full">Enviar para aprovação</Button>
        </form>
      </section>
    </PageShell>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
