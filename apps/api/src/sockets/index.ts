import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";

export let io: Server;

export function registerSockets(httpServer: HttpServer): void {
  io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  const feed = io.of("/feed");
  feed.on("connection", (socket) => {
    socket.join("feed");
  });

  const moderation = io.of("/moderation");
  moderation.on("connection", (socket) => {
    socket.join("moderation");
  });
}
