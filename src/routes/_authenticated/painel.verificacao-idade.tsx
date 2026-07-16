import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Loader2,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getAgeVerifPublicKey,
  getMyAgeVerification,
  recordAgeVerification,
  type AgeVerification,
} from "@/features/age-verification/functions/status.functions";
import { toastError } from "@/lib/safe";

type AgeVerifVerification = {
  uid: string;
  expiresAt: number;
  ageThreshold?: number;
  assuranceLevel?: "STANDARD" | "ENHANCED" | "STRICT";
  token: string;
};

type AgeVerifWindow = Window & {
  ageverif?: {
    start: (opts?: {
      forceVerification?: boolean;
      closable?: boolean;
      target?: "popup" | "tab" | "redirect";
    }) => Promise<{ verified: boolean; verification: AgeVerifVerification | null }>;
    on: (event: string, listener: (payload: { verification?: AgeVerifVerification }) => void) => void;
    off: (event: string, listener: (...args: unknown[]) => unknown) => void;
  };
};

const SCRIPT_ID = "ageverif-checker-script";

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
  const fetchKey = useServerFn(getAgeVerifPublicKey);
  const record = useServerFn(recordAgeVerification);
  const [starting, setStarting] = useState(false);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const successHandlerRef = useRef<((p: { verification?: AgeVerifVerification }) => void) | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["age-verification", "me"],
    queryFn: () => fetchStatus(),
  });

  const { data: keyData } = useQuery({
    queryKey: ["ageverif-public-key"],
    queryFn: () => fetchKey(),
    staleTime: Infinity,
  });
  const publicKey = keyData?.publicKey ?? null;

  const handleSuccess = useCallback(
    async (payload: { verification?: AgeVerifVerification }) => {
      const v = payload?.verification;
      if (!v?.token || !v.uid || !v.expiresAt) {
        toast.error("A verificação foi concluída mas os dados não vieram completos. Tente novamente.");
        setStarting(false);
        return;
      }
      try {
        await record({
          data: {
            token: v.token,
            uid: v.uid,
            expiresAt: v.expiresAt,
            ageThreshold: v.ageThreshold,
            assuranceLevel: v.assuranceLevel,
          },
        });
        toast.success("Idade verificada com sucesso!");
        await refetch();
      } catch (err) {
        toastError(err);
      } finally {
        setStarting(false);
      }
    },
    [record, refetch],
  );

  // Load the AgeVerif checker.js script once.
  useEffect(() => {
    if (!publicKey) return;
    const w = window as AgeVerifWindow;

    function bindSuccess() {
      if (!w.ageverif) return;
      const listener = (p: { verification?: AgeVerifVerification }) => {
        void handleSuccess(p);
      };
      successHandlerRef.current = listener;
      w.ageverif.on("success", listener);
      setWidgetLoaded(true);
    }

    if (w.ageverif) {
      bindSuccess();
      return;
    }

    if (document.getElementById(SCRIPT_ID)) {
      // Script already added; poll briefly for readiness.
      const iv = window.setInterval(() => {
        if (w.ageverif) {
          window.clearInterval(iv);
          bindSuccess();
        }
      }, 100);
      return () => window.clearInterval(iv);
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://www.ageverif.com/checker.js?key=${encodeURIComponent(publicKey)}&nostart`;
    script.onload = bindSuccess;
    script.onerror = () => toast.error("Não foi possível carregar o AgeVerif.");
    document.head.appendChild(script);

    return () => {
      const av = (window as AgeVerifWindow).ageverif;
      if (av && successHandlerRef.current) {
        av.off("success", successHandlerRef.current as (...args: unknown[]) => unknown);
        successHandlerRef.current = null;
      }
    };
  }, [handleSuccess, publicKey]);

  async function handleStart() {
    if (!publicKey) {
      toast.error("A chave pública do AgeVerif ainda não foi configurada.");
      return;
    }
    const av = (window as AgeVerifWindow).ageverif;
    if (!av) {
      toast.error("O widget do AgeVerif ainda está carregando. Tente novamente em instantes.");
      return;
    }
    setStarting(true);
    try {
      await av.start({
        forceVerification: data?.status !== "approved",
        closable: true,
        target: "popup",
      });
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
          Confirme sua idade através do nosso parceiro AgeVerif. Após aprovado, o selo de idade
          verificada fica ativo no seu perfil.
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
            <Button onClick={handleStart} disabled={starting || isLoading || !widgetLoaded}>
              {starting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aguardando verificação…
                </>
              ) : (
                <>
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  {data?.status === "approved" ? "Renovar verificação" : "Iniciar verificação"}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              Atualizar status
            </Button>
          </div>

          {!publicKey ? (
            <p className="mt-4 text-xs text-amber-700">
              A chave pública do AgeVerif ainda não foi configurada. Contate o administrador.
            </p>
          ) : !widgetLoaded ? (
            <p className="mt-4 text-xs text-muted-foreground">Carregando widget do AgeVerif…</p>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              Você será direcionado ao ambiente seguro do AgeVerif. Nenhum documento é armazenado
              nos servidores do Tem na minha cidade.
            </p>
          )}
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
            Complete o processo no widget do AgeVerif para receber o selo.
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
