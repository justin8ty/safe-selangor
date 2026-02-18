import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";

import { env } from "./config/env.ts";
import { registerSockets } from "./sockets/index.ts";
import { authRoutes } from "./routes/auth.ts";
import { uploadsRoutes } from "./routes/uploads.ts";
import { reportsRoutes } from "./routes/reports.ts";
import { feedRoutes } from "./routes/feed.ts";
import { moderationRoutes } from "./routes/moderation.ts";
import { mapRoutes } from "./routes/map.ts";
import { trendsRoutes } from "./routes/trends.ts";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(cookie);

app.get("/healthz", async () => ({ status: "ok" }));

await app.register(authRoutes);
await app.register(uploadsRoutes);
await app.register(reportsRoutes);
await app.register(feedRoutes);
await app.register(moderationRoutes);
await app.register(mapRoutes);
await app.register(trendsRoutes);

await app.listen({ port: env.PORT, host: "0.0.0.0" });

registerSockets(app.server);

console.log(`API listening on http://0.0.0.0:${env.PORT}`);
