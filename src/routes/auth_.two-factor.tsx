import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Loader2, Smartphone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { requestTwoFaEmailOtp, verifyTwoFaEmailOtp } from "@/lib/twofa.functions";
import {
  requestLoginApproval,
  getLoginApprovalStatus,
} from "@/lib/login-approval.functions";
import { setPushApproved } from "@/lib/push-2fa-session";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth_/two-factor")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Verificação em duas etapas — Tem em P.A" }] }),
  component: TwoFactorPage,
});

type Mode = "totp" | "email-request" | "email-verify" | "push";

function TwoFactorPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const requestOtp = useServerFn(requestTwoFaEmailOtp);
  const verifyOtp = useServerFn(verifyTwoFaEmailOtp);
  const requestApproval = useServerFn(requestLoginApproval);
  const getApprovalStatus = useServerFn(getLoginApprovalStatus);

  const [mode, setMode] = useState<Mode>("totp");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [pushApprovalId, setPushApprovalId] = useState<string | null>(null);
  const [pushSecondsLeft, setPushSecondsLeft] = useState(0);
  const pushPollRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (cancelled) return;
      // Already at AAL2 — nothing to verify.
      if (aal?.currentLevel === "aal2") {
        navigate({ to: redirect ?? "/", replace: true });
        return;
      }
      const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      if (fErr) {
        setBootError(fErr.message);
        return;
      }
      const totp = (factors?.totp ?? []).find((f) => f.status === "verified");
      if (!totp) {
        // No verified factor — no need to challenge.
        navigate({ to: redirect ?? "/", replace: true });
        return;
      }
      setFactorId(totp.id);
      const { data: u } = await supabase.auth.getUser();
      setEmail(u.user?.email ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, redirect]);

  async function verifyTotp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Digite o código de 6 dígitos.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Resolve factorId lazily caso o boot effect ainda não tenha rodado
      // ou tenha falhado silenciosamente.
      let activeFactorId = factorId;
      if (!activeFactorId) {
        const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
        if (fErr) throw fErr;
        const totp = (factors?.totp ?? []).find((f) => f.status === "verified");
        if (!totp) {
          setError("Nenhum método de verificação ativo foi encontrado nesta conta.");
          return;
        }
        activeFactorId = totp.id;
        setFactorId(totp.id);
      }
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
        factorId: activeFactorId,
      });
      if (cErr || !challenge) {
        setError(cErr?.message ?? "Falha ao iniciar verificação.");
        return;
      }
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: activeFactorId,
        challengeId: challenge.id,
        code,
      });
      if (vErr) {
        setError("O código informado está incorreto. Verifique no seu aplicativo e tente novamente.");
        return;
      }
      toast.success("Verificação concluída.");
      navigate({ to: redirect ?? "/", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao verificar.");
    } finally {
      setLoading(false);
    }
  }

  async function sendEmailOtp() {
    setError(null);
    setLoading(true);
    try {
      await requestOtp();
      toast.success("Código enviado para o seu e-mail.");
      setCode("");
      setMode("email-verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar o código.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Digite o código de 6 dígitos enviado por e-mail.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await verifyOtp({ data: { code } });
      toast.success("Acesso restaurado. Configure novamente o 2FA quando puder.");
      navigate({ to: redirect ?? "/", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código incorreto ou expirado.");
    } finally {
      setLoading(false);
    }
  }

  function stopPushPolling() {
    if (pushPollRef.current !== null) {
      window.clearInterval(pushPollRef.current);
      pushPollRef.current = null;
    }
  }

  useEffect(() => () => stopPushPolling(), []);

  async function startPushApproval() {
    // Já leva para a tela de aguardando aprovação imediatamente — sem
    // toasts e sem convidar a ativar push neste dispositivo.
    setError(null);
    setPushApprovalId(null);
    setPushSecondsLeft(180);
    setMode("push");
    setLoading(true);
    try {
      const res = await requestApproval();
      setPushApprovalId(res.id);
      setPushSecondsLeft(res.ttlSec);
      const expiresAtMs = new Date(res.expiresAt).getTime();
      pushPollRef.current = window.setInterval(async () => {
        const left = Math.max(0, Math.round((expiresAtMs - Date.now()) / 1000));
        setPushSecondsLeft(left);
        try {
          const row = await getApprovalStatus({ data: { id: res.id } });
          if (row.status === "approved") {
            stopPushPolling();
            setPushApproved();
            toast.success("Acesso aprovado.");
            navigate({ to: redirect ?? "/", replace: true });
          } else if (row.status === "denied") {
            stopPushPolling();
            setError("A tentativa foi bloqueada no outro dispositivo.");
          } else if (row.status === "expired" || left <= 0) {
            stopPushPolling();
            setError("Tempo esgotado. Tente novamente ou use o código do app.");
          }
        } catch {
          /* keep polling */
        }
      }, 2000);
    } catch (err) {
      // Falha mais comum: não existe nenhum dispositivo confiável com push
      // ativo. Mantemos o usuário na tela de aprovação, com mensagem
      // explicando a situação — nunca pedimos para ativar push aqui.
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível enviar a notificação agora.",
      );
    } finally {
      setLoading(false);
    }
  }


  const maskedEmail = email
    ? email.replace(/^(.).+(.@.+)$/, "$1•••$2")
    : "—";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Link to="/"><Logo /></Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> Verificação em duas etapas
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          {bootError ? (
            <p className="text-sm text-destructive">{bootError}</p>
          ) : mode === "totp" ? (
            <form onSubmit={verifyTotp} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Digite o código de 6 dígitos exibido no Google Authenticator (ou app compatível).
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="totp">Código do autenticador</Label>
                <Input
                  id="totp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center font-mono text-lg tracking-widest"
                  autoFocus
                />
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
              <Button type="submit" className="w-full" disabled={loading || !factorId}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
              </Button>
              <button
                type="button"
                onClick={startPushApproval}
                disabled={loading}
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                <Smartphone className="h-3.5 w-3.5" /> Aprovar em outro dispositivo
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("email-request");
                }}
                className="block w-full text-center text-xs text-muted-foreground underline hover:text-foreground"
              >
                Estou sem meu dispositivo
              </button>
            </form>
          ) : mode === "push" ? (
            <div className="space-y-3 text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Smartphone className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                Enviamos uma notificação aos seus dispositivos com login ativo. Abra a
                notificação e toque em <strong>Sim, sou eu</strong> para liberar o
                acesso.
              </p>
              <p className="text-xs text-muted-foreground">
                Aguardando aprovação… {pushSecondsLeft}s
              </p>
              {error ? (
                <p className="text-sm text-destructive" role="alert">{error}</p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  stopPushPolling();
                  setError(null);
                  setPushApprovalId(null);
                  setMode("totp");
                }}
                className="block w-full text-center text-xs text-muted-foreground underline hover:text-foreground"
              >
                Cancelar e usar o código do app
              </button>
            </div>
          ) : mode === "email-request" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Enviaremos um código de 6 dígitos para o seu e-mail cadastrado <strong>{maskedEmail}</strong>.
                Ao usar este código, sua autenticação em duas etapas será desativada e você poderá reconfigurá-la depois.
              </p>
              {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
              <Button onClick={sendEmailOtp} className="w-full" disabled={loading || !email}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar código por e-mail"}
              </Button>
              <button
                type="button"
                onClick={() => { setError(null); setMode("totp"); }}
                className="block w-full text-center text-xs text-muted-foreground underline hover:text-foreground"
              >
                Voltar
              </button>
              <p className="pt-2 text-center text-xs text-muted-foreground">
                Sem acesso ao e-mail também?{" "}
                <Link
                  to="/suporte/redefinir-2fa"
                  className="font-medium text-primary underline"
                >
                  Solicite ajuda ao suporte
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={verifyEmailOtp} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Digite o código de 6 dígitos enviado para <strong>{maskedEmail}</strong>.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="email-code">Código por e-mail</Label>
                <Input
                  id="email-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center font-mono text-lg tracking-widest"
                  autoFocus
                />
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
              </Button>
              <button
                type="button"
                onClick={() => { setError(null); setMode("email-request"); setCode(""); }}
                className="block w-full text-center text-xs text-muted-foreground underline hover:text-foreground"
              >
                Reenviar código
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
            className="hover:text-foreground"
          >
            Cancelar e sair
          </button>
        </p>
      </div>
    </div>
  );
}
