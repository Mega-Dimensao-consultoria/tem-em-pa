import { toastError } from "@/lib/safe";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { emailSchema } from "../schemas";

export function ForgotPassword() {
  const [loading, setLoading] = useState(false);

  async function reset() {
    const email = window.prompt("Digite seu e-mail para receber o link de recuperação:");
    if (!email) return;
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error("E-mail inválido.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toastError(error);
      return;
    }
    toast.success("Enviamos um e-mail com o link de recuperação.");
  }

  return (
    <button
      type="button"
      onClick={reset}
      disabled={loading}
      className="block text-xs font-medium text-primary hover:underline"
    >
      Esqueci minha senha
    </button>
  );
}
