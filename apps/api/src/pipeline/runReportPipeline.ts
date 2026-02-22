import { bus } from "./bus.ts";
import { PipelineEvents, type PipelineContext } from "./events.ts";

import { validateHandler } from "./handlers/validate.ts";
import { mediaHandler } from "./handlers/media.ts";
import { locationHandler } from "./handlers/location.ts";
import { districtAssignHandler } from "./handlers/districtAssign.ts";
import { landmarkPlacesHandler } from "./handlers/landmarkPlaces.ts";
import { aiModerateHandler } from "./handlers/aiModerate.ts";
import { decisionHandler } from "./handlers/decision.ts";
import { publishHandler } from "./handlers/publish.ts";
import { errorStatusHandler } from "./handlers/errorStatus.ts";

export async function runReportPipeline(
  initialCtx: PipelineContext,
): Promise<PipelineContext> {
  let ctx: PipelineContext = initialCtx;

  try {
    bus.emit(PipelineEvents.SUBMITTED, ctx);

    ctx = await validateHandler(ctx);
    ctx = await mediaHandler(ctx);
    ctx = await locationHandler(ctx);
    ctx = await districtAssignHandler(ctx);
    ctx = await landmarkPlacesHandler(ctx);
    ctx = await aiModerateHandler(ctx);

    ctx = await decisionHandler(ctx);

    if (ctx.aiDecision === "approved") {
      ctx = await publishHandler(ctx);
    }

    return ctx;
  } catch (err) {
    ctx = {
      ...ctx,
      error: err instanceof Error ? err : new Error("Unknown pipeline error"),
    };

    bus.emit(PipelineEvents.ERROR, ctx);
    await errorStatusHandler(ctx);
    return ctx;
  }
}
