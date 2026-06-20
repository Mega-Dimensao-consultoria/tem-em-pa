import { useEffect, useState } from "react";
import { Bell, BellOff, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  canRegisterHere,
  isSubscribedHere,
  pushSupported,
  subscribePush,
  unsubscribePush,
} from "@/features/notifications/push";

type Status = "unknown" | "supported" | "unsupported" | "ios-needs-install";

export function PushSettingsCard() {
  const [status, setStatus] = useState<Status>("unknown");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (pushSupported() && canRegisterHere()) {
      setStatus("supported");
      isSubscribedHere().then(setSubscribed);
      return;
    }
    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const standalone =
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true;
    if (isIos && !standalone) {
      setStatus("ios-needs-install");
    } else {
      setStatus("unsupported");
    }
  }, []);

  async function toggle() {
    setBusy(true);
    try {
      if (subscribed) {
        await unsubscribePush();
        setSubscribed(false);
        toast.success("Notificações desativadas neste dispositivo.");
      } else {
        const r = await subscribePush();
        if (r.ok) {
          setSubscribed(true);
          toast.success("Notificações ativadas neste dispositivo.");
        } else if (r.reason === "denied") {
          toast.error(
            "Permissão negada. Habilite nas configurações do navegador.",
          );
        } else {
          toast.error("Não foi possível ativar agora.");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-6 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          {subscribed ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Notificações push</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Receba avisos neste navegador ou aparelho quando algo importante
            acontecer com sua conta — respostas a avaliações, empresas
            aprovadas, reivindicações e mais. Cada dispositivo onde você
            ativar receberá as notificações.
          </p>

          {status === "ios-needs-install" ? (
            <div className="mt-3 flex gap-2 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-900">
              <Smartphone className="h-4 w-4 shrink-0" />
              <span>
                No iPhone/iPad, push só funciona após adicionar este site à
                tela inicial: toque em Compartilhar → "Adicionar à Tela de
                Início" e abra a partir do ícone.
              </span>
            </div>
          ) : null}

          {status === "unsupported" ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Este navegador não suporta notificações push ou você está em
              modo de pré-visualização. Use o site publicado.
            </p>
          ) : null}

          {status === "supported" ? (
            <Button
              className="mt-4"
              size="sm"
              disabled={busy}
              onClick={toggle}
              variant={subscribed ? "outline" : "default"}
            >
              {busy
                ? "..."
                : subscribed
                  ? "Desativar neste dispositivo"
                  : "Ativar neste dispositivo"}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
