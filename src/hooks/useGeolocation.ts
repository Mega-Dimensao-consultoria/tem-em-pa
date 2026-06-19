import { useState } from "react";
import { toast } from "sonner";

export type GeoCoords = { lat: number; lng: number };

export function useGeolocation() {
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [loading, setLoading] = useState(false);

  function request(onSuccess?: (c: GeoCoords) => void) {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada neste navegador.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setLoading(false);
        toast.success("Localização obtida.");
        onSuccess?.(c);
      },
      (err) => {
        setLoading(false);
        toast.error(err.message || "Não foi possível obter sua localização.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return { coords, loading, request };
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.sqrt(x));
}
