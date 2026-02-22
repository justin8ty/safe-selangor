import type { FastifyInstance } from "fastify";

import { requireAuth } from "../auth/requireAuth.ts";

export async function uploadsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/uploads/sign", { preHandler: requireAuth }, async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
  });
}
