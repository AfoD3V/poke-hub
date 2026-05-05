import { Hono } from "hono";
import { searchCards, getCardById, TcgProxyServiceError } from "../services/tcg-proxy";
import type { TcgProxyError, TcgSearchResponse } from "../../../shared/tcg";

/**
 * Registers TCG proxy routes on the Hono app.
 *
 * Routes:
 * - `GET /api/cards/search?q=<query>&page=<n>&pageSize=<n>` — search cards
 * - `GET /api/cards/:id` — fetch a single card by id
 */
export function registerTcgProxyRoutes(app: Hono): void {
  app.get("/api/cards/search", async (context) => {
    const q = context.req.query("q") ?? "";
    const page = Number(context.req.query("page") ?? "1");
    const pageSize = Number(context.req.query("pageSize") ?? "20");

    if (!q.trim()) {
      const error: TcgProxyError = { error: "Missing search query parameter 'q'" };
      return context.json(error, 400);
    }

    try {
      const result = await searchCards(q.trim(), page, pageSize);
      const response: TcgSearchResponse = result;
      return context.json(response, 200);
    } catch (err) {
      if (err instanceof TcgProxyServiceError) {
        const error: TcgProxyError = { error: err.message };
        return context.json(error, err.statusCode);
      }
      const error: TcgProxyError = { error: "Internal error" };
      return context.json(error, 500);
    }
  });

  app.get("/api/cards/:id", async (context) => {
    const id = context.req.param("id");

    try {
      const card = await getCardById(id);
      if (!card) {
        const error: TcgProxyError = { error: "Card not found" };
        return context.json(error, 404);
      }
      return context.json(card, 200);
    } catch (err) {
      if (err instanceof TcgProxyServiceError) {
        const error: TcgProxyError = { error: err.message };
        return context.json(error, err.statusCode);
      }
      const error: TcgProxyError = { error: "Internal error" };
      return context.json(error, 500);
    }
  });
}
