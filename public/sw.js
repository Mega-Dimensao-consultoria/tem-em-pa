// Service worker do Tem em P.A — recebe push notifications e abre o link ao clicar.
// NÃO faz cache offline (mantemos o app sempre online).

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "Tem em P.A",
    body: "Você tem uma nova notificação",
    link: "/notificacoes",
  };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      try {
        payload.body = event.data.text() || payload.body;
      } catch {}
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
            } catch {}
          }
          return;
        } catch {}
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(link);
      }
    })(),
  );
});
