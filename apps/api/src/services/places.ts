import { env } from "../config/env.ts";

type PlacesNearbyResponse = {
  results?: Array<{ name?: string; vicinity?: string }>;
  status?: string;
  error_message?: string;
};

export async function getNearestLandmarkLabel(input: {
  lat: number;
  lng: number;
  timeoutMs?: number;
}): Promise<string | null> {
  if (!env.GOOGLE_PLACES_API_KEY || !env.GOOGLE_PLACES_API_KEY.trim().length) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 5000);

  try {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
    );
    url.searchParams.set("key", env.GOOGLE_PLACES_API_KEY);
    url.searchParams.set("location", `${input.lat},${input.lng}`);
    url.searchParams.set("radius", "200");
    url.searchParams.set("language", "en");

    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) return null;

    const json = (await res.json()) as PlacesNearbyResponse;
    const first = json.results?.[0];
    const name = typeof first?.name === "string" ? first.name.trim() : "";
    const vicinity =
      typeof first?.vicinity === "string" ? first.vicinity.trim() : "";

    if (!name) return null;
    return vicinity ? `${name}, ${vicinity}` : name;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
