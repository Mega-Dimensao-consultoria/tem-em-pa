import { VAPID_PUBLIC_KEY } from "@/lib/push-config";
import {
  savePushSubscription,
  deletePushSubscription,
} from "@/lib/push.functions";

const PREVIEW_HOST_SUFFIXES = [
  "lovableproject.com",
  "lovableproject-dev.com",
  "beta.lovable.dev",
];

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** True when we should actually register a service worker on this host. */
export function canRegisterHere(): boolean {
  if (typeof window === "undefined") return false;
  if (!import.meta.env.PROD) return false;
  if (window.self !== window.top) return false;
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) {
    return false;
  }
  if (
    PREVIEW_HOST_SUFFIXES.some((h) => host === h || host.endsWith("." + h))
  ) {
    return false;
  }
  if (new URLSearchParams(window.location.search).get("sw") === "off") {
    return false;
  }
  return true;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function unregisterStaleWorkers() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) {
      const url = r.active?.scriptURL || r.installing?.scriptURL || "";
      if (url.endsWith("/sw.js")) {
        await r.unregister();
      }
    }
  } catch {
    /* ignore */
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  if (!canRegisterHere()) {
    await unregisterStaleWorkers();
    return null;
  }
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "preview" | "no-sw" | "invalid-sub" | NotificationPermission };

export async function subscribePush(): Promise<SubscribeResult> {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };
  if (!canRegisterHere()) return { ok: false, reason: "preview" };
  const reg = await registerServiceWorker();
  if (!reg) return { ok: false, reason: "no-sw" };

  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: perm };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key.buffer.slice(
        key.byteOffset,
        key.byteOffset + key.byteLength,
      ) as ArrayBuffer,
    });
  }
  const json = sub.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!sub.endpoint || !p256dh || !auth) {
    return { ok: false, reason: "invalid-sub" };
  }

  await savePushSubscription({
    data: {
      endpoint: sub.endpoint,
      p256dh,
      auth,
      userAgent: navigator.userAgent,
    },
  });
  return { ok: true };
}

export async function unsubscribePush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    try {
      await deletePushSubscription({ data: { endpoint: sub.endpoint } });
    } catch {
      /* ignore */
    }
    try {
      await sub.unsubscribe();
    } catch {
      /* ignore */
    }
  }
}

export async function isSubscribedHere(): Promise<boolean> {
  if (!pushSupported() || !canRegisterHere()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

/**
 * Silenciosamente garante a inscrição quando o usuário já tinha permitido
 * notificações antes (em outra sessão / dispositivo / após login).
 */
export async function ensureSubscriptionIfPermitted(): Promise<void> {
  if (!pushSupported() || !canRegisterHere()) return;
  if (Notification.permission !== "granted") return;
  try {
    await subscribePush();
  } catch {
    /* silencioso */
  }
}
