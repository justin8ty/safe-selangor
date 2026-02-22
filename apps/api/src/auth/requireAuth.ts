import type { preHandlerHookHandler } from "fastify";

import { supabase } from "../services/supabase.ts";

export type AuthedUser = {
  userId: string;
  email?: string | null;
};

function getBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) return null;
  if (!authorizationHeader.startsWith("Bearer ")) return null;
  const token = authorizationHeader.slice("Bearer ".length).trim();
  return token.length ? token : null;
}

export const requireAuth: preHandlerHookHandler = async (req, reply) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    await reply.status(401).send({ error: "Missing bearer token" });
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    await reply.status(401).send({ error: "Invalid token" });
    return;
  }

  req.authUser = {
    userId: data.user.id,
    email: data.user.email,
  };
};
