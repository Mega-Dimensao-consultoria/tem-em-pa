import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCheck, Inbox, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  component: NotificacoesPage,
  head: () => ({
    meta: [{ title: "Notificações | Tem em PA" }],
  }),
});

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

function NotificacoesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("id,type,title,message,link,read_at,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setItems((data ?? []) as Notification[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function markAll() {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null)
      .eq("user_id", user.id);
    load();
  }

  async function remove(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    load();
  }

  async function toggleRead(n: Notification) {
    await supabase
      .from("notifications")
      .update({ read_at: n.read_at ? null : new Date().toISOString() })
      .eq("id", n.id);
    load();
  }

  const unread = items.filter((n) => !n.read_at).length;

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
            <Button variant="outline" size="sm" onClick={markAll}>
              <CheckCheck className="mr-2 h-4 w-4" /> Marcar todas como lidas
            </Button>
          ) : null}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : items.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-16 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Nenhuma notificação por aqui ainda.
            </div>
          </Card>
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
