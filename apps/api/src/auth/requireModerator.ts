import type { preHandlerHookHandler } from "fastify";

export const requireModerator: preHandlerHookHandler = async (req, reply) => {
  if (!req.authUser) {
    await reply.status(401).send({ error: "Unauthorized" });
    return;
  }

  if (req.authUser.role !== "moderator") {
    await reply.status(403).send({ error: "Forbidden" });
    return;
  }
};
