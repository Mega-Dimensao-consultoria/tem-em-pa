import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Notification } from "@/features/notifications/hooks/useNotifications";

type Props = {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onNavigate?: () => void;
};

/** Compact item used inside the bell popover. */
export function NotificationListItem({ notification: n, onMarkRead, onNavigate }: Props) {
  const body = (
    <div
      className={`flex gap-3 px-4 py-3 transition hover:bg-muted/60 ${
        !n.read_at ? "bg-primary/5" : ""
      }`}
    >
      <div
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
          !n.read_at ? "bg-primary" : "bg-transparent"
        }`}
      />
      <div className="flex-1 space-y-1">
        <div className="text-sm font-medium leading-tight">{n.title}</div>
        <div className="line-clamp-2 text-xs text-muted-foreground">{n.message}</div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
        </div>
      </div>
      {!n.read_at ? (
        <button
          aria-label="Marcar como lida"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarkRead(n.id);
          }}
          className="self-start rounded p-1 text-muted-foreground transition hover:bg-background hover:text-foreground"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );

  if (!n.link) return body;
  return (
    <Link
      to={n.link}
      onClick={() => {
        onNavigate?.();
        if (!n.read_at) onMarkRead(n.id);
      }}
    >
      {body}
    </Link>
  );
}
