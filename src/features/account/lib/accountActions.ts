import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/** Triggers a Supabase email-change confirmation flow. */
export async function requestEmailChange(newEmail: string): Promise<boolean> {
  const trimmed = newEmail.trim();
  if (!trimmed.includes("@")) {
    toast.error("Informe um e-mail válido.");
    return false;
  }
  const { error } = await supabase.auth.updateUser({ email: trimmed });
  if (error) {
    toastError(error);
    return false;
  }
  toast.success(
    "Confirme a alteração nos dois e-mails (atual e novo) para concluir a troca.",
  );
  return true;
}

type ChangePasswordInput = {
  email: string | undefined;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

/** Re-authenticates with the current password and rotates to a new one. */
export async function changePassword({
  email,
  currentPassword,
  newPassword,
  confirmPassword,
}: ChangePasswordInput): Promise<boolean> {
  if (!email) {
    toast.error("Conta sem e-mail. Use redefinição de senha.");
    return false;
  }
  if (newPassword.length < 8) {
    toast.error("A nova senha precisa ter pelo menos 8 caracteres.");
    return false;
  }
  if (newPassword !== confirmPassword) {
    toast.error("As senhas não coincidem.");
    return false;
  }
  const reauth = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (reauth.error) {
    toast.error("Senha atual incorreta.");
    return false;
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    toastError(error);
    return false;
  }
  toast.success("Senha atualizada.");
  return true;
}
