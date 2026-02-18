import type { PipelineContext } from "../events.ts";

export async function mediaHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  return ctx;
}
