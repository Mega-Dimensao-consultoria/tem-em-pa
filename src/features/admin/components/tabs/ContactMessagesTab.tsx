import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Mail, MailOpen, Send, Trash2, Loader2, Eye } from "lucide-react";
import {
  adminListContactMessages,
  adminMarkContactRead,
  adminReplyContactMessage,
  adminDeleteContactMessage,
} from "@/lib/contact-messages.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { Empty, Loading } from "../admin-ui";
import { toastError } from "@/lib/safe";
import { AdminPagination, usePagination } from "../AdminPagination";

export function ContactMessagesTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListContactMessages);
  const markReadFn = useServerFn(adminMarkContactRead);
  const replyFn = useServerFn(adminReplyContactMessage);
  const deleteFn = useServerFn(adminDeleteContactMessage);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "contact-messages"],
    queryFn: () => listFn(),
  });
  const pg = usePagination(data as any[]);

  const markRead = useMutation({
    mutationFn: (id: string) => markReadFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "contact-messages"] }),
    onError: (e) => toastError(e, "Falha ao marcar como lida"),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Mensagem excluída");
      qc.invalidateQueries({ queryKey: ["admin", "contact-messages"] });
    },
    onError: (e) => toastError(e, "Falha ao excluir"),
  });
  const replyMut = useMutation({
    mutationFn: (vars: { id: string; reply: string }) => replyFn({ data: vars }),
    onSuccess: () => {
      toast.success("Resposta enviada por e-mail");
      setReply("");
      setOpenId(null);
      qc.invalidateQueries({ queryKey: ["admin", "contact-messages"] });
    },
    onError: (e) => toastError(e, "Falha ao enviar resposta"),
  });

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhuma mensagem de contato recebida ainda.</Empty>;

  const opened = openId ? (data as any[]).find((m) => m.id === openId) ?? null : null;

  return (
    <section className="mt-4 space-y-3" aria-labelledby="contact-heading">
      <h2 id="contact-heading" className="sr-only">Mensagens de contato</h2>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <caption className="sr-only">Mensagens recebidas pelo formulário de contato.</caption>
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Remetente</th>
              <th scope="col" className="px-4 py-3 font-medium">Assunto</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Data</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pg.paged.map((m: any) => {
              const badge =
                m.status === "new" ? (
                  <Badge variant="default" className="gap-1"><Mail className="h-3 w-3" /> Nova</Badge>
                ) : m.status === "read" ? (
                  <Badge variant="secondary" className="gap-1"><MailOpen className="h-3 w-3" /> Lida</Badge>
                ) : (
                  <Badge variant="outline" className="gap-1"><Send className="h-3 w-3" /> Respondida</Badge>
                );
              return (
                <tr key={m.id} className="border-t border-border transition hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.full_name}</p>
                    <a href={`mailto:${m.email}`} className="text-xs text-muted-foreground hover:underline">
                      {m.email}
                    </a>
                  </td>
                  <td className="max-w-md px-4 py-3">
                    <p className="line-clamp-1 text-sm">{m.subject}</p>
                  </td>
                  <td className="px-4 py-3">{badge}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {new Date(m.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setOpenId(m.id);
                          if (m.status === "new") markRead.mutate(m.id);
                        }}
                      >
                        <Eye className="mr-1 h-4 w-4" /> Ver
                      </Button>
                      <ConfirmDestructive
                        trigger={
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title="Excluir mensagem"
                        description="Esta ação não pode ser desfeita. A mensagem será removida do painel."
                        confirmText="Excluir"
                        onConfirm={() => del.mutate(m.id)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <AdminPagination
        page={pg.page}
        totalPages={pg.totalPages}
        total={pg.total}
        pageSize={pg.pageSize}
        firstItem={pg.firstItem}
        lastItem={pg.lastItem}
        onPageChange={pg.setPage}
        onPageSizeChange={pg.setPageSize}
        label="mensagens"
      />

      <Dialog open={!!opened} onOpenChange={(o) => (o ? null : setOpenId(null))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{opened?.subject}</DialogTitle>
          </DialogHeader>
          {opened ? (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                <strong>{opened.full_name}</strong> &lt;{opened.email}&gt; ·{" "}
                {new Date(opened.created_at).toLocaleString("pt-BR")}
              </p>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mensagem</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{opened.message}</p>
              </div>
              {opened.admin_reply ? (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Sua resposta ·{" "}
                    {opened.replied_at ? new Date(opened.replied_at).toLocaleString("pt-BR") : ""}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{opened.admin_reply}</p>
                </div>
              ) : null}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {opened.admin_reply ? "Enviar nova resposta" : "Responder por e-mail"}
                </label>
                <Textarea
                  rows={4}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  maxLength={4000}
                  placeholder={`Olá ${String(opened.full_name).split(" ")[0]}, ...`}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={replyMut.isPending || reply.trim().length < 2}
                    onClick={() => replyMut.mutate({ id: opened.id, reply: reply.trim() })}
                    className="gap-2"
                  >
                    {replyMut.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Enviar resposta
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
