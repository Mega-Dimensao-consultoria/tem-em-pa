// Service worker do Tem na cidade
// 1) Recebe push notifications
// 2) Cache offline do app shell (NetworkFirst para navegação, CacheFirst para assets versionados)

const VERSION = "v2";
const RUNTIME_CACHE = `tem-em-pa-runtime-${VERSION}`;
const ASSETS_CACHE = `tem-em-pa-assets-${VERSION}`;
// NOTE: cache key prefix "tem-em-pa-" mantido de propósito — trocar hoje deixaria
// caches antigos órfãos nos navegadores dos usuários instalados.
const OFFLINE_URL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
      } catch {
        /* ignore */
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // limpa caches antigos deste worker
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (n) =>
              n.startsWith("tem-em-pa-") &&
              n !== RUNTIME_CACHE &&
              n !== ASSETS_CACHE,
          )
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

function isHashedAsset(url) {
  // Vite gera nomes hashados em /assets/*.[hash].[ext]
  return (
    url.pathname.startsWith("/assets/") &&
    /\.[a-f0-9]{6,}\.[a-z0-9]+$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // nunca cachear rotas dinâmicas / de sessão / API
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_serverFn") ||
    url.pathname.startsWith("/~oauth") ||
    url.pathname === "/sitemap.xml" ||
    url.pathname === "/robots.txt" ||
    url.pathname === "/sw.js" ||
    url.pathname === "/manifest.webmanifest"
  ) {
    return;
  }

  // Navegação HTML: NetworkFirst com fallback offline
  const isNavigation =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isNavigation) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(RUNTIME_CACHE);
          try {
            cache.put(OFFLINE_URL, fresh.clone());
          } catch {
            /* ignore */
          }
          return fresh;
        } catch {
          const cache = await caches.open(RUNTIME_CACHE);
          const cached =
            (await cache.match(req)) || (await cache.match(OFFLINE_URL));
          if (cached) return cached;
          return new Response(
            "<h1>Você está offline</h1><p>Reconecte para continuar.</p>",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
          );
        }
      })(),
    );
    return;
  }

  // Assets hashados do Vite: CacheFirst
  if (isHashedAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSETS_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          if (fresh.ok) cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

  // Ícones / favicon / manifest icons: StaleWhileRevalidate
  if (
    url.pathname === "/favicon.png" ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSETS_CACHE);
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached || Response.error());
        return cached || fetchPromise;
      })(),
    );
  }
});

// ============== PUSH ==============
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
