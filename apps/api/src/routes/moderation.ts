import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { requireAuth } from "../auth/requireAuth.ts";
import { supabase } from "../services/supabase.ts";
import { io } from "../sockets/index.ts";
import { getReportCard } from "../services/feed.ts";

const reportIdParamsSchema = z.object({
  reportId: z.string().min(1),
});

export async function moderationRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/moderation/queue",
    { preHandler: requireAuth },
    async (req, reply) => {
      const { data: queueRows, error: queueErr } = await supabase
        .from("moderation_queue")
        .select("report_id,status,created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50);

      if (queueErr) {
        req.log.error({ error: queueErr }, "Failed to fetch moderation queue");
        return reply.status(500).send({ error: "Failed to fetch queue" });
      }

      const reportIds = (queueRows ?? []).map((r) => r.report_id as string);

      if (reportIds.length === 0) {
        return reply.send({ items: [] });
      }

      const { data: reports, error: reportsErr } = await supabase
        .from("reports")
        .select(
          "id,user_id,category,type,description,date,status,ai_confidence,ai_explanation,created_at,district,state",
        )
        .in("id", reportIds);

      if (reportsErr) {
        req.log.error({ error: reportsErr }, "Failed to fetch queued reports");
        return reply.status(500).send({ error: "Failed to fetch reports" });
      }

      const { data: media, error: mediaErr } = await supabase
        .from("report_media")
        .select("report_id,storage_key")
        .in("report_id", reportIds);

      if (mediaErr) {
        req.log.error({ error: mediaErr }, "Failed to fetch queued media");
        return reply.status(500).send({ error: "Failed to fetch media" });
      }

      const reportById = new Map<string, (typeof reports)[number]>();
      for (const r of reports ?? []) reportById.set(r.id as string, r);

      const mediaByReportId = new Map<string, string[]>();
      for (const m of media ?? []) {
        const rid = m.report_id as string;
        const arr = mediaByReportId.get(rid) ?? [];
        arr.push(m.storage_key as string);
        mediaByReportId.set(rid, arr);
      }

      const items = (queueRows ?? []).map((q) => {
        const reportId = q.report_id as string;
        return {
          reportId,
          queue: { status: q.status, createdAt: q.created_at },
          report: reportById.get(reportId) ?? null,
          media: mediaByReportId.get(reportId) ?? [],
        };
      });

      return reply.send({ items });
    },
  );

  app.post(
    "/moderation/:reportId/approve",
    { preHandler: requireAuth },
    async (req, reply) => {
      const parsedParams = reportIdParamsSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return reply.status(400).send({ error: "Invalid reportId" });
      }

      const reportId = parsedParams.data.reportId;
      const moderatorId = req.authUser?.userId;
      if (!moderatorId) return reply.status(401).send({ error: "Unauthorized" });

      const { data: existing, error: findErr } = await supabase
        .from("reports")
        .select("id")
        .eq("id", reportId)
        .maybeSingle();

      if (findErr) {
        req.log.error({ error: findErr }, "Failed to lookup report");
        return reply.status(500).send({ error: "Failed to lookup report" });
      }
      if (!existing) return reply.status(404).send({ error: "Report not found" });

      const { error: reportErr } = await supabase
        .from("reports")
        .update({ status: "approved" })
        .eq("id", reportId);
      if (reportErr) {
        req.log.error({ error: reportErr }, "Failed to approve report");
        return reply.status(500).send({ error: "Failed to approve report" });
      }

      const { error: queueErr } = await supabase
        .from("moderation_queue")
        .update({ status: "resolved" })
        .eq("report_id", reportId);
      if (queueErr) {
        req.log.warn({ error: queueErr }, "Failed to resolve moderation queue");
      }

      const { error: actionErr } = await supabase
        .from("moderation_actions")
        .insert({
          report_id: reportId,
          moderator_profile_id: moderatorId,
          action: "approve",
        });
      if (actionErr) {
        req.log.warn({ error: actionErr }, "Failed to insert moderation action");
      }

      io
        ?.of("/moderation")
        .to("moderation")
        .emit("moderation:queue_updated", { reportId });

      const feedItem = await getReportCard(reportId);
      if (feedItem) {
        io?.of("/feed").to("feed").emit("feed:new_report", feedItem);
      }

      return reply.send({ reportId, status: "approved" });
    },
  );

  app.post(
    "/moderation/:reportId/reject",
    { preHandler: requireAuth },
    async (req, reply) => {
      const parsedParams = reportIdParamsSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return reply.status(400).send({ error: "Invalid reportId" });
      }

      const reportId = parsedParams.data.reportId;
      const moderatorId = req.authUser?.userId;
      if (!moderatorId) return reply.status(401).send({ error: "Unauthorized" });

      const { data: existing, error: findErr } = await supabase
        .from("reports")
        .select("id")
        .eq("id", reportId)
        .maybeSingle();

      if (findErr) {
        req.log.error({ error: findErr }, "Failed to lookup report");
        return reply.status(500).send({ error: "Failed to lookup report" });
      }
      if (!existing) return reply.status(404).send({ error: "Report not found" });

      const { error: reportErr } = await supabase
        .from("reports")
        .update({ status: "rejected" })
        .eq("id", reportId);
      if (reportErr) {
        req.log.error({ error: reportErr }, "Failed to reject report");
        return reply.status(500).send({ error: "Failed to reject report" });
      }

      const { error: queueErr } = await supabase
        .from("moderation_queue")
        .update({ status: "resolved" })
        .eq("report_id", reportId);
      if (queueErr) {
        req.log.warn({ error: queueErr }, "Failed to resolve moderation queue");
      }

      const { error: actionErr } = await supabase
        .from("moderation_actions")
        .insert({
          report_id: reportId,
          moderator_profile_id: moderatorId,
          action: "reject",
        });
      if (actionErr) {
        req.log.warn({ error: actionErr }, "Failed to insert moderation action");
      }

      io
        ?.of("/moderation")
        .to("moderation")
        .emit("moderation:queue_updated", { reportId });

      return reply.send({ reportId, status: "rejected" });
    },
  );
}
