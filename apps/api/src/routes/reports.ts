import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { requireAuth } from "../auth/requireAuth.ts";
import { supabase } from "../services/supabase.ts";
import { runReportPipeline } from "../pipeline/runReportPipeline.ts";

const createReportBodySchema = z.object({
  storageKeys: z.array(z.string().min(1)).min(1),
  lat: z.number(),
  lng: z.number(),
  state: z.string().min(1),
  district: z.string().min(1),
  category: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
});

export async function reportsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/reports", { preHandler: requireAuth }, async (req, reply) => {
    const parsed = createReportBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
    }

    const userId = req.authUser?.userId;
    if (!userId) return reply.status(401).send({ error: "Unauthorized" });

    const nowIso = new Date().toISOString();

    const { data: reportRow, error: reportErr } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        category: parsed.data.category,
        type: parsed.data.type,
        state: parsed.data.state,
        district: parsed.data.district,
        description: parsed.data.description ?? null,
        date: parsed.data.date ?? nowIso,
        status: "pending",
      })
      .select("id")
      .single();

    if (reportErr || !reportRow) {
      req.log.error({ error: reportErr }, "Failed to create report");
      return reply.status(500).send({ error: "Failed to create report" });
    }

    const reportId = reportRow.id as string;

    const { error: locErr } = await supabase
      .from("report_location_private")
      .insert({
        report_id: reportId,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
      });

    if (locErr) {
      req.log.error({ error: locErr }, "Failed to store private location");
      return reply.status(500).send({ error: "Failed to store location" });
    }

    const mediaRows = parsed.data.storageKeys.map((key) => ({
      report_id: reportId,
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
      .insert({ report_id: reportId, likes: 0, views: 0 });
    if (metricsErr) {
      req.log.warn({ error: metricsErr }, "Failed to init report metrics");
    }

    void runReportPipeline({
      reportId,
      userId,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      storageKeys: parsed.data.storageKeys,
    });

    return reply.status(201).send({ reportId, status: "pending" });
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
