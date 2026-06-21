import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getLoginApprovalStatus,
  respondLoginApproval,
} from "@/lib/login-approval.functions";

const searchSchema = z.object({ token: z.string().uuid().optional() });

export const Route = createFileRoute("/_authenticated/aprovar-login")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Aprovar login — Tem em P.A" }] }),
  component: ApproveLoginPage,
});

function ApproveLoginPage() {
  const navigate = useNavigate();
  const { token } = useSearch({ from: Route.id });
  const getStatus = useServerFn(getLoginApprovalStatus);
  const respond = useServerFn(respondLoginApproval);

  const [status, setStatus] = useState<
    "loading" | "pending" | "approved" | "denied" | "expired" | "error" | "missing"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("missing");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const row = await getStatus({ data: { id: token } });
        if (cancelled) return;
        setStatus(row.status as any);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Falha ao carregar.");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, getStatus]);

  async function handle(approve: boolean) {
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await respond({ data: { id: token, approve } });
      setStatus(res.status as any);
      toast.success(
        approve ? "Login aprovado." : "Tentativa de login bloqueada.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao responder.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-12">
      <div className="w-full rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-semibold">Tentativa de login</h1>

        {status === "loading" ? (
          <p className="mt-3 text-sm text-muted-foreground">Carregando…</p>
        ) : status === "missing" ? (
          <p className="mt-3 text-sm text-destructive">
            Link inválido. Volte ao dispositivo onde iniciou o login e tente novamente.
          </p>
        ) : status === "pending" ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Foi você que acabou de tentar entrar na conta? Aprove para liberar
              o acesso no outro dispositivo.
            </p>
            {error ? (
              <p className="mt-3 text-sm text-destructive">{error}</p>
            ) : null}
            <div className="mt-5 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={submitting}
                onClick={() => handle(false)}
              >
                <X className="mr-1.5 h-4 w-4" /> Não fui eu
              </Button>
              <Button
                className="flex-1"
                disabled={submitting}
                onClick={() => handle(true)}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Sim, sou eu"
                )}
              </Button>
            </div>
          </>
        ) : status === "approved" ? (
          <p className="mt-3 text-sm text-emerald-600">
            Pronto! Volte ao outro dispositivo — o login já foi liberado.
          </p>
        ) : status === "denied" ? (
          <p className="mt-3 text-sm text-destructive">
            Tentativa de login bloqueada. Recomendamos trocar sua senha agora.
          </p>
        ) : status === "expired" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            A solicitação expirou. Tente novamente no outro dispositivo.
          </p>
        ) : (
          <p className="mt-3 text-sm text-destructive">{error ?? "Falha."}</p>
        )}

        <button
          type="button"
          onClick={() => navigate({ to: "/painel" })}
          className="mt-6 text-xs text-muted-foreground underline hover:text-foreground"
        >
          Voltar ao painel
        </button>
      </div>
    </div>
  );
}
