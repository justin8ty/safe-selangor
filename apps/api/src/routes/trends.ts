import type { FastifyInstance } from "fastify";

import { requireAuth } from "../auth/requireAuth.ts";

export async function trendsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/trends", { preHandler: requireAuth }, async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
  });
}
