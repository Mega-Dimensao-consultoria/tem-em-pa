import { useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getStripe, getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { createPromotionCheckout } from "../functions/promotions.functions";
import { Loader2, Sparkles } from "lucide-react";

type Plan = "daily" | "monthly";

const PLAN_INFO: Record<Plan, { label: string; unit: string; days: number; priceCents: number }> = {
  daily: { label: "Diário", unit: "R$ 4,90 / dia", days: 1, priceCents: 490 },
  monthly: { label: "Mensal", unit: "R$ 50,00 / 30 dias", days: 30, priceCents: 5000 },
};

export function BuyPromotionDialog({
  open, onOpenChange, companyId, onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string;
  onSuccess?: () => void;
}) {
  const [plan, setPlan] = useState<Plan>("daily");
  const [quantity, setQuantity] = useState(7);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const paymentsOk = isPaymentsConfigured();
  const meta = PLAN_INFO[plan];
  const totalDays = meta.days * quantity;
  const totalCents = meta.priceCents * quantity;
  const totalBrl = (totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  async function startCheckout() {
    setError(null);
    setLoading(true);
    try {
      const returnUrl = `${window.location.origin}/checkout/retorno?session_id={CHECKOUT_SESSION_ID}&promotion=1`;
      const res = await createPromotionCheckout({
        data: {
          companyId, plan, quantity,
          returnUrl,
          environment: getStripeEnvironment(),
        },
      });
      if ("error" in res) throw new Error(res.error);
      setClientSecret(res.clientSecret);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao iniciar pagamento");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setClientSecret(null);
    setError(null);
    setPlan("daily");
    setQuantity(7);
    onOpenChange(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Destacar minha empresa
          </DialogTitle>
          <DialogDescription>
            Pagamento único via Stripe. Sua empresa aparece nos destaques da cidade e da home enquanto a promoção estiver ativa.
          </DialogDescription>
        </DialogHeader>

        {!paymentsOk ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Pagamentos ainda não estão configurados neste ambiente.
          </p>
        ) : clientSecret ? (
          <div id="checkout" className="min-h-[500px]">
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(PLAN_INFO) as Plan[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPlan(p); setQuantity(p === "daily" ? 7 : 1); }}
                  className={`rounded-xl border p-4 text-left transition ${
                    plan === p ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="font-semibold">{PLAN_INFO[p].label}</div>
                  <div className="text-sm text-muted-foreground">{PLAN_INFO[p].unit}</div>
                </button>
              ))}
            </div>

            <div>
              <Label htmlFor="qty">
                Quantidade de {plan === "daily" ? "dias" : "períodos (30 dias)"}
              </Label>
              <Input
                id="qty" type="number" min={1} max={plan === "daily" ? 90 : 12}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1"
              />
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Total ({totalDays} dias de destaque):</span>
                <span className="text-lg font-bold">{totalBrl}</span>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={reset}>Cancelar</Button>
              <Button onClick={startCheckout} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Ir para pagamento
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
