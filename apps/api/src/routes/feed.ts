import type { FastifyInstance } from "fastify";

import { requireAuth } from "../auth/requireAuth.ts";
import { getApprovedFeed } from "../services/feed.ts";

export async function feedRoutes(app: FastifyInstance): Promise<void> {
  app.get("/feed", { preHandler: requireAuth }, async (_req, reply) => {
    try {
      const items = await getApprovedFeed(50);
      return reply.send({ items });
    } catch (_err) {
      return reply.status(500).send({ error: "Failed to fetch feed" });
    }
  });
}
