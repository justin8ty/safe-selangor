import type { PipelineContext } from "../events.ts";

import { supabase } from "../../services/supabase.ts";
import { getNearestLandmarkLabel } from "../../services/places.ts";
import { mergeDescriptionParts } from "../../services/text.ts";

export async function landmarkPlacesHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  const lat = ctx.lat;
  const lng = ctx.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return ctx;

  const landmarkLabel = await getNearestLandmarkLabel({ lat, lng });
  if (!landmarkLabel) return ctx;

  const { data: report, error: selErr } = await supabase
    .from("reports")
    .select("description")
    .eq("id", ctx.reportId)
    .maybeSingle();

  if (selErr) return ctx;

  const merged = mergeDescriptionParts(
    report?.description as string | null,
    `near ${landmarkLabel}`,
  );

  const { error: updErr } = await supabase
    .from("reports")
    .update({ landmark_label: landmarkLabel, description: merged })
    .eq("id", ctx.reportId);

  if (updErr) return ctx;

  return { ...ctx, landmarkLabel };
}
