import type { FastifyInstance } from "fastify";

export async function reportsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/reports", async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
  });

  app.get("/reports/:id", async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
  });

  app.post("/reports/:id/like", async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
  });

  app.post("/reports/:id/view", async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
  });
}
