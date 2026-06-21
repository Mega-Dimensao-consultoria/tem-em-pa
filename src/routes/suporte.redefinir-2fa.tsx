import { toastError } from "@/lib/safe";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Loader2, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/suporte/redefinir-2fa")({
  head: () => ({
    meta: [
      { title: "Redefinir 2FA — Tem em P.A" },
      {
        name: "description",
        content:
          "Perdeu acesso ao seu autenticador e ao e-mail? Solicite ajuda do suporte para redefinir a verificação em duas etapas.",
      },
    ],
  }),
  component: ResetTwoFaSupportPage,
});

const formSchema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome completo.").max(120),
  contact_email: z.string().trim().email("E-mail inválido.").max(180),
  message: z
    .string()
    .trim()
    .min(20, "Descreva o ocorrido com mais detalhes (mínimo 20 caracteres).")
    .max(2000),
});

function ResetTwoFaSupportPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = formSchema.safeParse({
      full_name: fd.get("full_name"),
      contact_email: fd.get("contact_email"),
      message: fd.get("message"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("two_fa_reset_requests").insert({
      full_name: parsed.data.full_name,
      contact_email: parsed.data.contact_email,
      message: parsed.data.message,
      user_id: u.user?.id ?? null,
    });
    setLoading(false);
    if (error) {
      toastError(error);
      return;
    }
    setSent(true);
    toast.success("Pedido enviado!");
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <LifeBuoy className="h-3.5 w-3.5" /> Suporte
        </div>
        <h1 className="font-display text-3xl font-bold">
          Redefinir verificação em duas etapas
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use este formulário apenas se você perdeu acesso ao aplicativo
          autenticador <strong>e</strong> ao e-mail cadastrado na conta. Um
          administrador analisará o pedido e entrará em contato pelo e-mail
          informado abaixo. Por segurança, o processo pode levar até 48 horas
          úteis.
        </p>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Pedido recebido ✓</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Em breve nossa equipe entrará em contato pelo e-mail informado.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block text-sm font-medium text-primary underline"
            >
              Voltar para a home
            </Link>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft"
          >
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" name="full_name" required maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_email">E-mail para contato</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                required
                maxLength={180}
              />
              <p className="text-xs text-muted-foreground">
                Informe um e-mail ao qual você tem acesso. Não precisa ser o mesmo da conta.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">O que aconteceu?</Label>
              <Textarea
                id="message"
                name="message"
                required
                rows={5}
                maxLength={2000}
                placeholder="Descreva como você perdeu acesso e qualquer informação que ajude a confirmar sua identidade (telefone, CPF parcial, empresas vinculadas, etc.)."
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar pedido"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              <Link to="/auth/two-factor" className="hover:text-foreground">
                ← Voltar para verificação
              </Link>
            </p>
          </form>
        )}
      </section>
    </PageShell>
  );
}
