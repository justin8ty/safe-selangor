import type { FastifyInstance } from "fastify";

export async function feedRoutes(app: FastifyInstance): Promise<void> {
  app.get("/feed", async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
  });
}
