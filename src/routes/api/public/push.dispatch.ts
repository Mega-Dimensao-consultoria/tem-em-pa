import { createFileRoute } from "@tanstack/react-router";
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

        const webpushMod = (await import("web-push")) as unknown as {
          default?: typeof import("web-push");
        } & typeof import("web-push");
        const webpush = webpushMod.default ?? webpushMod;

        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT ?? "mailto:contato@tem-em-pa.app",
          VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY!,
        );

        const payload = JSON.stringify({
          title: notif.title,
          body: notif.message,
          link: notif.link ?? "/notificacoes",
          tag: notif.id,
        });

        const results = await Promise.allSettled(
          subs.map(async (s) => {
            try {
              await webpush.sendNotification(
                {
                  endpoint: s.endpoint,
                  keys: { p256dh: s.p256dh, auth: s.auth },
                },
                payload,
                { TTL: 60 * 60 * 24 },
              );
              return "sent";
            } catch (err: unknown) {
              const status =
                typeof err === "object" && err !== null && "statusCode" in err
                  ? Number((err as { statusCode: unknown }).statusCode)
                  : 0;
              if (status === 404 || status === 410) {
                await supabaseAdmin
                  .from("push_subscriptions")
                  .delete()
                  .eq("endpoint", s.endpoint);
              }
              throw err;
            }
          }),
        );

        const sent = results.filter((r) => r.status === "fulfilled").length;
        return Response.json({ sent, total: subs.length });
      },
    },
  },
});
