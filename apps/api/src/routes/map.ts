import type { FastifyInstance } from "fastify";

import { requireAuth } from "../auth/requireAuth.ts";

export async function mapRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/map/choropleth",
    { preHandler: requireAuth },
    async (_req, reply) => {
      return reply.status(501).send({ error: "Not implemented" });
    },
  );
}
