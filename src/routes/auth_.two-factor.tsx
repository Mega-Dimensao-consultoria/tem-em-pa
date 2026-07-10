import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { requestTwoFaEmailOtp, verifyTwoFaEmailOtp } from "@/lib/twofa.functions";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth_/two-factor")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Verificação em duas etapas — Tem na cidade" },
      { name: "description", content: "Informe o código do aplicativo autenticador para concluir o login com 2FA no Tem na cidade." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TwoFactorPage,
});

type Mode = "totp" | "email-request" | "email-verify";

function safeRedirectPath(path?: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

function TwoFactorPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const redirectTo = safeRedirectPath(redirect);
  const requestOtp = useServerFn(requestTwoFaEmailOtp);
  const verifyOtp = useServerFn(verifyTwoFaEmailOtp);

  const [mode, setMode] = useState<Mode>("totp");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (cancelled) return;
      if (aal?.currentLevel === "aal2") {
        window.location.replace(redirectTo);
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
        setBootError("Nenhum método de verificação ativo foi encontrado nesta conta.");
        return;
      }
      setFactorId(totp.id);
      const { data: u } = await supabase.auth.getUser();
      setEmail(u.user?.email ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [redirectTo]);

  async function verifyTotp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Digite o código de 6 dígitos.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
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
      window.location.replace(redirectTo);
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
      window.location.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código incorreto ou expirado.");
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
              <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
              </Button>
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
