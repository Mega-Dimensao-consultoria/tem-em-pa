import { toastError } from "@/lib/safe";
import { useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { ForgotPassword } from "./ForgotPassword";
import { emailSchema } from "../schemas";

export function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = z
      .object({ email: emailSchema, password: z.string().min(1, "Informe a senha") })
      .safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      setLoading(false);
      toastError(error);
      return;
    }
    // If MFA is enrolled, Supabase returns AAL1 and expects an AAL2 challenge.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setLoading(false);
    if (aal?.nextLevel === "aal2" && aal.currentLevel === "aal1") {
      window.location.assign("/auth/two-factor");
      return;
    }
    toast.success("Bem-vindo!");
    onSuccess();
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email-in">E-mail</Label>
        <Input id="email-in" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password-in">Senha</Label>
        <Input
          id="password-in"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <ForgotPassword />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
      </Button>
    </form>
  );
}
