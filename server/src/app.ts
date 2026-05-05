import { Hono } from "hono";
import { registerHealthRoutes } from "./routes/health";
import { registerAuthRoutes } from "./routes/auth";
import { registerTcgProxyRoutes } from "./routes/tcg-proxy";
import { requireAuth } from "./middleware/auth";

/**
 * Creates the main Hono application instance.
 */
export function createApp(): Hono {
  const app = new Hono();

  app.use("/api/collection/*", requireAuth);

  registerHealthRoutes(app);
  registerAuthRoutes(app);
  registerTcgProxyRoutes(app);

  return app;
}
