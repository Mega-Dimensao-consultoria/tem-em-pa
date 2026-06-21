import { toastError } from "@/lib/safe";
import { useState } from "react";
import { Flag } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/use-auth";
import { toast } from "sonner";

const REASONS = [
  { value: "spam", label: "Spam ou propaganda" },
  { value: "offensive", label: "Linguagem ofensiva" },
  { value: "fake", label: "Avaliação falsa / não cliente" },
  { value: "personal_info", label: "Contém dados pessoais" },
  { value: "other", label: "Outro motivo" },
];

export function ReportReviewDialog({ reviewId }: { reviewId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("spam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("review_reports").insert({
      review_id: reviewId,
      reporter_id: user.id,
      reason,
      details: details.trim() || null,
    });
    setBusy(false);
    if (error) {
      if (error.code === "23505") {
        toast.info("Você já denunciou esta avaliação. Nossa equipe analisará em breve.");
        setOpen(false);
        return;
      }
      toastError(error);
      return;
    }
    toast.success("Denúncia enviada. Nossa equipe vai analisar com atenção.");
    setOpen(false);
    setDetails("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition hover:text-destructive"
          aria-label="Denunciar avaliação"
        >
          <Flag className="h-3 w-3" /> Denunciar
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Denunciar avaliação</DialogTitle>
          <DialogDescription>
            Sua denúncia é confidencial. Nossa equipe avaliará o conteúdo conforme as diretrizes da comunidade.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1 block text-xs">Motivo</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Detalhes (opcional)</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 500))}
              placeholder="Descreva brevemente o que há de errado com esta avaliação."
              rows={4}
            />
            <div className="mt-1 text-right text-[10px] text-muted-foreground">{details.length}/500</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Enviando…" : "Enviar denúncia"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
