import { useEffect } from "react";
import { useAuth } from "@/features/auth/use-auth";
import { ensureSubscriptionIfPermitted } from "@/features/notifications/push";
import { supabase } from "@/integrations/supabase/client";

/**
 * Quando o usuário já permitiu push em algum momento, garantimos que a
 * inscrição esteja salva no banco para este dispositivo. Sem UI.
 *
 * Importante: NÃO registra nada enquanto a sessão ainda está em AAL1
 * (2FA pendente). Caso contrário, o aparelho que está tentando logar
 * seria salvo como "dispositivo confiável" antes da verificação.
 */
export function PushBootstrap() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (cancelled) return;
        // Se 2FA está pendente, não toca em push neste aparelho.
        if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") return;
      } catch {
        return;
      }
      if (cancelled) return;
      ensureSubscriptionIfPermitted();
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);
  return null;
}
