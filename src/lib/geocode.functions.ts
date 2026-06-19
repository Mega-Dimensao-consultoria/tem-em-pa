import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

export const geocodeAddress = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ address: z.string().trim().min(3).max(300) }).parse(input),
  )
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps connector not configured");
    }

    const res = await fetch(
      `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(data.address)}&region=br&language=pt-BR`,
      {
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
        },
      },
    );
    if (!res.ok) {
      throw new Error(`Geocoding failed: HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      status: string;
      results: { geometry: { location: { lat: number; lng: number } }; formatted_address: string }[];
    };
    if (json.status !== "OK" || !json.results.length) {
      return { lat: null, lng: null, formatted: null };
    }
    const r = json.results[0];
    return {
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      formatted: r.formatted_address,
    };
  });
