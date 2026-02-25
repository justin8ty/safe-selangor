import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { requireAuth } from "../auth/requireAuth.ts";
import { supabase } from "../services/supabase.ts";
import { runReportPipeline } from "../pipeline/runReportPipeline.ts";
import { listDistrictNames, matchDistrictFromLatLng } from "../services/districts.ts";
import { mergeDescriptionParts } from "../services/text.ts";

const createDraftBodySchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const submitBodySchema = z.object({
  reportId: z.string().min(1),
  type: z.enum(["violent", "property"]),
  district: z.string().min(1),
  storageKeys: z.array(z.string().min(1)).min(1),
  details: z.string().optional(),
});

export async function reportsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/districts", { preHandler: requireAuth }, async (_req, reply) => {
    const names = await listDistrictNames();
    return reply.send({ districts: names });
  });

  // 1) Draft report: persist precise location, compute district.
  app.post("/reports/draft", { preHandler: requireAuth }, async (req, reply) => {
    const parsed = createDraftBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
    }

    const userId = req.authUser?.userId;
    if (!userId) return reply.status(401).send({ error: "Unauthorized" });

    const match = await matchDistrictFromLatLng({
      lat: parsed.data.lat,
      lng: parsed.data.lng,
    });

    const { data: reportRow, error: reportErr } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        type: null,
        state: match?.state ?? null,
        district: match?.district ?? null,
        description: null,
        status: "needs_moderator",
        ai_confidence: 0,
      })
      .select("id,state,district")
      .single();

    if (reportErr || !reportRow) {
      req.log.error({ error: reportErr }, "Failed to create draft report");
      return reply.status(500).send({ error: "Failed to create report" });
    }

    const reportId = reportRow.id as string;

    const { error: locErr } = await supabase
      .from("report_location_private")
      .insert({ report_id: reportId, lat: parsed.data.lat, lng: parsed.data.lng });

    if (locErr) {
      req.log.error({ error: locErr }, "Failed to store private location");
      return reply.status(500).send({ error: "Failed to store location" });
    }

    return reply.status(201).send({
      reportId,
      state: (reportRow.state ?? null) as string | null,
      district: (reportRow.district ?? null) as string | null,
    });
  });

  // 2) Submit: attach type, media, details, enqueue + pipeline.
  app.post("/reports/submit", { preHandler: requireAuth }, async (req, reply) => {
    const parsed = submitBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
    }

    const userId = req.authUser?.userId;
    if (!userId) return reply.status(401).send({ error: "Unauthorized" });

    const { data: report, error: findErr } = await supabase
      .from("reports")
      .select("id,user_id,description")
      .eq("id", parsed.data.reportId)
      .maybeSingle();

    if (findErr) {
      req.log.error({ error: findErr }, "Failed to lookup report");
      return reply.status(500).send({ error: "Failed to lookup report" });
    }
    if (!report) return reply.status(404).send({ error: "Report not found" });
    if ((report.user_id as string) !== userId) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    const mergedDetails = mergeDescriptionParts(
      report.description as string | null,
      parsed.data.details ?? null,
    );

    const { error: updErr } = await supabase
      .from("reports")
      .update({
        type: parsed.data.type,
        district: parsed.data.district,
        description: mergedDetails,
        status: "needs_moderator",
      })
      .eq("id", parsed.data.reportId);

    if (updErr) {
      req.log.error({ error: updErr }, "Failed to update report");
      return reply.status(500).send({ error: "Failed to update report" });
    }

    const mediaRows = parsed.data.storageKeys.map((key) => ({
      report_id: parsed.data.reportId,
      storage_key: key,
    }));

    const { error: mediaErr } = await supabase
      .from("report_media")
      .insert(mediaRows);

    if (mediaErr) {
      req.log.error({ error: mediaErr }, "Failed to store media rows");
      return reply.status(500).send({ error: "Failed to store media" });
    }

    const { error: metricsErr } = await supabase
      .from("report_metrics")
      .upsert({ report_id: parsed.data.reportId, likes: 0, views: 0 });
    if (metricsErr) {
      req.log.warn({ error: metricsErr }, "Failed to init report metrics");
    }

    const { error: queueErr } = await supabase.from("moderation_queue").upsert({
      report_id: parsed.data.reportId,
      status: "open",
    });
    if (queueErr) {
      req.log.warn({ error: queueErr }, "Failed to upsert moderation queue");
    }

    void runReportPipeline({
      reportId: parsed.data.reportId,
      userId,
      storageKeys: parsed.data.storageKeys,
      userDetails: parsed.data.details,
    });

    return reply.status(200).send({ reportId: parsed.data.reportId });
  });

  app.get("/reports/:id", { preHandler: requireAuth }, async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
  });

  app.post(
    "/reports/:id/like",
    { preHandler: requireAuth },
    async (_req, reply) => {
      return reply.status(501).send({ error: "Not implemented" });
    },
  );

  app.post(
    "/reports/:id/view",
    { preHandler: requireAuth },
    async (_req, reply) => {
      return reply.status(501).send({ error: "Not implemented" });
    },
  );
}
