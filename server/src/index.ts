import { Hono } from "hono";
import { createApp } from "./app";
import { getOptionalEnvVar } from "./config/env";
import { registerClient, unregisterClient } from "./services/ws-broadcast";
import { startPgListener } from "./services/pg-listener";

export const app = createApp();

/**
 * Starts the Bun HTTP + WebSocket server.
 *
 * WebSocket upgrade requests to any path are intercepted before Hono so the
 * Bun WS handler can take over. All other requests are forwarded to Hono.
 */
export function startServer(serverApp: Hono): void {
  const port = Number(getOptionalEnvVar("PORT") ?? "3000");

  try {
  Bun.serve({
    port,
    fetch(req, server) {
      if (req.headers.get("upgrade") === "websocket") {
        const ok = server.upgrade(req);
        if (!ok) {
          return new Response("WebSocket upgrade failed", { status: 400 });
        }
        return undefined as unknown as Response;
      }
      return serverApp.fetch(req);
    },
    websocket: {
      open(ws) {
        registerClient(ws);
      },
      close(ws) {
        unregisterClient(ws);
      },
      message() {
        // clients are receive-only; ignore incoming messages
      },
    },
  });
  } catch (err: unknown) {
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === "EADDRINUSE") {
      console.error(`Error: port ${port} is already in use. Stop the existing process or set a different PORT in server/.env`);
      process.exit(1);
    }
    throw err;
  }

  startPgListener().catch((err) => {
    console.error("Failed to start Postgres listener:", err);
  });

  console.log(`PokeHub API listening on :${port}`);
}

export type AppType = typeof app;

if (import.meta.main) {
  startServer(app);
}
