import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import {
  useAddBannedWord,
  useBannedWords,
  useRemoveBannedWord,
} from "@/features/admin/functions/bannedWords";
import { Empty, Loading } from "../admin-ui";
import { AdminPagination, usePagination } from "../AdminPagination";

export function BannedWordsTab() {
  const { data = [], isLoading } = useBannedWords();
  const addWord = useAddBannedWord();
  const removeWord = useRemoveBannedWord();
  const [word, setWord] = useState("");
  const [filter, setFilter] = useState("");

  const filtered = useMemo(
    () =>
      filter
        ? data.filter((b) => b.word.toLowerCase().includes(filter.toLowerCase()))
        : data,
    [data, filter],
  );
  const pg = usePagination(filtered);

  function submit() {
    addWord.mutate({ word }, { onSuccess: () => setWord("") });
  }

  return (
    <section className="mt-4 space-y-3" aria-labelledby="banned-words-heading">
      <h2 id="banned-words-heading" className="sr-only">Palavras proibidas</h2>
      <div className="flex flex-wrap gap-2">
        <Input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Nova palavra…"
          maxLength={40}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="max-w-xs"
        />
        <Button onClick={submit}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar…"
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty>Nenhuma palavra cadastrada.</Empty>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full text-sm">
              <caption className="sr-only">Lista de palavras proibidas em comentários.</caption>
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Palavra</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pg.paged.map((b) => (
                  <tr key={b.id} className="border-t border-border transition hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono text-xs">{b.word}</td>
                    <td className="px-4 py-3 text-right">
                      <ConfirmDestructive
                        trigger={
                          <Button size="sm" variant="ghost" aria-label={`Remover ${b.word}`}>
                            <X className="h-4 w-4" />
                          </Button>
                        }
                        title="Remover palavra?"
                        description={
                          <p>
                            A palavra <code className="font-mono">{b.word}</code> deixará de bloquear novos comentários.
                          </p>
                        }
                        onConfirm={() => removeWord.mutate({ id: b.id, word: b.word })}
                      />
                    </td>
                  </tr>
                ))}
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
            label="palavras"
          />
        </>
      )}
    </section>
  );
}
