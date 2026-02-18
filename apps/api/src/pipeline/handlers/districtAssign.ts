import type { PipelineContext } from "../events.ts";

export async function districtAssignHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  return ctx;
}
