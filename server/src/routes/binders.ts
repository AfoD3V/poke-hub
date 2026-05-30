import { Hono } from "hono";
import type { AuthContext } from "../middleware/auth";
import { isValidGridSize } from "../services/binderService";
import type { PlaceCardBody, CardSnapshot } from "../../../shared/binders";

const bindersRouter = new Hono();

// ── GET /api/binders ──────────────────────────────────────────────────────────

bindersRouter.get("/", async (c) => {
  const { userId } = c.get("auth") as AuthContext;
  const { listBinders } = await import("../services/binderService");

  try {
    const binderList = await listBinders(userId);
    return c.json({ binders: binderList }, 200);
  } catch {
    return c.json({ error: "Failed to fetch binders" }, 500);
  }
});

// ── POST /api/binders ─────────────────────────────────────────────────────────

bindersRouter.post("/", async (c) => {
  const { userId } = c.get("auth") as AuthContext;

  let body: { name?: unknown; icon?: unknown; gridCols?: unknown; gridRows?: unknown; color?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return c.json({ error: "name is required" }, 400);
  }
  if (body.name.trim().length > 64) {
    return c.json({ error: "name must be 64 characters or fewer" }, 400);
  }

  const gridCols = body.gridCols !== undefined ? Number(body.gridCols) : 4;
  const gridRows = body.gridRows !== undefined ? Number(body.gridRows) : 4;

  if (!isValidGridSize(gridCols, gridRows)) {
    return c.json({ error: "gridCols and gridRows must each be between 1 and 10" }, 400);
  }

  const icon = typeof body.icon === "string" ? body.icon : "book-open";
  const color = typeof body.color === "string" ? body.color : "purple";
  const { createBinder } = await import("../services/binderService");

  try {
    const binder = await createBinder(userId, body.name, icon, gridCols, gridRows, color);
    return c.json({ binder }, 201);
  } catch {
    return c.json({ error: "Failed to create binder" }, 500);
  }
});

// ── GET /api/binders/:id ──────────────────────────────────────────────────────

bindersRouter.get("/:id", async (c) => {
  const { userId } = c.get("auth") as AuthContext;
  const binderId = c.req.param("id");
  const { getBinderById } = await import("../services/binderService");

  try {
    const binder = await getBinderById(userId, binderId);
    if (!binder) return c.json({ error: "Not found" }, 404);
    return c.json({ binder }, 200);
  } catch {
    return c.json({ error: "Failed to fetch binder" }, 500);
  }
});

// ── PATCH /api/binders/:id ────────────────────────────────────────────────────

bindersRouter.patch("/:id", async (c) => {
  const { userId } = c.get("auth") as AuthContext;
  const binderId = c.req.param("id");

  let body: { name?: unknown; icon?: unknown; gridCols?: unknown; gridRows?: unknown; color?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const updates: { name?: string; icon?: string; gridCols?: number; gridRows?: number; color?: string } = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return c.json({ error: "name must be a non-empty string" }, 400);
    }
    if (body.name.trim().length > 64) {
      return c.json({ error: "name must be 64 characters or fewer" }, 400);
    }
    updates.name = body.name;
  }
  if (body.icon !== undefined && typeof body.icon === "string") updates.icon = body.icon;
  if (body.gridCols !== undefined) updates.gridCols = Number(body.gridCols);
  if (body.gridRows !== undefined) updates.gridRows = Number(body.gridRows);
  if (body.color !== undefined && typeof body.color === "string") updates.color = body.color;

  if ((updates.gridCols !== undefined || updates.gridRows !== undefined)) {
    const cols = updates.gridCols ?? 4;
    const rows = updates.gridRows ?? 4;
    if (!isValidGridSize(cols, rows)) {
      return c.json({ error: "gridCols and gridRows must each be between 1 and 10" }, 400);
    }
  }

  const { updateBinder } = await import("../services/binderService");

  try {
    const binder = await updateBinder(userId, binderId, updates);
    if (!binder) return c.json({ error: "Not found" }, 404);
    return c.json({ binder }, 200);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "SLOTS_OUT_OF_BOUNDS") {
      return c.json({ error: "Cannot resize: slots exist outside new grid bounds" }, 409);
    }
    if (e?.code === "INVALID_GRID_SIZE") {
      return c.json({ error: "gridCols and gridRows must each be between 1 and 10" }, 400);
    }
    return c.json({ error: "Failed to update binder" }, 500);
  }
});

// ── DELETE /api/binders/:id ───────────────────────────────────────────────────

bindersRouter.delete("/:id", async (c) => {
  const { userId } = c.get("auth") as AuthContext;
  const binderId = c.req.param("id");
  const { deleteBinder } = await import("../services/binderService");

  try {
    const deleted = await deleteBinder(userId, binderId);
    if (!deleted) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true }, 200);
  } catch {
    return c.json({ error: "Failed to delete binder" }, 500);
  }
});

// ── POST /api/binders/:id/pages ───────────────────────────────────────────────

bindersRouter.post("/:id/pages", async (c) => {
  const { userId } = c.get("auth") as AuthContext;
  const binderId = c.req.param("id");
  const { addPage } = await import("../services/binderService");

  try {
    const page = await addPage(userId, binderId);
    if (!page) return c.json({ error: "Not found" }, 404);
    return c.json({ page }, 201);
  } catch {
    return c.json({ error: "Failed to add page" }, 500);
  }
});

// ── DELETE /api/binders/:id/pages/:pageId ─────────────────────────────────────

