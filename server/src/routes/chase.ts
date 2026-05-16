import { Hono } from "hono";
import type { AuthContext } from "../middleware/auth";
import type { CardSnapshot } from "../../../shared/tcg";

const chase = new Hono();

chase.get("/", async (context) => {
  const { userId } = context.get("auth") as AuthContext;
  const { listChase } = await import("../services/chaseService");

  try {
    const entries = await listChase(userId);
    return context.json({ entries }, 200);
  } catch {
    return context.json({ error: "Failed to fetch chase list" }, 500);
  }
});

chase.post("/add", async (context) => {
  const { userId } = context.get("auth") as AuthContext;

  let body: { cardId?: unknown; cardSnapshot?: unknown };
  try {
    body = await context.req.json();
  } catch {
    return context.json({ error: "Invalid request body" }, 400);
  }

  if (!body.cardId || typeof body.cardId !== "string" || body.cardId.length > 64) {
    return context.json({ error: "cardId is required and must be at most 64 characters" }, 400);
  }
  if (!body.cardSnapshot || typeof body.cardSnapshot !== "object" || Array.isArray(body.cardSnapshot)) {
    return context.json({ error: "cardSnapshot is required" }, 400);
  }

  // Validate snapshot structure — all fields must be strings
  const snap = body.cardSnapshot as Record<string, unknown>;
  if (
    typeof snap.name !== "string" || !snap.name.trim() ||
    typeof snap.setName !== "string" ||
    typeof snap.setId !== "string" ||
    typeof snap.imageSmall !== "string"
  ) {
    return context.json({ error: "cardSnapshot must include name, setName, setId, imageSmall as strings" }, 400);
  }

  const { addChase } = await import("../services/chaseService");

  try {
    const entry = await addChase(userId, body.cardId, body.cardSnapshot as CardSnapshot);
    return context.json({ entry }, 201);
  } catch {
    return context.json({ error: "Failed to add chase card" }, 500);
  }
});

chase.delete("/remove", async (context) => {
  const { userId } = context.get("auth") as AuthContext;

  let body: { cardId?: unknown };
  try {
    body = await context.req.json();
  } catch {
    return context.json({ error: "Invalid request body" }, 400);
  }

  if (!body.cardId || typeof body.cardId !== "string" || body.cardId.length > 64) {
    return context.json({ error: "cardId is required and must be at most 64 characters" }, 400);
  }

  const { removeChase } = await import("../services/chaseService");

  try {
    const removed = await removeChase(userId, body.cardId);
    if (!removed) {
      return context.json({ error: "Not found" }, 404);
    }
    return context.json({ success: true }, 200);
  } catch {
    return context.json({ error: "Failed to remove chase card" }, 500);
  }
});

export { chase as chaseRoutes };
