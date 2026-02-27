import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { readFile } from "node:fs/promises";

import { supabase } from "./supabase.ts";

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties?: Record<string, unknown>;
    geometry:
      | { type: "Polygon"; coordinates: number[][][] }
      | { type: "MultiPolygon"; coordinates: number[][][][] };
  }>;
};

type DistrictMatch = {
  district: string;
  state: string | null;
};

const stateByDistrict = new Map<string, string | null>();

async function tryGetStateByColumn(
  column: "district" | "name",
  district: string,
): Promise<string | null | undefined> {
  const { data, error } = await supabase
    .from("districts")
    .select("state")
    .eq(column, district)
    .maybeSingle();

  if (error) {
    // If the schema uses a different column name, try the alternative.
    if (typeof error.message === "string" && error.message.includes("column")) {
      return undefined;
    }
    return null;
  }

  const state = (data as any)?.state;
  return typeof state === "string" && state.trim().length ? state.trim() : null;
}

export async function getStateForDistrict(
  district: string,
): Promise<string | null> {
  const key = district.trim();
  if (!key) return null;

  if (stateByDistrict.has(key)) return stateByDistrict.get(key) ?? null;

  // Common schemas: districts(district,state) or districts(name,state)
  let state = await tryGetStateByColumn("district", key);
  if (typeof state === "undefined") {
    state = await tryGetStateByColumn("name", key);
  }

  const normalized = typeof state === "string" ? state : null;
  stateByDistrict.set(key, normalized);
  return normalized;
}

let cached: GeoJsonFeatureCollection | null = null;

async function loadDistrictGeojson(): Promise<GeoJsonFeatureCollection> {
  if (cached) return cached;

  // Source-of-truth polygons currently live in the web app public folder.
  const url = new URL("../../../web/public/map.geojson", import.meta.url);
  const raw = await readFile(url, "utf8");
  cached = JSON.parse(raw) as GeoJsonFeatureCollection;
  return cached;
}

function toPointFeature(lat: number, lng: number) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Point" as const,
      coordinates: [lng, lat] as [number, number],
    },
  };
}

function getName(
  feature: GeoJsonFeatureCollection["features"][number],
): string | null {
  const name = feature.properties?.name;
  return typeof name === "string" && name.trim().length ? name.trim() : null;
}

function roughCentroid(
  feature: GeoJsonFeatureCollection["features"][number],
): [number, number] | null {
  const geom = feature.geometry;
  const ring =
    geom.type === "Polygon"
      ? geom.coordinates?.[0]
      : geom.coordinates?.[0]?.[0];

  if (!ring || !Array.isArray(ring) || ring.length < 3) return null;

  let sumLng = 0;
  let sumLat = 0;
  let n = 0;

  for (const coord of ring) {
    if (!Array.isArray(coord) || coord.length < 2) continue;
    const [lng, lat] = coord;
    if (typeof lng !== "number" || typeof lat !== "number") continue;
    sumLng += lng;
    sumLat += lat;
    n += 1;
  }

  if (!n) return null;
  return [sumLng / n, sumLat / n];
}

function haversineMeters(a: [number, number], b: [number, number]): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const x = s1 * s1 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * s2 * s2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

export async function matchDistrictFromLatLng(input: {
  lat: number;
  lng: number;
}): Promise<DistrictMatch | null> {
  const geojson = await loadDistrictGeojson();
  const point = toPointFeature(input.lat, input.lng);

  // 1) Strict point-in-polygon first.
  for (const feature of geojson.features) {
    const name = getName(feature);
    if (!name) continue;
    try {
      const ok = booleanPointInPolygon(point as any, feature as any);
      if (ok) {
        const state = await getStateForDistrict(name);
        return { district: name, state };
      }
    } catch {
      // Ignore malformed polygons.
    }
  }

  // 2) Fallback: nearest rough centroid.
  let best: { name: string; dist: number } | null = null;
  const p: [number, number] = [input.lng, input.lat];

  for (const feature of geojson.features) {
    const name = getName(feature);
    if (!name) continue;
    const c = roughCentroid(feature);
    if (!c) continue;
    const dist = haversineMeters(p, c);
    if (!best || dist < best.dist) best = { name, dist };
  }

  if (!best) return null;
  const state = await getStateForDistrict(best.name);
  return { district: best.name, state };
}

export async function listDistrictNames(): Promise<string[]> {
  const geojson = await loadDistrictGeojson();
  const names = geojson.features.map(getName).filter((n): n is string => !!n);
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
}
