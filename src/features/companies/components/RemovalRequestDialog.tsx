import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { toastError } from "@/lib/safe";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Reason = "closed" | "incorrect" | "duplicate" | "owner_request" | "other";

const REASONS: { value: Reason; label: string }[] = [
  { value: "closed", label: "Empresa fechou ou não existe mais" },
  { value: "incorrect", label: "Informações estão incorretas" },
  { value: "duplicate", label: "Cadastro duplicado" },
  { value: "owner_request", label: "Sou o dono e quero remover" },
  { value: "other", label: "Outro motivo" },
];

type Props = {
  companyId: string;
  userId: string | null;
  /** Quando true, mostra um botão maior tipo CTA do painel do dono. */
  ownerMode?: boolean;
};

export function RemovalRequestDialog({ companyId, userId, ownerMode }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>(
    ownerMode ? "owner_request" : "closed",
  );
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!userId) {
      toast.error("Faça login para solicitar a remoção.");
      return;
    }
    const trimmed = details.trim();
    if (reason === "other" && trimmed.length < 10) {
      toast.error("Descreva o motivo com pelo menos 10 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("company_removal_requests").insert({
      company_id: companyId,
      user_id: userId,
      reason,
      details: trimmed.length > 0 ? trimmed : null,
    });
    setLoading(false);
    if (error) {
      toastError(error);
      return;
    }
    toast.success(
      "Solicitação enviada. Vamos analisar e responder em breve.",
    );
    setOpen(false);
    setDetails("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {ownerMode ? (
          <Button variant="outline" className="rounded-full text-destructive hover:text-destructive">
            <Flag className="mr-2 h-4 w-4" /> Solicitar remoção da empresa
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Flag className="mr-1 h-3.5 w-3.5" /> Reportar problema
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {ownerMode ? "Solicitar remoção da empresa" : "Reportar problema"}
          </DialogTitle>
          <DialogDescription>
            {ownerMode
              ? "Sua empresa será ocultada após análise dos administradores."
              : "Nos conte o que está errado com este cadastro. Um administrador vai revisar."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as Reason)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.filter((r) =>
                  ownerMode ? true : r.value !== "owner_request",
                ).map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="details">
              Detalhes {reason === "other" ? "*" : "(opcional)"}
            </Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Explique o motivo, links ou evidências…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando…
              </>
            ) : (
              "Enviar solicitação"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
