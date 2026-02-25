import type { PipelineContext } from "../events.ts";

import { bus } from "../bus.ts";
import { PipelineEvents } from "../events.ts";
import { supabase } from "../../services/supabase.ts";
import { io } from "../../sockets/index.ts";

export async function decisionHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  const decision = ctx.aiDecision ?? "needs_moderator";

  if (decision === "needs_moderator") {
    const { error: reportErr } = await supabase
      .from("reports")
      .update({ status: "needs_moderator" })
      .eq("id", ctx.reportId);

    if (reportErr) throw reportErr;

    const { error: queueErr } = await supabase.from("moderation_queue").upsert({
      report_id: ctx.reportId,
      status: "open",
    });

    if (queueErr) throw queueErr;

    bus.emit(PipelineEvents.NEEDS_MODERATOR, { ...ctx, aiDecision: decision });

    io
      ?.of("/moderation")
      .to("moderation")
      .emit("moderation:queue_updated", { reportId: ctx.reportId });
    return { ...ctx, aiDecision: decision };
  }

  if (decision === "rejected") {
    const { error } = await supabase
      .from("reports")
      .update({ status: "rejected" })
      .eq("id", ctx.reportId);
    if (error) throw error;

    bus.emit(PipelineEvents.REJECTED, { ...ctx, aiDecision: decision });
    return { ...ctx, aiDecision: decision };
  }

  const { error } = await supabase
    .from("reports")
    .update({ status: "approved" })
    .eq("id", ctx.reportId);
  if (error) throw error;

  // Resolve any open moderation entry if auto-approved.
  const { error: queueErr } = await supabase
    .from("moderation_queue")
    .update({ status: "resolved" })
    .eq("report_id", ctx.reportId);
  if (queueErr) {
    // Non-fatal; report is already approved.
  }

  bus.emit(PipelineEvents.APPROVED, { ...ctx, aiDecision: decision });
  return { ...ctx, aiDecision: decision };
}
