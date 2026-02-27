import type { PipelineContext } from "../events.ts";

import { supabase } from "../../services/supabase.ts";

export async function locationHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  if (typeof ctx.lat === "number" && typeof ctx.lng === "number") {
    return ctx;
  }

  const { data, error } = await supabase
    .from("report_location_private")
    .select("lat,lng")
    .eq("report_id", ctx.reportId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Missing private report location");

  return { ...ctx, lat: data.lat as number, lng: data.lng as number };
}
