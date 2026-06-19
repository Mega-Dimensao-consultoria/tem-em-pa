import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { logAdminAction } from "@/lib/admin-audit";
import { Empty, Loading } from "../admin-ui";

export function BannedWordsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["admin", "banned-words"];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("banned_words").select("id, word").order("word");
      if (error) throw error;
      return data;
    },
  });
  const [word, setWord] = useState("");

  async function add() {
    const w = word.trim().toLowerCase();
    if (w.length < 2) {
      toast.error("Palavra muito curta.");
      return;
    }
    const { data: ins, error } = await supabase
      .from("banned_words")
      .insert({ word: w })
      .select("id")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user) await logAdminAction(user.id, "banned_word.add", "banned_word", ins.id, { word: w });
    setWord("");
    toast.success("Palavra adicionada");
    qc.invalidateQueries({ queryKey: key });
  }

  async function remove(id: string, w: string) {
    const { error } = await supabase.from("banned_words").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user) await logAdminAction(user.id, "banned_word.remove", "banned_word", id, { word: w });
    toast.success("Palavra removida");
    qc.invalidateQueries({ queryKey: key });
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-2">
        <Input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Nova palavra…"
          maxLength={40}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button onClick={add}>
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
                onConfirm={() => remove(b.id, b.word)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
