import { useCallback } from "react";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/safe";

/**
 * Toast de erro padronizado. Nunca expõe stack/SQL e sempre dá uma mensagem
 * acionável. Use em `mutation.onError` e `try/catch` de event handlers.
 */
export function useErrorToast() {
  return useCallback((error: unknown, prefix?: string) => {
    const message = extractErrorMessage(error);
    const full = prefix ? `${prefix}: ${message}` : message;
    toast.error(full);
  }, []);
}
