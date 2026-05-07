import { Hono } from "hono";
import { getHealthStatus } from "../services/health";

/**
 * Registers health routes on the Hono app.
 */
export function registerHealthRoutes(app: Hono): void {
  app.get("/api/health", async (context) => {
    const status = await getHealthStatus();
    const statusCode = status.ok ? 200 : 503;

    return context.json(status, statusCode);
  });
}
