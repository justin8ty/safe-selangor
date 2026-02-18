import type { FastifyInstance } from "fastify";

export async function mapRoutes(app: FastifyInstance): Promise<void> {
  app.get("/map/choropleth", async (_req, reply) => {
    return reply.status(501).send({ error: "Not implemented" });
  });
}
