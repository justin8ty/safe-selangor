import type { PipelineContext } from "../events.ts";

export async function locationHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  return ctx;
}
