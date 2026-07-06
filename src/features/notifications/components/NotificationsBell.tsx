import { useEffect, useId, useRef, useState } from "react";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();

  // F8 keyboard shortcut: toggles the notifications center for screen-reader
  // and keyboard users, matching the aria-label announcement.
  useEffect(() => {
    if (!user) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "F8") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable;
      if (isEditable) return;
      e.preventDefault();
      setOpen((v) => !v);
      // ensure focus lands somewhere reachable
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user]);

  if (!user) return null;

  const ariaLabel = `Central de notificações (F8)${
    unread ? ` — ${unread} não lida${unread === 1 ? "" : "s"}` : ""
  }`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label={ariaLabel}
          aria-keyshortcuts="F8"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="relative rounded-full p-2 text-foreground/70 outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <NotificationBadge count={unread} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] p-0"
        role="region"
        aria-labelledby={headingId}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 id={headingId} className="font-semibold">
            Central de notificações
          </h2>
          {unread > 0 ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-xs"
              onClick={() => markAll()}
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" /> Marcar todas
            </Button>
          ) : null}
        </div>
        <ScrollArea className="max-h-[420px]">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Você ainda não tem notificações.
            </div>
          ) : (
            <ul className="divide-y" aria-label="Lista de notificações">
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
