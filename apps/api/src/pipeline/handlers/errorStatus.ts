import type { PipelineContext } from "../events.ts";

export async function errorStatusHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  if (ctx.error) {
    console.error(`Pipeline error for report ${ctx.reportId}:`, ctx.error);
  }
  return ctx;
}
