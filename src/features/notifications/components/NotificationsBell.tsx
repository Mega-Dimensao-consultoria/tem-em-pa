import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { useAuth } from "@/features/auth/use-auth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { NotificationBadge } from "@/features/notifications/components/NotificationBadge";
import { NotificationListItem } from "@/features/notifications/components/NotificationListItem";

export function NotificationsBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { items, unread, markOne, markAll } = useNotifications(15);

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={`Notificações${unread ? ` (${unread} novas)` : ""}`}
          className="relative rounded-full p-2 text-foreground/70 outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Bell className="h-5 w-5" />
          <NotificationBadge count={unread} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">Notificações</div>
          {unread > 0 ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-xs"
              onClick={() => markAll()}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
            </Button>
          ) : null}
        </div>
        <ScrollArea className="max-h-[420px]">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Você ainda não tem notificações.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id}>
                  <NotificationListItem
                    notification={n}
                    onMarkRead={markOne}
                    onNavigate={() => setOpen(false)}
                  />
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t px-4 py-2 text-center">
          <Link
            to="/notificacoes"
            onClick={() => setOpen(false)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver todas as notificações
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
