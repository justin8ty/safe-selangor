import type { PipelineContext } from "../events.ts";

import { bus } from "../bus.ts";
import { PipelineEvents } from "../events.ts";
import { io } from "../../sockets/index.ts";
import { getReportCard } from "../../services/feed.ts";

export async function publishHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  const feedItem = await getReportCard(ctx.reportId);
  if (feedItem) {
    io?.of("/feed").to("feed").emit("feed:new_report", feedItem);
  }

  bus.emit(PipelineEvents.PUBLISHED, ctx);
  return ctx;
}
