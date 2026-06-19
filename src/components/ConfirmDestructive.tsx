import { useState, type ReactNode } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ConfirmDestructive({
  trigger,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  requirePhrase,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** If provided, user must type this exact phrase to enable confirm. */
  requirePhrase?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const phraseOk = !requirePhrase || typed.trim() === requirePhrase;

  async function handle() {
    if (!phraseOk) return;
    setBusy(true);
    try { await onConfirm(); } finally {
      setBusy(false);
      setTyped("");
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setTyped(""); }}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild><div className="space-y-2 text-sm">{description}</div></AlertDialogDescription>
        </AlertDialogHeader>
        {requirePhrase ? (
          <div className="space-y-2">
            <Label htmlFor="confirm-phrase" className="text-xs">
              Para confirmar, digite <code className="rounded bg-muted px-1 font-mono">{requirePhrase}</code>
            </Label>
            <Input
              id="confirm-phrase"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handle(); }}
            disabled={!phraseOk || busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy ? "Processando…" : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
