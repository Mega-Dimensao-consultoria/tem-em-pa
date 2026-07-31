import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import {
  useAdminFaqItems,
  useDeleteFaqItem,
  useSaveFaqItem,
  type AdminFaqItem,
  type FaqCategory,
} from "@/features/faq/functions/adminFaq";
import { Empty, Loading } from "../admin-ui";

const CATEGORY_LABEL: Record<FaqCategory, string> = {
  moradores: "Moradores e visitantes",
  empresas: "Empresas e profissionais",
};

type Draft = {
  id?: string;
  category: FaqCategory;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

const EMPTY_DRAFT: Draft = {
  category: "moradores",
  question: "",
  answer: "",
  sort_order: 0,
  is_active: true,
};

export function FaqTab() {
  const { data = [], isLoading } = useAdminFaqItems();
  const save = useSaveFaqItem();
  const remove = useDeleteFaqItem();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  function openNew() {
    const nextOrder = data.length > 0 ? Math.max(...data.map((d) => d.sort_order)) + 1 : 1;
    setDraft({ ...EMPTY_DRAFT, sort_order: nextOrder });
    setOpen(true);
  }

  function openEdit(item: AdminFaqItem) {
    setDraft({ ...item });
    setOpen(true);
  }

  function submit() {
    if (draft.question.trim().length < 3 || draft.answer.trim().length < 3) return;
    save.mutate(
      {
        ...(draft.id ? { id: draft.id } : {}),
        category: draft.category,
        question: draft.question.trim(),
        answer: draft.answer.trim(),
        sort_order: draft.sort_order,
        is_active: draft.is_active,
      },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <section className="mt-4 space-y-3" aria-labelledby="faq-admin-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="faq-admin-heading" className="font-display text-lg font-bold">
            Perguntas frequentes
          </h2>
          <p className="text-sm text-muted-foreground">
            As perguntas ativas aparecem automaticamente na página inicial.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar nova pergunta
        </Button>
      </div>

      {isLoading ? (
        <Loading />
      ) : data.length === 0 ? (
        <Empty>Nenhuma pergunta cadastrada.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <caption className="sr-only">Perguntas frequentes exibidas na página inicial.</caption>
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Pergunta</th>
                <th scope="col" className="px-4 py-3 font-medium">Categoria</th>
                <th scope="col" className="px-4 py-3 font-medium">Ordem</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-t border-border transition hover:bg-muted/40">
                  <td className="max-w-md px-4 py-3 font-medium">{item.question}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {CATEGORY_LABEL[item.category]}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.sort_order}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.is_active ? "Ativa" : "Oculta"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Editar ${item.question}`}
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmDestructive
                        trigger={
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Remover ${item.question}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title="Remover pergunta?"
                        description={<p>A pergunta deixará de aparecer na página inicial.</p>}
                        onConfirm={() => remove.mutate({ id: item.id })}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {draft.id ? "Editar pergunta" : "Nova pergunta"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="faq-question">Pergunta</Label>
              <Input
                id="faq-question"
                value={draft.question}
                onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                maxLength={300}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="faq-answer">Resposta</Label>
              <Textarea
                id="faq-answer"
                rows={5}
                value={draft.answer}
                onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
                maxLength={2000}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="faq-category">Categoria</Label>
                <Select
                  value={draft.category}
                  onValueChange={(v) => setDraft({ ...draft, category: v as FaqCategory })}
                >
                  <SelectTrigger id="faq-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moradores">{CATEGORY_LABEL.moradores}</SelectItem>
                    <SelectItem value="empresas">{CATEGORY_LABEL.empresas}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="faq-order">Ordem de exibição</Label>
                <Input
                  id="faq-order"
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) =>
                    setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="faq-active"
                checked={draft.is_active}
                onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
              />
              <Label htmlFor="faq-active">Exibir na página inicial</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
