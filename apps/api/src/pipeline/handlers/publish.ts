import type { PipelineContext } from "../events.ts";

export async function publishHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  return ctx;
}