bindersRouter.delete("/:id/pages/:pageId", async (c) => {
  const { userId } = c.get("auth") as AuthContext;
  const binderId = c.req.param("id");
  const pageId = c.req.param("pageId");
  const { removePage } = await import("../services/binderService");

  try {
    const removed = await removePage(userId, binderId, pageId);
    if (!removed) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true }, 200);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "PAGE_HAS_SLOTS") {
      return c.json({ error: "Cannot remove page with occupied slots" }, 409);
    }
    return c.json({ error: "Failed to remove page" }, 500);
  }
});

// ── PUT /api/binders/:id/pages/:pageId/slots/:slotIndex ──────────────────────

bindersRouter.put("/:id/pages/:pageId/slots/:slotIndex", async (c) => {
  const { userId } = c.get("auth") as AuthContext;
  const binderId = c.req.param("id");
  const pageId = c.req.param("pageId");
  const slotIndex = Number(c.req.param("slotIndex"));

  if (Number.isNaN(slotIndex) || slotIndex < 0) {
    return c.json({ error: "slotIndex must be a non-negative integer" }, 400);
  }

  let body: PlaceCardBody;
  try {
    body = await c.req.json<PlaceCardBody>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!body.cardId || typeof body.cardId !== "string") {
    return c.json({ error: "cardId is required" }, 400);
  }
  if (!body.cardSnapshot || typeof body.cardSnapshot !== "object") {
    return c.json({ error: "cardSnapshot is required" }, 400);
  }

  const snap = body.cardSnapshot as Record<string, unknown>;
  if (typeof snap.name !== "string" || typeof snap.imageSmall !== "string") {
    return c.json({ error: "cardSnapshot must include name and imageSmall" }, 400);
  }

  const { placeCard } = await import("../services/binderService");

  try {
    const slot = await placeCard(userId, binderId, pageId, slotIndex, body.cardId, body.cardSnapshot as CardSnapshot);
    if (!slot) return c.json({ error: "Not found" }, 404);
    return c.json({ slot }, 200);
  } catch {
    return c.json({ error: "Failed to place card" }, 500);
  }
});

// ── DELETE /api/binders/:id/pages/:pageId/slots/:slotIndex ───────────────────

bindersRouter.delete("/:id/pages/:pageId/slots/:slotIndex", async (c) => {
  const { userId } = c.get("auth") as AuthContext;
  const binderId = c.req.param("id");
  const pageId = c.req.param("pageId");
  const slotIndex = Number(c.req.param("slotIndex"));

  if (Number.isNaN(slotIndex) || slotIndex < 0) {
    return c.json({ error: "slotIndex must be a non-negative integer" }, 400);
  }

  const { clearSlot } = await import("../services/binderService");

  try {
    const cleared = await clearSlot(userId, binderId, pageId, slotIndex);
    if (!cleared) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true }, 200);
  } catch {
    return c.json({ error: "Failed to clear slot" }, 500);
  }
});

// ── POST /api/binders/:id/pages/:pageId/slots/:slotIndex/move ────────────────

bindersRouter.post("/:id/pages/:pageId/slots/:slotIndex/move", async (c) => {
  const { userId } = c.get("auth") as AuthContext;
  const binderId = c.req.param("id");
  const fromPageId = c.req.param("pageId");
  const fromSlotIndex = Number(c.req.param("slotIndex"));

  if (Number.isNaN(fromSlotIndex) || fromSlotIndex < 0) {
    return c.json({ error: "slotIndex must be a non-negative integer" }, 400);
  }

  let body: { toPageId?: unknown; toSlotIndex?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!body.toPageId || typeof body.toPageId !== "string") {
    return c.json({ error: "toPageId is required" }, 400);
  }
  if (body.toSlotIndex === undefined || typeof body.toSlotIndex !== "number") {
    return c.json({ error: "toSlotIndex is required" }, 400);
  }

  const { moveCard } = await import("../services/binderService");

  try {
    const moved = await moveCard(userId, binderId, fromPageId, fromSlotIndex, body.toPageId, body.toSlotIndex);
    if (!moved) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true }, 200);
  } catch {
    return c.json({ error: "Failed to move card" }, 500);
  }
});

// ── POST /api/binders/:id/pages/:pageId/slots/:slotIndex/copy ────────────────

bindersRouter.post("/:id/pages/:pageId/slots/:slotIndex/copy", async (c) => {
  const { userId } = c.get("auth") as AuthContext;
  const binderId = c.req.param("id");
  const fromPageId = c.req.param("pageId");
  const fromSlotIndex = Number(c.req.param("slotIndex"));

  if (Number.isNaN(fromSlotIndex) || fromSlotIndex < 0) {
    return c.json({ error: "slotIndex must be a non-negative integer" }, 400);
  }

  let body: { toPageId?: unknown; toSlotIndex?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!body.toPageId || typeof body.toPageId !== "string") {
    return c.json({ error: "toPageId is required" }, 400);
  }
  if (body.toSlotIndex === undefined || typeof body.toSlotIndex !== "number") {
    return c.json({ error: "toSlotIndex is required" }, 400);
  }

  const { copyCard } = await import("../services/binderService");

  try {
    const slot = await copyCard(userId, binderId, fromPageId, fromSlotIndex, body.toPageId, body.toSlotIndex);
    if (!slot) return c.json({ error: "Not found" }, 404);
    return c.json({ slot }, 200);
  } catch {
    return c.json({ error: "Failed to copy card" }, 500);
  }
});

export { bindersRouter };
