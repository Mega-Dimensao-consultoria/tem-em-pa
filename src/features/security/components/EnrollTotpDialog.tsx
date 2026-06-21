import { useEffect, useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EnrollState = {
  factorId: string;
  qr: string;
  secret: string;
};

export function EnrollTotpDialog({
  open,
  onClose,
  onEnrolled,
}: {
  open: boolean;
  onClose: () => void;
  onEnrolled: () => void;
}) {
  const [step, setStep] = useState<"scan" | "verify">("scan");
  const [enroll, setEnroll] = useState<EnrollState | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("scan");
      setCode("");
      setError(null);
      // If a factor was created but not verified, clean it up so we don't
      // accumulate unverified factors on the account.
      if (enroll?.factorId) {
        supabase.auth.mfa.unenroll({ factorId: enroll.factorId }).catch(() => {});
      }
      setEnroll(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase.auth.mfa
      .enroll({ factorType: "totp", friendlyName: `Authenticator ${Date.now()}` })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setError(error?.message ?? "Falha ao iniciar configuração.");
          return;
        }
        setEnroll({
          factorId: data.id,
          qr: data.totp.qr_code,
          secret: data.totp.secret,
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function verify() {
    if (!enroll) return;
    if (!/^\d{6}$/.test(code)) {
      setError("Digite o código de 6 dígitos do aplicativo.");
      return;
    }
    setError(null);
    setLoading(true);
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
      factorId: enroll.factorId,
    });
    if (cErr || !challenge) {
      setLoading(false);
      setError(cErr?.message ?? "Falha ao iniciar verificação.");
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: enroll.factorId,
      challengeId: challenge.id,
      code,
    });
    setLoading(false);
    if (vErr) {
      setError("O código informado está incorreto. Verifique no seu aplicativo e tente novamente.");
      return;
    }
    toast.success("Autenticação em duas etapas ativada!");
    // Mark as "done" so the cleanup effect above doesn't unenroll it on close.
    setEnroll(null);
    onEnrolled();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ativar autenticação em duas etapas</DialogTitle>
          <DialogDescription>
            {step === "scan"
              ? "Abra o Google Authenticator (ou app compatível) e escaneie o código QR. Se preferir, copie a chave manualmente."
              : "Digite o código de 6 dígitos exibido no seu aplicativo autenticador."}
          </DialogDescription>
        </DialogHeader>

        {loading && !enroll ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : enroll ? (
          step === "scan" ? (
            <div className="space-y-4">
              <div className="flex justify-center rounded-xl border border-border bg-white p-4">
                {/* Supabase returns an SVG data URI */}
                <img
                  src={enroll.qr}
                  alt="QR code para configurar o autenticador"
                  className="h-48 w-48"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="totp-secret">Chave de configuração</Label>
                <div className="flex gap-2">
                  <Input
                    id="totp-secret"
                    readOnly
                    value={enroll.secret}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(enroll.secret);
                      toast.success("Chave copiada");
                    }}
                    aria-label="Copiar chave"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button onClick={() => setStep("verify")}>Próximo</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="totp-code">Código do autenticador</Label>
                <Input
                  id="totp-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center font-mono text-lg tracking-widest"
                />
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("scan")}>
                  Voltar
                </Button>
                <Button onClick={verify} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ativar"}
                </Button>
              </DialogFooter>
            </div>
          )
        ) : (
          <p className="text-sm text-destructive">{error ?? "Falha ao iniciar."}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
