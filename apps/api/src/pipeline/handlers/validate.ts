import type { PipelineContext } from "../events.ts";

export async function validateHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  if (!ctx.reportId || !ctx.userId) {
    throw new Error("Missing reportId/userId");
  }

  // Location and media are validated by their respective steps or DB state.

  return ctx;
}
