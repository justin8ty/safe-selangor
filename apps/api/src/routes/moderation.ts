import type { FastifyInstance } from "fastify";

export async function moderationRoutes(app: FastifyInstance): Promise<void> {
  app.get("/moderation/queue", async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
  });

  app.post("/moderation/:reportId/approve", async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
  });

  app.post("/moderation/:reportId/reject", async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
  });
}
