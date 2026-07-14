import { toastError } from "@/lib/safe";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/upload/ImageUpload";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ClaimDialog({
  companyId,
  userId,
  triggerLabel = "Reivindicar empresa",
  triggerVariant = "outline",
}: {
  companyId: string;
  userId: string;
  triggerLabel?: string;
  triggerVariant?: "outline" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [docPath, setDocPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!docPath) { toast.error("Anexe ao menos um documento"); return; }
    setLoading(true);
    const { error } = await supabase.from("company_claims").insert({
      company_id: companyId,
      user_id: userId,
      message: message || null,
      document_urls: [docPath],
    });
    setLoading(false);
    if (error) { toastError(error); return; }
    toast.success("Reivindicação enviada! Aguarde análise.");
    setOpen(false); setMessage(""); setDocPath(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerVariant === "ghost" ? (
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Flag className="mr-1 h-3.5 w-3.5" /> {triggerLabel}
          </Button>
        ) : (
          <Button variant="outline" className="rounded-full">
            <Flag className="mr-2 h-4 w-4" /> {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reivindicar empresa</DialogTitle>
          <DialogDescription>Comprove que você é o(a) responsável. Anexe um documento (contrato social, alvará, etc).</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Documento *</Label>
            <ImageUpload bucket="claim-documents" userId={userId} value={docPath} onChange={setDocPath} accept="image/*,.pdf" label="Anexar documento" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="msg">Mensagem (opcional)</Label>
            <Textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={500} placeholder="Conte sua relação com a empresa…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando…</> : "Enviar reivindicação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
