import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { SettingsBlock } from "@/features/account/components/SettingsBlock";
import { EnrollTotpDialog } from "./EnrollTotpDialog";

type Factor = { id: string; status: string; friendly_name: string | null };

export function SecuritySection() {
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      toast.error(error.message);
      setFactors([]);
      return;
    }
    setFactors(
      (data?.totp ?? []).map((f) => ({
        id: f.id,
        status: f.status,
        friendly_name: f.friendly_name ?? null,
      })),
    );
  }

  useEffect(() => {
    void load();
  }, []);

  const verified = (factors ?? []).filter((f) => f.status === "verified");
  const hasMfa = verified.length > 0;

  async function disable(factorId: string) {
    setRemovingId(factorId);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setRemovingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Autenticação em duas etapas desativada.");
    void load();
  }

  return (
    <SettingsBlock
      title="Segurança"
      description="Proteja sua conta com autenticação em duas etapas usando o Google Authenticator ou app compatível."
    >
      {factors === null ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Verificando…
        </div>
      ) : hasMfa ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
            <div className="text-sm">
              <p className="font-medium text-foreground">2FA ativa</p>
              <p className="text-muted-foreground">
                A cada login você precisará informar o código do seu aplicativo autenticador.
              </p>
            </div>
          </div>
          {verified.map((f) => (
            <ConfirmDestructive
              key={f.id}
              trigger={
                <Button variant="outline" disabled={removingId === f.id}>
                  {removingId === f.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Desativar autenticação em duas etapas
                </Button>
              }
              title="Desativar 2FA?"
              description={
                <p>
                  Você não precisará mais do código do aplicativo para entrar. Sua conta ficará protegida apenas pela senha.
                </p>
              }
              requirePhrase="DESATIVAR"
              confirmText="Desativar 2FA"
              onConfirm={() => disable(f.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium text-foreground">2FA desativada</p>
              <p className="text-muted-foreground">
                Recomendamos ativar para impedir acessos indevidos à sua conta.
              </p>
            </div>
          </div>
          <Button onClick={() => setShowEnroll(true)}>
            Ativar autenticação em duas etapas
          </Button>
        </div>
      )}

      <EnrollTotpDialog
        open={showEnroll}
        onClose={() => setShowEnroll(false)}
        onEnrolled={() => void load()}
      />
    </SettingsBlock>
  );
}
