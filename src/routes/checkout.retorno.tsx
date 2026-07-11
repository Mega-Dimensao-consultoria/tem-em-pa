import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { PageShell } from "@/components/PageShell";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { confirmPromotionPayment } from "@/features/promotions/functions/promotions.functions";
import { getStripeEnvironment } from "@/lib/stripe";

const searchSchema = z.object({
  session_id: z.string().optional(),
  promotion: z.string().optional(),
});

export const Route = createFileRoute("/checkout/retorno")({
  head: () => ({
    meta: [
      { title: "Confirmação de pagamento — Tem na minha cidade" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: CheckoutReturnPage,
});

function CheckoutReturnPage() {
  const { session_id, promotion } = Route.useSearch();
  const [status, setStatus] = useState<"loading" | "ok" | "pending" | "error">("loading");
  const [message, setMessage] = useState<string>("Processando confirmação…");
  const [endsAt, setEndsAt] = useState<string | null>(null);

  useEffect(() => {
    if (!session_id || !promotion) {
      setStatus("error");
      setMessage("Sessão de pagamento inválida.");
      return;
    }
    (async () => {
      try {
        const res = await confirmPromotionPayment({
          data: { sessionId: session_id, environment: getStripeEnvironment() },
        });
        if ("error" in res) {
          setStatus("error"); setMessage(res.error); return;
        }
        if (res.status === "not_paid" || res.status === "pending") {
          setStatus("pending"); setMessage("O pagamento ainda não foi confirmado. Tente novamente em alguns instantes.");
          return;
        }
        setStatus("ok");
        setEndsAt(res.endsAt ?? null);
        setMessage(res.status === "already_active"
          ? "Este destaque já estava ativo."
          : "Destaque ativado com sucesso!");
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Falha ao confirmar pagamento.");
      }
    })();
  }, [session_id, promotion]);

  return (
    <PageShell>
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        {status === "loading" && <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />}
        {status === "ok" && <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />}
        {(status === "error" || status === "pending") && <XCircle className="mx-auto h-10 w-10 text-destructive" />}
        <h1 className="mt-4 font-display text-2xl font-bold">
          {status === "ok" ? "Pagamento confirmado" : status === "pending" ? "Pagamento pendente" : status === "error" ? "Ops" : "Confirmando…"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {endsAt && (
          <p className="mt-2 text-sm">
            Destaque válido até <strong>{new Date(endsAt).toLocaleString("pt-BR")}</strong>.
          </p>
        )}
        <div className="mt-6">
          <Link
            to="/owner"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Voltar ao painel
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
