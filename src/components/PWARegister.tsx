import { useEffect } from "react";
import { canRegisterHere, pushSupported } from "@/features/notifications/push";

/**
 * Registra o service worker (/sw.js) para habilitar cache offline (app shell).
 * Reaproveita os mesmos guards do push: nunca registra em preview/dev/iframe
 * ou quando ?sw=off está presente. Roda independente de autenticação.
 */
export function PWARegister() {
  useEffect(() => {
    if (!pushSupported()) return;
    if (!canRegisterHere()) {
      // limpa registros antigos em preview/dev
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) =>
          Promise.all(
            regs
              .filter((r) =>
                (r.active?.scriptURL ||
                  r.installing?.scriptURL ||
                  r.waiting?.scriptURL ||
                  "").endsWith("/sw.js"),
              )
              .map((r) => r.unregister()),
          ),
        )
        .catch(() => {});
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* ignore */
    });
  }, []);
  return null;
}
