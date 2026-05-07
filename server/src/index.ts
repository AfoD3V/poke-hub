import { Hono } from "hono";
import { createApp } from "./app";
import { getOptionalEnvVar } from "./config/env";

export const app = createApp();

/**
 * Starts the Bun server with the provided Hono app.
 */
export function startServer(serverApp: Hono): void {
  const port = Number(getOptionalEnvVar("PORT") ?? "3000");

  Bun.serve({
    port,
    fetch: serverApp.fetch
  });

  console.log(`PokeHub API listening on :${port}`);
}

export type AppType = typeof app;

if (import.meta.main) {
  startServer(app);
}
