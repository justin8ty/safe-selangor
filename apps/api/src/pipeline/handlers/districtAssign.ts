import type { PipelineContext } from "../events.ts";

import { supabase } from "../../services/supabase.ts";
import { matchDistrictFromLatLng } from "../../services/districts.ts";

export async function districtAssignHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  // Respect any district already chosen/persisted.
  const { data: existing, error: selErr } = await supabase
    .from("reports")
    .select("district,state")
    .eq("id", ctx.reportId)
    .maybeSingle();

  if (!selErr && existing) {
    const district = (existing.district ?? null) as string | null;
    const state = (existing.state ?? null) as string | null;
    if (district && district.trim().length) {
      return { ...ctx, district, state: state ?? ctx.state };
    }
  }

  const lat = ctx.lat;
  const lng = ctx.lng;
  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new Error("Missing location for district assignment");
  }

  const match = await matchDistrictFromLatLng({ lat, lng });
  if (!match) {
    return ctx;
  }

  const update: Record<string, unknown> = { district: match.district };
  if (match.state) update.state = match.state;

  const { error } = await supabase
    .from("reports")
    .update(update)
    .eq("id", ctx.reportId);

  if (error) throw error;

  return {
    ...ctx,
    district: match.district,
    ...(match.state ? { state: match.state } : {}),
  };
}
