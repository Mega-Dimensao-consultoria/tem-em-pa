import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";
import { SettingsBlock } from "./SettingsBlock";

/** Global sign-out for the signed-in user, across devices. */
export function SessionsSection() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOutAll() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut({ scope: "global" });
    navigate({ to: "/auth", replace: true });
  }

  return (
    <SettingsBlock icon={<LogOut className="h-5 w-5" />} title="Sessões">
      <p className="mb-3 text-sm text-muted-foreground">
        Encerre sua sessão em todos os dispositivos onde está conectado.
      </p>
      <Button variant="outline" onClick={signOutAll}>
        Sair de todos os dispositivos
      </Button>
    </SettingsBlock>
  );
}

/** Permanent account deletion with phrase confirmation. */
export function DangerZoneSection() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function deleteAccount() {
    try {
      await deleteMyAccount();
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      toast.success("Sua conta foi excluída.");
      navigate({ to: "/", replace: true });
    } catch (e) {
      toastError(e, "Falha ao excluir.");
    }
  }

  return (
    <SettingsBlock
      icon={<ShieldAlert className="h-5 w-5 text-destructive" />}
      title="Excluir conta"
      tone="danger"
    >
      <p className="mb-3 text-sm text-muted-foreground">
        Esta ação remove sua conta de forma permanente, junto com favoritos,
        avaliações e reivindicações associadas. Empresas das quais você é dono
        ficam sem proprietário e voltam para aprovação manual.
      </p>
      <ConfirmDestructive
        trigger={<Button variant="destructive">Excluir minha conta</Button>}
        title="Excluir conta permanentemente?"
        description={
          <p>
            Esta ação não pode ser desfeita. Para confirmar, digite a frase
            abaixo exatamente como aparece.
          </p>
        }
        requirePhrase="EXCLUIR MINHA CONTA"
        confirmText="Excluir conta"
        onConfirm={deleteAccount}
      />
    </SettingsBlock>
  );
}
