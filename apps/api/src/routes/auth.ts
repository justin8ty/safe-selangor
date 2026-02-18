import type { FastifyInstance } from "fastify";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.get("/auth/me", async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
  });
}
