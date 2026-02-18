import type { FastifyInstance } from "fastify";

export async function uploadsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/uploads/sign", async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
  });
}
