import type { PipelineContext } from "../events.ts";

import { supabase } from "../../services/supabase.ts";
import { getNearestLandmarkLabel } from "../../services/places.ts";

export async function landmarkPlacesHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  const lat = ctx.lat;
  const lng = ctx.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return ctx;

  const landmarkLabel = await getNearestLandmarkLabel({ lat, lng });
  if (!landmarkLabel) return ctx;

  const { error: updErr } = await supabase
    .from("reports")
    .update({ landmark_label: landmarkLabel })
    .eq("id", ctx.reportId);

  if (updErr) return ctx;

  return { ...ctx, landmarkLabel };
}
