import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Reply, Trash2 } from "lucide-react";

export function OwnerReplyForm({
  reviewId,
  initialReply,
  replyAt,
  onSaved,
}: {
  reviewId: string;
  initialReply: string | null;
  replyAt: string | null;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initialReply ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSaving(true);
    const { error } = await supabase
      .from("reviews")
      .update({ owner_reply: trimmed, owner_reply_at: new Date().toISOString() })
      .eq("id", reviewId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Resposta publicada");
    setEditing(false);
    onSaved();
  }

  async function remove() {
    if (!confirm("Remover sua resposta?")) return;
    setSaving(true);
    const { error } = await supabase
      .from("reviews")
      .update({ owner_reply: null, owner_reply_at: null })
      .eq("id", reviewId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Resposta removida");
    setText("");
    setEditing(false);
    onSaved();
  }

  if (!editing && initialReply) {
    return (
      <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-primary">Resposta do proprietário</span>
          {replyAt ? <span className="text-[10px] text-muted-foreground">{new Date(replyAt).toLocaleDateString("pt-BR")}</span> : null}
        </div>
        <p className="text-sm">{initialReply}</p>
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(true)}>Editar</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={remove} disabled={saving}>
            <Trash2 className="mr-1 h-3 w-3" />Remover
          </Button>
        </div>
      </div>
    );
  }

  if (!editing) {
    return (
      <Button size="sm" variant="outline" className="mt-3 h-8 text-xs" onClick={() => setEditing(true)}>
        <Reply className="mr-1 h-3 w-3" />Responder
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escreva uma resposta pública…"
        rows={3}
        maxLength={1000}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving || !text.trim()}>Publicar resposta</Button>
        <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setText(initialReply ?? ""); }}>Cancelar</Button>
      </div>
    </div>
  );
}
