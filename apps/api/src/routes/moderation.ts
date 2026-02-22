import type { FastifyInstance } from "fastify";

import { requireAuth } from "../auth/requireAuth.ts";

export async function moderationRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/moderation/queue",
    { preHandler: requireAuth },
    async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
    },
  );

  app.post(
    "/moderation/:reportId/approve",
    { preHandler: requireAuth },
    async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
    },
  );

  app.post(
    "/moderation/:reportId/reject",
    { preHandler: requireAuth },
    async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
    },
  );
}
