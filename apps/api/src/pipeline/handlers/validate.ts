import type { PipelineContext } from "../events.ts";

export async function validateHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  if (!ctx.reportId || !ctx.userId) {
    throw new Error("Missing reportId/userId");
  }

  if (!ctx.storageKeys?.length) {
    throw new Error("Missing storage keys");
  }

  if (typeof ctx.lat !== "number" || typeof ctx.lng !== "number") {
    throw new Error("Missing location");
  }

  return ctx;
}
