import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCheck, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { NotificationListSkeleton } from "@/components/feedback/Skeletons";
import { NoNotifications } from "@/components/feedback/EmptyState";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  component: NotificacoesPage,
  head: () => ({
    meta: [
      { title: "Minhas notificações — Tem na cidade" },
      { name: "description", content: "Veja alertas de novas avaliações, respostas do proprietário e novidades das empresas que você acompanha no Tem na cidade." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function NotificacoesPage() {
  const { items, unread, isLoading, markAll, toggleRead, remove } =
    useNotifications(200);

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
            <p className="text-sm text-muted-foreground">
              {unread > 0
                ? `Você tem ${unread} notificação(ões) não lida(s).`
                : "Tudo em dia."}
            </p>
          </div>
          {unread > 0 ? (
            <Button variant="outline" size="sm" onClick={() => markAll()}>
              <CheckCheck className="mr-2 h-4 w-4" /> Marcar todas como lidas
            </Button>
          ) : null}
        </div>

        {isLoading ? (
          <NotificationListSkeleton count={5} />
        ) : items.length === 0 ? (
          <NoNotifications />
        ) : (
          <ul className="space-y-2">
            {items.map((n) => (
              <li key={n.id}>
                <Card
                  className={`flex gap-3 p-4 transition ${
                    !n.read_at ? "border-primary/40 bg-primary/5" : ""
                  }`}
                >
                  <div
                    className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                      !n.read_at ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="font-semibold">{n.title}</div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(n.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                      {n.link ? (
                        <Link
                          to={n.link}
                          className="font-medium text-primary hover:underline"
                          onClick={() => !n.read_at && toggleRead(n)}
                        >
                          Abrir →
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => toggleRead(n)}
                    >
                      {n.read_at ? "Marcar não lida" : "Marcar lida"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => remove(n.id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Excluir
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
