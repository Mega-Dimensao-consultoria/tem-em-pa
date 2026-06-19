import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/use-auth";

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export const notificationsKey = (userId: string | undefined, limit: number) =>
  ["notifications", userId ?? "anon", limit] as const;

/**
 * Fetch notifications for the current user and keep them fresh via realtime
 * + a 60s poll fallback. Returns the list plus mutation helpers.
 */
export function useNotifications(limit = 15) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = notificationsKey(user?.id, limit);

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,type,title,message,link,read_at,created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif:${user.id}:${limit}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe();
    const interval = setInterval(
      () => qc.invalidateQueries({ queryKey: key }),
      60_000,
    );
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, limit]);

  const items = query.data ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  const markOne = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null)
        .eq("user_id", user.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const toggleRead = useMutation({
    mutationFn: async (n: Notification) => {
      await supabase
        .from("notifications")
        .update({ read_at: n.read_at ? null : new Date().toISOString() })
        .eq("id", n.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return {
    items,
    unread,
    isLoading: query.isLoading,
    markOne: (id: string) => markOne.mutate(id),
    markAll: () => markAll.mutate(),
    toggleRead: (n: Notification) => toggleRead.mutate(n),
    remove: (id: string) => remove.mutate(id),
  };
}
