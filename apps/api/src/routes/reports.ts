import type { FastifyInstance } from "fastify";

import { requireAuth } from "../auth/requireAuth.ts";

export async function reportsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/reports", { preHandler: requireAuth }, async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
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
