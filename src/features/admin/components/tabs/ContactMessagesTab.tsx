import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Mail, MailOpen, Send, Trash2, Loader2 } from "lucide-react";
import {
  adminListContactMessages,
  adminMarkContactRead,
  adminReplyContactMessage,
  adminDeleteContactMessage,
} from "@/lib/contact-messages.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { Empty, Loading } from "../admin-ui";
import { toastError } from "@/lib/safe";

export function ContactMessagesTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListContactMessages);
  const markReadFn = useServerFn(adminMarkContactRead);
  const replyFn = useServerFn(adminReplyContactMessage);
  const deleteFn = useServerFn(adminDeleteContactMessage);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "contact-messages"],
    queryFn: () => listFn(),
  });

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

  const reply = useMutation({
    mutationFn: (vars: { id: string; reply: string }) =>
      replyFn({ data: vars }),
    onSuccess: () => {
      toast.success("Resposta enviada por e-mail");
      qc.invalidateQueries({ queryKey: ["admin", "contact-messages"] });
    },
    onError: (e) => toastError(e, "Falha ao enviar resposta"),
  });

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhuma mensagem de contato recebida ainda.</Empty>;

  return (
    <ul className="mt-4 space-y-3">
      {data.map((m: any) => (
        <ContactRow
          key={m.id}
          message={m}
          onMarkRead={() => markRead.mutate(m.id)}
          onDelete={() => del.mutate(m.id)}
          onReply={(text) => reply.mutate({ id: m.id, reply: text })}
          replyPending={reply.isPending}
        />
      ))}
    </ul>
  );
}

function ContactRow({
  message: m,
  onMarkRead,
  onDelete,
  onReply,
  replyPending,
}: {
  message: any;
  onMarkRead: () => void;
  onDelete: () => void;
  onReply: (text: string) => void;
  replyPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");

  const statusBadge =
    m.status === "new" ? (
      <Badge variant="default" className="gap-1"><Mail className="h-3 w-3" /> Nova</Badge>
    ) : m.status === "read" ? (
      <Badge variant="secondary" className="gap-1"><MailOpen className="h-3 w-3" /> Lida</Badge>
    ) : (
      <Badge variant="outline" className="gap-1"><Send className="h-3 w-3" /> Respondida</Badge>
    );

  return (
    <li className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{m.full_name}</p>
            {statusBadge}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            <a href={`mailto:${m.email}`} className="hover:underline">{m.email}</a> · {" "}
            {new Date(m.created_at).toLocaleString("pt-BR")}
          </p>
          <p className="mt-2 text-sm font-medium">{m.subject}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setOpen((v) => !v);
              if (m.status === "new") onMarkRead();
            }}
          >
            {open ? "Ocultar" : "Ver"}
          </Button>
          <ConfirmDestructive
            title="Excluir mensagem"
            description="Esta ação não pode ser desfeita. A mensagem será removida do painel."
            confirmLabel="Excluir"
            onConfirm={onDelete}
          >
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </ConfirmDestructive>
        </div>
      </div>

      {open ? (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mensagem</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{m.message}</p>
          </div>

          {m.admin_reply ? (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sua resposta · {m.replied_at ? new Date(m.replied_at).toLocaleString("pt-BR") : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{m.admin_reply}</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {m.admin_reply ? "Enviar nova resposta" : "Responder por e-mail"}
            </label>
            <Textarea
              rows={4}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              maxLength={4000}
              placeholder={`Olá ${m.full_name.split(" ")[0]}, ...`}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={replyPending || reply.trim().length < 2}
                onClick={() => {
                  onReply(reply.trim());
                  setReply("");
                }}
                className="gap-2"
              >
                {replyPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar resposta
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}
