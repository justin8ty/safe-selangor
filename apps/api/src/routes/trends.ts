import type { FastifyInstance } from "fastify";

export async function trendsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/trends", async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
  });
}
