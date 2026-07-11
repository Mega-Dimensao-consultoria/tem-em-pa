import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, XCircle, CalendarClock, ShoppingCart } from "lucide-react";
import { BuyPromotionDialog } from "./BuyPromotionDialog";

type Eligibility = {
  eligible: boolean;
  has_logo: boolean;
  has_cover: boolean;
  has_description: boolean;
  has_contact: boolean;
  has_address: boolean;
  has_hours: boolean;
  has_active_product: boolean;
};

type Promotion = {
  id: string;
  starts_at: string;
  ends_at: string;
  source: "paid" | "admin";
  status: "pending" | "active" | "expired" | "canceled";
  days_purchased: number | null;
  amount_cents: number | null;
  plan_code: string | null;
};

const CHECK_LABELS: Record<keyof Omit<Eligibility, "eligible">, string> = {
  has_logo: "Logo enviada",
  has_cover: "Foto de capa",
  has_description: "Descrição da empresa (30+ caracteres)",
  has_contact: "Telefone ou WhatsApp",
  has_address: "Endereço / bairro",
  has_hours: "Horário de funcionamento",
  has_active_product: "Ao menos 1 produto ativo",
};

export function PromotionStatusCard({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const [buyOpen, setBuyOpen] = useState(false);

  const eligibilityQ = useQuery({
    queryKey: ["promotion", "eligibility", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("company_promotion_eligibility", {
        _company_id: companyId,
      });
      if (error) throw new Error(error.message);
      const row = (Array.isArray(data) ? data[0] : data) as Eligibility;
      return row;
    },
    staleTime: 30_000,
  });

  const promotionsQ = useQuery({
    queryKey: ["promotion", "my", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_promotions")
        .select("id, starts_at, ends_at, source, status, days_purchased, amount_cents, plan_code")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw new Error(error.message);
      return (data ?? []) as Promotion[];
    },
    staleTime: 15_000,
  });

  const elig = eligibilityQ.data;
  const promotions = promotionsQ.data ?? [];
  const active = promotions.find(
    (p) => p.status === "active" && new Date(p.starts_at) <= new Date() && new Date(p.ends_at) > new Date(),
  );

  const totalRemainingDays = active
    ? Math.max(0, Math.ceil((new Date(active.ends_at).getTime() - Date.now()) / 86_400_000))
    : 0;

  function refresh() {
    qc.invalidateQueries({ queryKey: ["promotion", "my", companyId] });
    qc.invalidateQueries({ queryKey: ["promotion", "eligibility", companyId] });
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">Destaque da empresa</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Coloque sua empresa em destaque para aparecer no bloco principal da cidade e da home do site.
        </p>

        {active ? (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="h-5 w-5" /> Em destaque agora
            </div>
            <p className="mt-1 text-sm">
              Ativo até <strong>{new Date(active.ends_at).toLocaleString("pt-BR")}</strong>
              {" "}({totalRemainingDays} dia(s) restantes).
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <CalendarClock className="h-4 w-4" /> Nenhum destaque ativo
            </div>
            <p className="mt-1">Contrate um período para começar a aparecer em destaque.</p>
          </div>
        )}

        {/* Eligibility */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold">Requisitos para destacar</h3>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {(Object.entries(CHECK_LABELS) as [keyof typeof CHECK_LABELS, string][]).map(([k, label]) => {
              const ok = elig?.[k] ?? false;
              return (
                <li key={k} className="flex items-center gap-2 text-sm">
                  {ok ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className={ok ? "" : "text-muted-foreground"}>{label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            onClick={() => setBuyOpen(true)}
            disabled={!elig?.eligible}
            className="gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            {active ? "Estender destaque" : "Comprar destaque"}
          </Button>
          {!elig?.eligible && (
            <p className="text-xs text-muted-foreground">
              Complete os requisitos acima para liberar a compra.
            </p>
          )}
        </div>
      </div>

      {promotions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg font-semibold">Histórico de destaques</h3>
          <ul className="mt-3 divide-y divide-border">
            {promotions.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <div className="font-medium">
                    {new Date(p.starts_at).toLocaleDateString("pt-BR")} → {new Date(p.ends_at).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.source === "paid" ? "Pago via Stripe" : "Cortesia / moderação"}
                    {p.days_purchased ? ` · ${p.days_purchased} dia(s)` : ""}
                    {" · "}
                    <span className="uppercase">{p.status}</span>
                  </div>
                </div>
                {p.amount_cents ? (
                  <span className="font-semibold">
                    {(p.amount_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <BuyPromotionDialog
        open={buyOpen}
        onOpenChange={setBuyOpen}
        companyId={companyId}
        onSuccess={refresh}
      />
    </section>
  );
}
