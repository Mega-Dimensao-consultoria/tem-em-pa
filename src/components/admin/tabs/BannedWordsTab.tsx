import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import {
  useAddBannedWord,
  useBannedWords,
  useRemoveBannedWord,
} from "@/lib/admin/bannedWords";
import { Empty, Loading } from "../admin-ui";

export function BannedWordsTab() {
  const { data = [], isLoading } = useBannedWords();
  const addWord = useAddBannedWord();
  const removeWord = useRemoveBannedWord();
  const [word, setWord] = useState("");

  function submit() {
    addWord.mutate({ word }, { onSuccess: () => setWord("") });
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-2">
        <Input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Nova palavra…"
          maxLength={40}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <Button onClick={submit}>
          <Plus className="mr-1 h-4 w-4" />
          Adicionar
        </Button>
      </div>
      {isLoading ? (
        <Loading />
      ) : data.length === 0 ? (
        <Empty>Nenhuma palavra cadastrada.</Empty>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {data.map((b) => (
            <li
              key={b.id}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm shadow-soft"
            >
              <span className="font-mono text-xs">{b.word}</span>
              <ConfirmDestructive
                trigger={
                  <button className="text-muted-foreground hover:text-destructive" aria-label="Remover">
                    <X className="h-3 w-3" />
                  </button>
                }
                title="Remover palavra?"
                description={
                  <p>
                    A palavra <code className="font-mono">{b.word}</code> deixará de bloquear novos comentários.
                  </p>
                }
                onConfirm={() => removeWord.mutate({ id: b.id, word: b.word })}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
