import { createFileRoute } from "@tanstack/react-router";
import { buildPushPayload } from "@block65/webcrypto-web-push";
import { VAPID_PUBLIC_KEY } from "@/lib/push-config";

export const Route = createFileRoute("/api/public/push/dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = request.headers.get("x-dispatch-secret");
        const expected = process.env.PUSH_DISPATCH_SECRET;
        if (!secret || !expected || secret !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: { notification_id?: string } | null = null;
        try {
          body = (await request.json()) as { notification_id?: string };
        } catch {
          return new Response("Bad Request", { status: 400 });
        }
        const notificationId = body?.notification_id;
        if (!notificationId || typeof notificationId !== "string") {
          return new Response("Bad Request", { status: 400 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const { data: notif, error: notifErr } = await supabaseAdmin
          .from("notifications")
          .select("id, user_id, title, message, link")
          .eq("id", notificationId)
          .maybeSingle();
        if (notifErr || !notif) {
          return Response.json({ sent: 0, reason: "not-found" });
        }

        const { data: subs } = await supabaseAdmin
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", notif.user_id);
        if (!subs || subs.length === 0) {
          return Response.json({ sent: 0, total: 0 });
        }

        const vapid = {
          subject: process.env.VAPID_SUBJECT ?? "mailto:contato@temnaminhacidade.com.br",
          publicKey: VAPID_PUBLIC_KEY,
          privateKey: process.env.VAPID_PRIVATE_KEY,
        };

        const payloadData = {
          title: notif.title,
          body: notif.message,
          link: notif.link ?? "/notificacoes",
          tag: notif.id,
        };

        const results = await Promise.allSettled(
          subs.map(async (s) => {
            const subscription = {
              endpoint: s.endpoint,
              expirationTime: null,
              keys: { p256dh: s.p256dh, auth: s.auth },
            };
            const payload = await buildPushPayload(
              { data: payloadData, options: { ttl: 60 * 60 * 24 } },
              subscription,
              vapid,
            );
            const res = await fetch(s.endpoint, {
              method: payload.method,
              headers: payload.headers,
              body: new Uint8Array(payload.body) as BodyInit,
            });
            if (res.status === 404 || res.status === 410) {
              await supabaseAdmin
                .from("push_subscriptions")
                .delete()
                .eq("endpoint", s.endpoint);
              throw new Error(`gone:${res.status}`);
            }
            if (!res.ok) {
              const text = await res.text().catch(() => "");
              throw new Error(`push-failed:${res.status}:${text.slice(0, 200)}`);
            }
            return "sent";
          }),
        );

        const sent = results.filter((r) => r.status === "fulfilled").length;
        const errors = results
          .filter((r): r is PromiseRejectedResult => r.status === "rejected")
          .map((r) => (r.reason instanceof Error ? r.reason.message : String(r.reason)));
        return Response.json({ sent, total: subs.length, errors });
      },
    },
  },
});
