import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { SignUpForm } from "@/features/auth/components/SignUpForm";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entrar — Tem na cidade" },
      {
        name: "description",
        content:
          "Acesse sua conta no Tem na cidade para avaliar empresas e gerenciar seu negócio.",
      },
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
          <p className="text-sm text-muted-foreground">
            Bem-vindo de volta! Acesse sua conta.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <SignInForm onSuccess={onAuthed} />
            </TabsContent>
            <TabsContent value="signup">
              <SignUpForm onSuccess={onAuthed} />
            </TabsContent>
          </Tabs>

          <div className="relative my-6 text-center">
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
            <span className="relative bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">
              ou continue com
            </span>
          </div>

          <OAuthButtons />

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
