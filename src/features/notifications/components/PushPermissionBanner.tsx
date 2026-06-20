import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/use-auth";
import {
  canRegisterHere,
  pushSupported,
  subscribePush,
} from "@/features/notifications/push";

const DISMISS_KEY = "push-banner-dismissed-v1";

export function PushPermissionBanner() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setShow(false);
      return;
    }
    if (!pushSupported() || !canRegisterHere()) {
      setShow(false);
      return;
    }
    if (Notification.permission !== "default") {
      setShow(false);
      return;
    }
    if (localStorage.getItem(DISMISS_KEY)) {
      setShow(false);
      return;
    }
    setShow(true);
  }, [user]);

  if (!show) return null;

  async function handleEnable() {
    setBusy(true);
    try {
      const result = await subscribePush();
      if (result.ok) {
        toast.success("Notificações ativadas neste dispositivo.");
        setShow(false);
      } else if (result.reason === "denied") {
        toast.error(
          "Permissão negada. Você pode ativar depois nas configurações do navegador.",
        );
        localStorage.setItem(DISMISS_KEY, "1");
        setShow(false);
      } else {
        toast.error("Não foi possível ativar as notificações agora.");
      }
    } catch {
      toast.error("Erro ao ativar notificações.");
    } finally {
      setBusy(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  return (
    <div className="border-b border-primary/20 bg-primary/10">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Bell className="h-4 w-4 shrink-0 text-primary" />
        <p className="flex-1 text-xs sm:text-sm">
          Receba avisos no celular ou no navegador sobre avaliações,
          aprovações e novidades da sua conta.
        </p>
        <Button
          size="sm"
          onClick={handleEnable}
          disabled={busy}
          className="shrink-0"
        >
          {busy ? "Ativando..." : "Ativar"}
        </Button>
        <button
          onClick={handleDismiss}
          aria-label="Dispensar"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
