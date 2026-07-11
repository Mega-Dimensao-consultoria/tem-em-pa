import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/**
 * After the very first OAuth sign-in (Google/Apple), prompt the user to
 * confirm the full name we received and optionally set a password so they
 * can also sign in with email + password from now on.
 */
export function OnboardingDialog() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [hasEmailIdentity, setHasEmailIdentity] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const nameId = useId();
  const pwdId = useId();
  const confirmId = useId();

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, onboarding_completed_at")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (profile?.onboarding_completed_at) return;
      const identities = user.identities ?? [];
      const providers = identities.map((i) => i.provider);
      const isSocialOnly =
        providers.length > 0 && !providers.includes("email");
      // Only prompt social-first users — email/password signups already
      // confirmed their data on the form.
      if (!isSocialOnly) return;
      setHasEmailIdentity(providers.includes("email"));
      setFullName(
        profile?.full_name ??
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          "",
      );
      setOpen(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  async function markComplete() {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const name = fullName.trim();
    if (name.length < 3) {
      toast.error("Informe seu nome completo.");
      return;
    }
    const wantsPassword = password.length > 0 || confirm.length > 0;
    if (wantsPassword) {
      if (password.length < 8) {
        toast.error("A senha precisa ter pelo menos 8 caracteres.");
        return;
      }
      if (password !== confirm) {
        toast.error("As senhas não coincidem.");
        return;
      }
    }
    setSubmitting(true);
    try {
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ full_name: name })
        .eq("id", user.id);
      if (profileErr) throw profileErr;

      const userUpdate: { data: { full_name: string }; password?: string } = {
        data: { full_name: name },
      };
      if (wantsPassword) userUpdate.password = password;
      const { error: authErr } = await supabase.auth.updateUser(userUpdate);
      if (authErr) throw authErr;

      await markComplete();
      toast.success(
        wantsPassword
          ? "Tudo certo! Agora você também pode entrar com e-mail e senha."
          : "Dados confirmados. Bem-vindo(a)!",
      );
      setOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível salvar.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    setSkipping(true);
    try {
      await markComplete();
      setOpen(false);
    } finally {
      setSkipping(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !submitting) handleSkip(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bem-vindo(a) ao Tem na minha cidade</DialogTitle>
          <DialogDescription>
            Confirme seu nome e, se quiser, crie uma senha para também entrar
            com e-mail sem precisar do {hasEmailIdentity ? "provedor social" : "Google ou Apple"}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={nameId}>Nome completo</Label>
            <Input
              id={nameId}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={pwdId}>Criar senha (opcional)</Label>
            <Input
              id={pwdId}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={confirmId}>Confirmar senha</Label>
            <Input
              id={confirmId}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={password.length === 0}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Definir a senha permite que você entre com {user?.email ?? "seu e-mail"} e
            a senha escolhida, além do login social.
          </p>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={submitting || skipping}
            >
              Agora não
            </Button>
            <Button type="submit" disabled={submitting || skipping}>
              {submitting ? "Salvando…" : "Salvar e continuar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
