import type { preHandlerHookHandler } from "fastify";

import { supabase } from "../services/supabase.ts";

export type AuthedUser = {
  userId: string;
  email: string | null;
  role: string;
  karma?: number | null;
};

function getBearerToken(
  authorizationHeader: string | undefined,
): string | null {
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

  const userId = data.user.id;
  const email = data.user.email ?? null;

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id,email,karma,role")
    .eq("id", userId)
    .maybeSingle();

  if (profileErr) {
    req.log.error({ error: profileErr }, "Failed to load profile");
    await reply.status(500).send({ error: "Failed to load profile" });
    return;
  }

  if (!profile) {
    const { error: insertErr } = await supabase
      .from("profiles")
      .insert({ id: userId, email });

    if (insertErr) {
      req.log.error({ error: insertErr }, "Failed to create profile");
      await reply.status(500).send({ error: "Failed to create profile" });
      return;
    }
  }

  const role = profile?.role ?? "user";

  req.authUser = {
    userId,
    email,
    role,
    karma: profile?.karma ?? null,
  };
};
