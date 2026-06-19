import { useEffect, useRef, useState } from "react";

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

// Minimal structural typing for the Google Maps JS API we use.
type GMaps = {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => unknown;
    Marker: new (opts: { position: { lat: number; lng: number }; map: unknown; title?: string }) => {
      addListener: (event: string, cb: () => void) => void;
    };
    InfoWindow: new (opts: { content: string }) => {
      open: (opts: { map: unknown; anchor: unknown }) => void;
    };
  };
};
type WindowWithMaps = Window & { google?: GMaps; __lovableInitMap?: () => void };

let loaderPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  const w = window as WindowWithMaps;
  if (w.google?.maps?.Map) return Promise.resolve();
  if (loaderPromise) return loaderPromise;
  if (!BROWSER_KEY) return Promise.reject(new Error("Missing Google Maps browser key"));

  loaderPromise = new Promise<void>((resolve, reject) => {
    w.__lovableInitMap = () => resolve();
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      loading: "async",
      callback: "__lovableInitMap",
      language: "pt-BR",
      region: "BR",
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return loaderPromise;
}

export function CompanyMap({
  lat,
  lng,
  name,
  address,
  height = "h-72",
}: {
  lat: number | null;
  lng: number | null;
  name: string;
  address?: string;
  height?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat == null || lng == null || !ref.current) return;
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !ref.current) return;
        const g = (window as any).google;
        const center = { lat, lng };
        const map = new g.maps.Map(ref.current, {
          center,
          zoom: 16,
          disableDefaultUI: false,
          mapTypeControl: false,
          streetViewControl: false,
        });
        const marker = new g.maps.Marker({ position: center, map, title: name });
        const info = new g.maps.InfoWindow({
          content: `<div style="font-family:sans-serif;font-size:13px;font-weight:600">${name}</div>${address ? `<div style="font-family:sans-serif;font-size:12px;color:#555">${address}</div>` : ""}`,
        });
        marker.addListener("click", () => info.open({ map, anchor: marker }));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro no mapa"));
    return () => {
      cancelled = true;
    };
  }, [lat, lng, name, address]);

  if (lat == null || lng == null) {
    return (
      <div className={`${height} w-full bg-muted flex items-center justify-center text-sm text-muted-foreground`}>
        Localização não disponível
      </div>
    );
  }
  if (error) {
    return (
      <div className={`${height} w-full bg-muted flex items-center justify-center text-xs text-destructive`}>
        {error}
      </div>
    );
  }
  return <div ref={ref} className={`${height} w-full`} />;
}
