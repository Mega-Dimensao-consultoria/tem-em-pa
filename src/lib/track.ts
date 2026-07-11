import { supabase } from "@/integrations/supabase/client";

type EventType = "view" | "whatsapp_click" | "phone_click" | "website_click" | "maps_click";
type Source = "direct" | "search" | "social" | "internal" | "other";

const sentViews = new Set<string>();

function classifySource(): Source {
  if (typeof document === "undefined" || typeof window === "undefined") return "direct";
  const ref = document.referrer;
  if (!ref) return "direct";
  try {
    const url = new URL(ref);
    const host = url.hostname.toLowerCase();
    if (host === window.location.hostname) return "internal";
    if (/(google|bing|yahoo|duckduckgo|ecosia|baidu|yandex)\./.test(host)) return "search";
    if (/(facebook|instagram|twitter|x\.com|t\.co|linkedin|whatsapp|wa\.me|tiktok|youtube|pinterest|reddit|telegram|threads)\./.test(host)) return "social";
    return "other";
  } catch {
    return "other";
  }
}

export async function trackEvent(companyId: string, eventType: EventType) {
  try {
    if (eventType === "view") {
      const k = `tnmc-view:${companyId}`;
      if (sentViews.has(k)) return;
      sentViews.add(k);
      if (typeof sessionStorage !== "undefined") {
        if (sessionStorage.getItem(k)) return;
        sessionStorage.setItem(k, "1");
      }
    }
    await supabase.from("company_events").insert({
      company_id: companyId,
      event_type: eventType,
      source: classifySource(),
    });
  } catch {
    // silent — analytics shouldn't break UX
  }
}
