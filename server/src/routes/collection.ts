import { Hono } from "hono";
import type { AuthContext } from "../middleware/auth";
import type { AddToCollectionRequest, RemoveFromCollectionRequest } from "../../../shared/collection";

/**
 * Registers collection management routes on the Hono app.
 *
 * All routes are protected by the `requireAuth` middleware registered in app.ts.
 *
 * Routes:
 * - `GET /api/collection`        — fetch authenticated user's collection
 * - `POST /api/collection/add`   — add a card to the collection
 * - `DELETE /api/collection/remove` — remove a card from the collection
 */
export function registerCollectionRoutes(app: Hono): void {
  app.get("/api/collection", async (context) => {
    const { userId } = context.get("auth") as AuthContext;
    const { getUserCollection } = await import("../services/collection");

    try {
      const entries = await getUserCollection(userId);
      return context.json({ entries }, 200);
    } catch {
      return context.json({ error: "Failed to fetch collection" }, 500);
    }
  });

  app.post("/api/collection/add", async (context) => {
    const { userId } = context.get("auth") as AuthContext;

    let body: AddToCollectionRequest;
    try {
      body = await context.req.json<AddToCollectionRequest>();
    } catch {
      return context.json({ error: "Invalid request body" }, 400);
    }

    if (!body.cardId || typeof body.cardId !== "string" || !body.card) {
      return context.json({ error: "cardId and card are required" }, 400);
    }

    const { addCardToCollection } = await import("../services/collection");

    try {
      const entry = await addCardToCollection(
        userId,
        body.cardId,
        body.card,
        body.language ?? "en",
        body.quantity ?? 1
      );
      return context.json(entry, 201);
    } catch {
      return context.json({ error: "Failed to add card to collection" }, 500);
    }
  });

  app.delete("/api/collection/remove", async (context) => {
    const { userId } = context.get("auth") as AuthContext;

    let body: RemoveFromCollectionRequest;
    try {
      body = await context.req.json<RemoveFromCollectionRequest>();
    } catch {
      return context.json({ error: "Invalid request body" }, 400);
    }

    if (!body.cardId || typeof body.cardId !== "string") {
      return context.json({ error: "cardId is required" }, 400);
    }

    const { removeCardFromCollection } = await import("../services/collection");

    try {
      const removed = await removeCardFromCollection(userId, body.cardId);
      if (!removed) {
        return context.json({ error: "Card not found in collection" }, 404);
      }
      return context.json({ ok: true }, 200);
    } catch {
      return context.json({ error: "Failed to remove card from collection" }, 500);
    }
  });
}
