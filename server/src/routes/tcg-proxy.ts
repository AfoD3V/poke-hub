import { Hono } from "hono";
import { searchCards, getCardById, getCardBySetAndNumber, getSets, getSeries, getSeriesById, getSetCards, getSetInfo, getJpSeries, getJpSetCards, TcgProxyServiceError } from "../services/tcg-proxy";
import type { TcgProxyError, TcgSearchResponse } from "../../../shared/tcg";

/**
 * Registers TCG proxy routes on the Hono app.
 *
 * Routes:
 * - `GET /api/sets` — list all sets (cached 24 h)
 * - `GET /api/series` — list all series with release dates (cached 24 h)
 * - `GET /api/series/:id` — series detail with sets (cached 24 h)
 * - `GET /api/sets/:id/info` — set logo (cached 24 h)
 * - `GET /api/sets/:id/cards` — lightweight card list for a set (cached 24 h)
 * - `GET /api/cards/search?q=<query>&lang=<code>` — search cards by name
 * - `GET /api/cards/by-set?setId=<id>&cardNumber=<n>` — fetch a card by set + local number
 * - `GET /api/cards/:id` — fetch a single card by id
 */
export function registerTcgProxyRoutes(app: Hono): void {
  app.get("/api/sets", async (context) => {
    try {
      const sets = await getSets();
      return context.json(sets, 200);
    } catch (err) {
      if (err instanceof TcgProxyServiceError) {
        const error: TcgProxyError = { error: err.message };
        return context.json(error, err.statusCode);
      }
      const error: TcgProxyError = { error: "Internal error" };
      return context.json(error, 500);
    }
  });

  app.get("/api/series", async (context) => {
    const lang = context.req.query("lang") ?? "en";
    try {
      const series = lang === "ja" ? await getJpSeries() : await getSeries();
      return context.json(series, 200);
    } catch (err) {
      if (err instanceof TcgProxyServiceError) {
        const error: TcgProxyError = { error: err.message };
        return context.json(error, err.statusCode);
      }
      const error: TcgProxyError = { error: "Internal error" };
      return context.json(error, 500);
    }
  });

  app.get("/api/series/:id", async (context) => {
    const id = context.req.param("id");
    try {
      const detail = await getSeriesById(id);
      return context.json(detail, 200);
    } catch (err) {
      if (err instanceof TcgProxyServiceError) {
        const error: TcgProxyError = { error: err.message };
        return context.json(error, err.statusCode);
      }
      const error: TcgProxyError = { error: "Internal error" };
      return context.json(error, 500);
    }
  });

  app.get("/api/sets/:id/info", async (context) => {
    const id = context.req.param("id");
    try {
      const info = await getSetInfo(id);
      return context.json({ id, ...info }, 200);
    } catch (err) {
      if (err instanceof TcgProxyServiceError) {
        const error: TcgProxyError = { error: err.message };
        return context.json(error, err.statusCode);
      }
      const error: TcgProxyError = { error: "Internal error" };
      return context.json(error, 500);
    }
  });

  app.get("/api/sets/:id/cards", async (context) => {
    const id = context.req.param("id");
    const lang = context.req.query("lang") ?? "en";
    try {
      const cards = lang === "ja" ? await getJpSetCards(id) : await getSetCards(id);
      return context.json(cards, 200);
    } catch (err) {
      if (err instanceof TcgProxyServiceError) {
        const error: TcgProxyError = { error: err.message };
        return context.json(error, err.statusCode);
      }
      const error: TcgProxyError = { error: "Internal error" };
      return context.json(error, 500);
    }
  });

  app.get("/api/cards/search", async (context) => {
    const q = context.req.query("q") ?? "";
    const page = Number(context.req.query("page") ?? "1");
    const pageSize = Number(context.req.query("pageSize") ?? "20");
    const lang = context.req.query("lang") ?? "en";

    if (!q.trim()) {
      const error: TcgProxyError = { error: "Missing search query parameter 'q'" };
      return context.json(error, 400);
    }

    try {
      const result = await searchCards(q.trim(), page, pageSize, lang);
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

  app.get("/api/cards/by-set", async (context) => {
    const setId = context.req.query("setId") ?? "";
    const cardNumber = context.req.query("cardNumber") ?? "";

    if (!setId.trim() || !cardNumber.trim()) {
      const error: TcgProxyError = {
        error: "Missing required parameters: setId and cardNumber"
      };
      return context.json(error, 400);
    }

    try {
      const card = await getCardBySetAndNumber(setId.trim(), cardNumber.trim());
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
