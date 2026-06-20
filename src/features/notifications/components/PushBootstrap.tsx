import { useEffect } from "react";
import { useAuth } from "@/features/auth/use-auth";
import { ensureSubscriptionIfPermitted } from "@/features/notifications/push";

/**
 * Quando o usuário já permitiu push em algum momento, garantimos que a
 * inscrição esteja salva no banco para este dispositivo. Sem UI.
 */
export function PushBootstrap() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    ensureSubscriptionIfPermitted();
  }, [user]);
  return null;
}
