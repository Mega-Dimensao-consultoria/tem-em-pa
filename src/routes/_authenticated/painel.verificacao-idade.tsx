import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, ShieldAlert, ShieldQuestion, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getMyAgeVerification,
  startAgeVerification,
  type AgeVerification,
} from "@/features/age-verification/functions/status.functions";
import { toastError } from "@/lib/safe";

export const Route = createFileRoute("/_authenticated/painel/verificacao-idade")({
  head: () => ({
    meta: [
      { title: "Verificação de idade — Tem na minha cidade" },
      {
        name: "description",
        content:
          "Confirme sua idade com nosso parceiro AgeVerif e receba o selo de idade verificada no seu perfil.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgeVerificationPage,
});

function AgeVerificationPage() {
  const fetchStatus = useServerFn(getMyAgeVerification);
  const start = useServerFn(startAgeVerification);
  const [starting, setStarting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["age-verification", "me"],
    queryFn: () => fetchStatus(),
  });

  async function handleStart() {
    setStarting(true);
    try {
      const returnUrl = `${window.location.origin}/painel/verificacao-idade`;
      const { redirectUrl } = await start({ data: { returnUrl } });
      window.location.href = redirectUrl;
    } catch (err) {
      toastError(err);
      setStarting(false);
    }
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-2xl px-4 py-10">
        <Link
          to="/painel"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao painel
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold">Verificação de idade</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirme sua idade através do nosso parceiro AgeVerif. Após aprovado, um selo de idade
          verificada será exibido no seu perfil.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
          {isLoading || !data ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando status…
            </div>
          ) : (
            <StatusBlock data={data} />
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={handleStart} disabled={starting || isLoading}>
              {starting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Iniciando…
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {data?.status === "approved" ? "Renovar verificação" : "Iniciar verificação"}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              Atualizar status
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Você será direcionado ao ambiente seguro do AgeVerif para concluir a validação. Nenhum
            documento é armazenado nos servidores do Tem na minha cidade.
          </p>
        </div>
      </section>
    </PageShell>
  );
}

function StatusBlock({ data }: { data: AgeVerification }) {
  if (data.status === "approved") {
    return (
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold">Idade verificada</h2>
            <Badge className="bg-emerald-600 hover:bg-emerald-600">Selo ativo</Badge>
          </div>
          {data.verified_at ? (
            <p className="text-sm text-muted-foreground">
              Verificado em {new Date(data.verified_at).toLocaleDateString("pt-BR")}
              {data.expires_at
                ? ` — válido até ${new Date(data.expires_at).toLocaleDateString("pt-BR")}`
                : ""}
              .
            </p>
          ) : null}
        </div>
      </div>
    );
  }
  if (data.status === "rejected") {
    return (
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold">Verificação não aprovada</h2>
          <p className="text-sm text-muted-foreground">
            {data.rejection_reason ??
              "O provedor não aprovou sua verificação. Você pode tentar novamente."}
          </p>
        </div>
      </div>
    );
  }
  if (data.status === "pending") {
    return (
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Loader2 className="h-5 w-5 animate-spin" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold">Verificação em andamento</h2>
          <p className="text-sm text-muted-foreground">
            Estamos aguardando o resultado do AgeVerif. Assim que concluído o selo aparece aqui.
          </p>
        </div>
      </div>
    );
  }
  if (data.status === "expired") {
    return (
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <ShieldQuestion className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold">Verificação expirada</h2>
          <p className="text-sm text-muted-foreground">
            Sua verificação anterior expirou. Refaça o processo para reativar o selo.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <ShieldQuestion className="h-5 w-5" />
      </span>
      <div>
        <h2 className="font-display text-lg font-semibold">Idade ainda não verificada</h2>
        <p className="text-sm text-muted-foreground">
          Você ainda não iniciou a verificação de idade. Clique abaixo para começar.
        </p>
      </div>
    </div>
  );
}

// avoid unused import warning
void toast;
