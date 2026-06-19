import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entrar — Tem em P.A" },
      { name: "description", content: "Acesse sua conta no Tem em P.A para avaliar empresas e gerenciar seu negócio." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  function onAuthed() {
    navigate({ to: redirect ?? "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Link to="/"><Logo /></Link>
          <p className="text-sm text-muted-foreground">Bem-vindo de volta! Acesse sua conta.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignInForm onSuccess={onAuthed} /></TabsContent>
            <TabsContent value="signup"><SignUpForm onSuccess={onAuthed} /></TabsContent>
          </Tabs>

          <div className="relative my-6 text-center">
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
            <span className="relative bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">ou continue com</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => oauth("google")}>Google</Button>
            <Button variant="outline" onClick={() => oauth("apple")}>Apple</Button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Ao continuar você concorda com nossos{" "}
            <Link to="/sobre" className="underline">termos de uso</Link>.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Voltar para a home</Link>
        </p>
      </div>
    </div>
  );
}

async function oauth(provider: "google" | "apple") {
  const result = await lovable.auth.signInWithOAuth(provider, {
    redirect_uri: window.location.origin,
  });
  if (result.error) {
    toast.error("Não foi possível iniciar o login social.");
    return;
  }
  if (result.redirected) return;
  window.location.href = "/";
}

const emailSchema = z.string().trim().email("E-mail inválido").max(255);
const passwordSchema = z.string().min(8, "Mínimo 8 caracteres").max(72);

function SignInForm({ onSuccess }: { onSuccess: () => void }) {
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
    setLoading(false);
    if (error) { toast.error(error.message); return; }
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
        <Input id="password-in" name="password" type="password" autoComplete="current-password" required />
      </div>
      <ForgotPassword />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
      </Button>
    </form>
  );
}

function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.full_name },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
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
        <Input id="password-up" name="password" type="password" autoComplete="new-password" required />
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta"}
      </Button>
    </form>
  );
}

function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  async function reset() {
    const email = window.prompt("Digite seu e-mail para receber o link de recuperação:");
    if (!email) return;
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) { toast.error("E-mail inválido."); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Enviamos um e-mail com o link de recuperação.");
  }
  return (
    <button type="button" onClick={reset} disabled={loading} className="block text-xs font-medium text-primary hover:underline">
      Esqueci minha senha
    </button>
  );
}
