import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { requireAuth } from "../auth/requireAuth.ts";
import { env } from "../config/env.ts";
import { supabase } from "../services/supabase.ts";

const allowedMimeToExt = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const signUploadsBodySchema = z.object({
  files: z
    .array(
      z.object({
        mime: z.enum(["image/jpeg", "image/png", "image/webp"]),
      }),
    )
    .min(1)
    .max(env.MAX_IMAGES_PER_REPORT),
});

export async function uploadsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/uploads/sign", { preHandler: requireAuth }, async (req, reply) => {
    const parsed = signUploadsBodySchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
    }

    const userId = req.authUser?.userId;
    if (!userId) return reply.status(401).send({ error: "Unauthorized" });

    const bucket = env.SUPABASE_STORAGE_BUCKET;

    const uploads = await Promise.all(
      parsed.data.files.map(async ({ mime }) => {
        const ext = allowedMimeToExt[mime];
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;

        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUploadUrl(path);

        if (error || !data) {
          req.log.error({ error }, "Failed to sign upload URL");
          throw new Error("Failed to sign upload URL");
        }

        return {
          mime,
          path: data.path,
          signedUrl: data.signedUrl,
          token: data.token,
        };
      }),
    );

    return reply.send({ bucket, uploads });
  });
}
