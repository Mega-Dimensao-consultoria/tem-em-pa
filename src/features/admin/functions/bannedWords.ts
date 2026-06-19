import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminKeys } from "./keys";
import { useAdminMutation } from "./_mutation";

export type BannedWord = { id: string; word: string };

export function useBannedWords() {
  return useQuery({
    queryKey: adminKeys.bannedWords(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banned_words")
        .select("id, word")
        .order("word");
      if (error) throw error;
      return data as BannedWord[];
    },
  });
}

export function useAddBannedWord() {
  return useAdminMutation<{ word: string }, { id: string; word: string }>({
    mutationFn: async ({ word }) => {
      const w = word.trim().toLowerCase();
      if (w.length < 2) throw new Error("Palavra muito curta.");
      const { data, error } = await supabase
        .from("banned_words")
        .insert({ word: w })
        .select("id")
        .single();
      if (error) throw error;
      return { id: data.id, word: w };
    },
    audit: (_v, data) => ({
      action: "banned_word.add",
      entityType: "banned_word",
      entityId: data.id,
      details: { word: data.word },
    }),
    successMessage: "Palavra adicionada",
  });
}

export function useRemoveBannedWord() {
  return useAdminMutation<{ id: string; word: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase
        .from("banned_words")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    audit: ({ id, word }) => ({
      action: "banned_word.remove",
      entityType: "banned_word",
      entityId: id,
      details: { word },
    }),
    successMessage: "Palavra removida",
  });
}
