import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { requireAuth } from "../auth/requireAuth.ts";
import { supabase, supabaseAnon } from "../services/supabase.ts";

const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/register", async (req, reply) => {
    const parsed = registerBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
    }

    const { data, error } = await supabaseAnon.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.user) {
      req.log.warn({ error }, "Supabase signUp failed");
      return reply
        .status(400)
        .send({ error: error?.message ?? "Sign up failed" });
    }

    const { error: profileErr } = await supabase.from("profiles").upsert({
      id: data.user.id,
      email: data.user.email,
    });

    if (profileErr) {
      req.log.error(
        { error: profileErr },
        "Failed to create profile after signUp",
      );
      return reply.status(500).send({ error: "Failed to create profile" });
    }

    if (data.session) {
      return reply.status(201).send({
        userId: data.user.id,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      });
    }

    return reply.status(201).send({
      userId: data.user.id,
      needsEmailConfirmation: true,
    });
  });

  app.post("/auth/login", async (req, reply) => {
    const parsed = loginBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
    }

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.session || !data.user) {
      req.log.warn({ error }, "Supabase signInWithPassword failed");
      return reply
        .status(401)
        .send({ error: error?.message ?? "Login failed" });
    }

    return reply.send({
      userId: data.user.id,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  });

  app.get("/auth/me", { preHandler: requireAuth }, async (req) => {
    const userId = req.authUser?.userId;
    if (!userId) return { user: null };

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id,email,karma,role,created_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      req.log.error({ error }, "Failed to fetch profile");
      return { user: req.authUser };
    }

    return { user: profile ?? req.authUser };
  });
}
