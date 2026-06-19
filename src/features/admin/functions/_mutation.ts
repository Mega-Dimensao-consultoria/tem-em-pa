import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/use-auth";
import { logAdminAction } from "./audit";
import { adminKeys } from "./keys";

/** Invalidate every admin query at once (used after broad mutations). */
export function useInvalidateAdmin() {
  const qc = useQueryClient();
  return (extra: readonly (readonly unknown[])[] = []) => {
    qc.invalidateQueries({ queryKey: adminKeys.all });
    extra.forEach((k) => qc.invalidateQueries({ queryKey: k }));
  };
}

type AdminMutationOptions<TVars, TData> = {
  mutationFn: (vars: TVars) => Promise<TData>;
  /** Returns an audit-log entry for the mutation. Skipped when null. */
  audit?: (vars: TVars, data: TData) => {
    action: string;
    entityType: string;
    entityId?: string | null;
    details?: Record<string, unknown> | null;
  } | null;
  successMessage?: string | ((vars: TVars, data: TData) => string);
  invalidate?: readonly (readonly unknown[])[];
};

/**
 * Wraps a Supabase mutation with consistent toast + audit log + cache
 * invalidation, so each admin domain only declares the SQL.
 */
export function useAdminMutation<TVars, TData = unknown>(
  opts: AdminMutationOptions<TVars, TData>,
) {
  const { user } = useAuth();
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: opts.mutationFn,
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Falha na ação");
    },
    onSuccess: async (data, vars) => {
      const entry = opts.audit?.(vars, data) ?? null;
      if (entry && user) {
        await logAdminAction(
          user.id,
          entry.action,
          entry.entityType,
          entry.entityId ?? null,
          entry.details ?? undefined,
        );
      }
      const msg =
        typeof opts.successMessage === "function"
          ? opts.successMessage(vars, data)
          : opts.successMessage;
      if (msg) toast.success(msg);
      invalidate(opts.invalidate);
    },
  });
}
