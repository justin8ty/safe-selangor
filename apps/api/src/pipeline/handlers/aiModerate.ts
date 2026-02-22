import type { PipelineContext } from "../events.ts";

import { bus } from "../bus.ts";
import { PipelineEvents } from "../events.ts";
import { env } from "../../config/env.ts";
import { supabase } from "../../services/supabase.ts";
import { moderateCrimeSceneWithGemini } from "../../services/gemini.ts";

function inferMimeTypeFromKey(
  storageKey: string,
): "image/jpeg" | "image/png" | "image/webp" | null {
  const lower = storageKey.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return null;
}

export async function aiModerateHandler(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  const key = ctx.storageKeys?.[0];
  if (!key) return { ...ctx, aiDecision: "needs_moderator", aiConfidence: 0 };

  const mimeType = inferMimeTypeFromKey(key);
  if (!mimeType) {
    const explanation = "Unsupported image type for AI moderation";
    await supabase
      .from("reports")
      .update({ ai_confidence: 0, ai_explanation: explanation })
      .eq("id", ctx.reportId);
    return { ...ctx, aiDecision: "needs_moderator", aiConfidence: 0, aiExplanation: explanation };
  }

  try {
    const { data: report, error: reportErr } = await supabase
      .from("reports")
      .select("category,type,description,state,district")
      .eq("id", ctx.reportId)
      .maybeSingle();

    if (reportErr) throw reportErr;

    const { data: blob, error: dlErr } = await supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .download(key);

    if (dlErr || !blob) throw dlErr ?? new Error("Failed to download image");

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const imageBase64 = Buffer.from(bytes).toString("base64");

    const contextText = [
      report?.state ? `state=${report.state}` : null,
      report?.district ? `district=${report.district}` : null,
      report?.category ? `category=${report.category}` : null,
      report?.type ? `type=${report.type}` : null,
      report?.description ? `description=${report.description}` : null,
    ]
      .filter(Boolean)
      .join("; ");

    const result = await moderateCrimeSceneWithGemini({
      mimeType,
      imageBase64,
      contextText,
      timeoutMs: 15000,
    });

    const aiDecision = result.confidence >= 90 ? "approved" : "needs_moderator";

    const nextCtx: PipelineContext = {
      ...ctx,
      aiConfidence: result.confidence,
      aiExplanation: result.explanation,
      aiDecision,
    };

    const { error: updErr } = await supabase
      .from("reports")
      .update({ ai_confidence: result.confidence, ai_explanation: result.explanation })
      .eq("id", ctx.reportId);

    if (updErr) throw updErr;

    bus.emit(PipelineEvents.MODERATED, nextCtx);
    return nextCtx;
  } catch (err) {
    const explanation =
      err instanceof Error ? err.message : "Gemini moderation failed";
    await supabase
      .from("reports")
      .update({ ai_confidence: 0, ai_explanation: explanation })
      .eq("id", ctx.reportId);

    const nextCtx: PipelineContext = {
      ...ctx,
      aiConfidence: 0,
      aiExplanation: explanation,
      aiDecision: "needs_moderator",
    };

    bus.emit(PipelineEvents.MODERATED, nextCtx);
    return nextCtx;
  }
}
