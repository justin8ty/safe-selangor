# api

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.7. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

apps/api setup:

```
bun init
bun add fastify @fastify/cors @fastify/cookie socket.io zod @supabase/supabase-js @turf/boolean-point-in-polygon
bun add -d typescript @types/node
```
