import type { PipelineContext } from "../events.ts";

export async function decisionHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  return ctx;
}
