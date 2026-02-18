import type { PipelineContext } from "../events.ts";

export async function aiModerateHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  return ctx;
}
