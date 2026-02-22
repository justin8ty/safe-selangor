import type { FastifyInstance } from "fastify";

import { requireAuth } from "../auth/requireAuth.ts";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.get("/auth/me", { preHandler: requireAuth }, async (req) => {
    return { user: req.authUser };
  });
}
