// Service worker do Tem na minha cidade
// Responsável apenas por receber push notifications. Sem cache de app shell —
// a evolução do site fica a cargo do próprio browser (cache HTTP + Vite).

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Faxina de caches antigos deixados pelo service worker anterior
      // (v1/v2 do app-shell). Cache Storage é escopado à origem — só apaga
      // o que este worker criou.
      try {
        const names = await caches.keys();
        await Promise.all(
          names
            .filter((n) => n.startsWith("tem-em-pa-") || n.startsWith("tnmc-"))
            .map((n) => caches.delete(n)),
        );
      } catch {
        /* ignore */
      }
      await self.clients.claim();
    })(),
  );
});

// ============== PUSH ==============
self.addEventListener("push", (event) => {
  let payload = {
    title: "Tem na minha cidade",
    body: "Você tem uma nova notificação",
    link: "/notificacoes",
  };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      try {
        payload.body = event.data.text() || payload.body;
      } catch {
        /* ignore */
      }
    }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/favicon.png",
      badge: "/favicon.png",
      tag: payload.tag || undefined,
      data: { link: payload.link || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of all) {
        try {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(link);
            } catch {
              /* ignore */
            }
          }
          return;
        } catch {
          /* ignore */
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(link);
      }
    })(),
  );
});
