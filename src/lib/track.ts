import { supabase } from "@/integrations/supabase/client";

type EventType = "view" | "whatsapp_click" | "phone_click" | "website_click" | "maps_click";

const sentViews = new Set<string>();

export async function trackEvent(companyId: string, eventType: EventType) {
  try {
    if (eventType === "view") {
      const k = `tem-em-pa-view:${companyId}`;
      if (sentViews.has(k)) return;
      sentViews.add(k);
      if (typeof sessionStorage !== "undefined") {
        if (sessionStorage.getItem(k)) return;
        sessionStorage.setItem(k, "1");
      }
    }
    await supabase.from("company_events").insert({ company_id: companyId, event_type: eventType });
  } catch {
    // silent — analytics shouldn't break UX
  }
}
