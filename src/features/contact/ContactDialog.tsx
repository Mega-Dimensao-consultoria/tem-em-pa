import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const Schema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome completo").max(120),
  email: z.string().trim().email("E-mail inválido").max(200),
  subject: z.string().trim().min(2, "Informe um assunto").max(200),
  message: z.string().trim().min(5, "Mensagem muito curta").max(4000),
});

type ContactDialogProps = {
  trigger?: React.ReactNode;
};

export function ContactDialog({ trigger }: ContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", subject: "", message: "" });
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  function reset() {
    setForm({ full_name: "", email: "", subject: "", message: "" });
    setWebsite("");
    setErrors({});
    setSent(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof typeof form, string>> = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as keyof typeof form;
        if (k) fieldErrors[k] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/contact-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, website }),
      });
      if (!res.ok) throw new Error("Falha ao enviar");
      setSent(true);
      toast.success("Mensagem enviada! Em breve entraremos em contato.");
    } catch (err) {
      toast.error("Não foi possível enviar agora. Tente novamente em instantes.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTimeout(reset, 200);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="secondary" className="gap-2">
            <Mail className="h-4 w-4" /> Fale com a gente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Entre em contato</DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="space-y-4 py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary/15 text-secondary">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="font-display text-lg font-bold">Mensagem enviada!</h3>
            <p className="text-sm text-muted-foreground">
              Recebemos sua mensagem e responderemos no e-mail informado o quanto antes.
            </p>
            <Button onClick={() => setOpen(false)} className="mt-2">Fechar</Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name">Nome completo</Label>
              <Input
                id="contact-name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                maxLength={120}
                autoComplete="name"
                required
              />
              {errors.full_name ? <p className="text-xs text-destructive">{errors.full_name}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">E-mail</Label>
              <Input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={200}
                autoComplete="email"
                required
              />
              {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-subject">Assunto</Label>
              <Input
                id="contact-subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                maxLength={200}
                required
              />
              {errors.subject ? <p className="text-xs text-destructive">{errors.subject}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-message">Mensagem</Label>
              <Textarea
                id="contact-message"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                maxLength={4000}
                required
              />
              {errors.message ? <p className="text-xs text-destructive">{errors.message}</p> : null}
            </div>

            {/* Honeypot: hidden field, real users leave it empty */}
            <div className="hidden" aria-hidden="true">
              <label>
                Não preencha: <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <Button type="submit" disabled={submitting} className="w-full gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? "Enviando..." : "Enviar mensagem"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
