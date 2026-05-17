import { Hono } from "hono";
import { registerHealthRoutes } from "./routes/health";
import { registerAuthRoutes } from "./routes/auth";
import { registerTcgProxyRoutes } from "./routes/tcg-proxy";
import { registerCollectionRoutes } from "./routes/collection";
import { chaseRoutes } from "./routes/chase";
import { adminRoutes } from "./routes/admin";
import { requireAuth } from "./middleware/auth";
import { requireAdmin } from "./middleware/admin";

/**
 * Creates the main Hono application instance.
 */
export function createApp(): Hono {
  const app = new Hono();

  app.use("/api/collection/*", requireAuth);
  app.use("/api/chase/*", requireAuth);
  app.use("/api/admin/*", requireAdmin);

  registerHealthRoutes(app);
  registerAuthRoutes(app);
  registerTcgProxyRoutes(app);
  registerCollectionRoutes(app);
  app.route("/api/chase", chaseRoutes);
  app.route("/api/admin", adminRoutes);

  return app;
}
