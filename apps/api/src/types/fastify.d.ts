import "fastify";

import type { AuthedUser } from "../auth/requireAuth.ts";

declare module "fastify" {
  interface FastifyRequest {
    authUser: AuthedUser | null;
  }
}
