import type { PipelineContext } from "../events.ts";

export async function validateHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  return ctx;
}
