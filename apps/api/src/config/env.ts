import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().min(1),
  GOOGLE_PLACES_API_KEY: z.string().optional().default(""),
  GEMINI_API_KEY: z.string().min(1),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(10),
  MAX_IMAGES_PER_REPORT: z.coerce.number().positive().default(3),
  PORT: z.coerce.number().positive().default(3001),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
