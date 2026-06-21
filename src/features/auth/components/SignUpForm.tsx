import { toastError } from "@/lib/safe";
import { useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { emailSchema, passwordSchema } from "../schemas";
import { TurnstileWidget, isCaptchaEnabled } from "./TurnstileWidget";
import { verifyTurnstileToken } from "@/lib/turnstile.functions";

export function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRequired = isCaptchaEnabled();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = z
      .object({
        full_name: z.string().trim().min(2, "Informe seu nome").max(80),
        email: emailSchema,
        password: passwordSchema,
      })
      .safeParse({
        full_name: fd.get("full_name"),
        email: fd.get("email"),
        password: fd.get("password"),
      });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (captchaRequired && !captchaToken) {
      toast.error("Confirme o captcha antes de continuar.");
      return;
    }
    setLoading(true);

    // Valida o token do captcha no servidor antes de criar a conta.
    if (captchaRequired && captchaToken) {
      const verify = await verifyTurnstileToken({ data: { token: captchaToken } });
      if (!verify.ok) {
        setLoading(false);
        setCaptchaToken(null);
        toast.error("Verificação de captcha falhou. Tente novamente.");
        return;
      }
    }

    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.full_name },
      },
    });
    setLoading(false);
    if (error) {
      setCaptchaToken(null);
      toastError(error);
      return;
    }
    toast.success("Conta criada! Você já pode entrar.");
    onSuccess();
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="name-up">Nome completo</Label>
        <Input id="name-up" name="full_name" required maxLength={80} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email-up">E-mail</Label>
        <Input id="email-up" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password-up">Senha</Label>
        <Input
          id="password-up"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>
      {captchaRequired && (
        <div className="pt-1">
          <TurnstileWidget
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
          />
        </div>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={loading || (captchaRequired && !captchaToken)}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta"}
      </Button>
    </form>
  );
}
