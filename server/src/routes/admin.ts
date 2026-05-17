import { Hono } from "hono";

const admin = new Hono();

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

admin.get("/stats", async (c) => {
  const { getAdminStats } = await import("../services/admin");
  try {
    const stats = await getAdminStats();
    return c.json(stats, 200);
  } catch {
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

admin.get("/users", async (c) => {
  const page = Math.max(1, Number(c.req.query("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize") ?? 20)));
  const { listAdminUsers } = await import("../services/admin");
  try {
    const result = await listAdminUsers(page, pageSize);
    return c.json(result, 200);
  } catch {
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

admin.get("/users/:id", async (c) => {
  const id = c.req.param("id");
  const { getAdminUser } = await import("../services/admin");
  try {
    const user = await getAdminUser(id);
    if (!user) return c.json({ error: "User not found" }, 404);
    return c.json(user, 200);
  } catch {
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});

admin.patch("/users/:id", async (c) => {
  const id = c.req.param("id");
  let body: { displayName?: unknown; isAdmin?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const patch: { displayName?: string; isAdmin?: boolean } = {};
  if (body.displayName !== undefined) {
    if (typeof body.displayName !== "string") return c.json({ error: "displayName must be a string" }, 400);
    patch.displayName = body.displayName;
  }
  if (body.isAdmin !== undefined) {
    if (typeof body.isAdmin !== "boolean") return c.json({ error: "isAdmin must be a boolean" }, 400);
    patch.isAdmin = body.isAdmin;
  }

  const { updateAdminUser } = await import("../services/admin");
  try {
    const updated = await updateAdminUser(id, patch);
    if (!updated) return c.json({ error: "User not found" }, 404);
    return c.json(updated, 200);
  } catch {
    return c.json({ error: "Failed to update user" }, 500);
  }
});

admin.delete("/users/:id", async (c) => {
  const id = c.req.param("id");
  const { deleteAdminUser } = await import("../services/admin");
  try {
    const deleted = await deleteAdminUser(id);
    if (!deleted) return c.json({ error: "User not found" }, 404);
    return c.json({ ok: true }, 200);
  } catch {
    return c.json({ error: "Failed to delete user" }, 500);
  }
});

admin.post("/users/:id/reset-password", async (c) => {
  const id = c.req.param("id");
  let body: { newPassword?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!body.newPassword || typeof body.newPassword !== "string" || body.newPassword.length < 8) {
    return c.json({ error: "newPassword must be a string of at least 8 characters" }, 400);
  }

  const { resetAdminUserPassword } = await import("../services/admin");
  try {
    const ok = await resetAdminUserPassword(id, body.newPassword);
    if (!ok) return c.json({ error: "User not found" }, 404);
    return c.json({ ok: true }, 200);
  } catch {
    return c.json({ error: "Failed to reset password" }, 500);
  }
});

// ---------------------------------------------------------------------------
// User collection management
// ---------------------------------------------------------------------------

admin.get("/users/:id/collection", async (c) => {
  const userId = c.req.param("id");
  const { getAdminUserCollection } = await import("../services/admin");
  try {
    const entries = await getAdminUserCollection(userId);
    return c.json({ entries }, 200);
  } catch {
    return c.json({ error: "Failed to fetch collection" }, 500);
  }
});

admin.delete("/users/:id/collection/:entryId", async (c) => {
  const userId = c.req.param("id");
  const entryId = c.req.param("entryId");
  const { removeAdminCollectionEntry } = await import("../services/admin");
  try {
    const removed = await removeAdminCollectionEntry(userId, entryId);
    if (!removed) return c.json({ error: "Entry not found" }, 404);
    return c.json({ ok: true }, 200);
  } catch {
    return c.json({ error: "Failed to remove collection entry" }, 500);
  }
});

// ---------------------------------------------------------------------------
// User chase management
// ---------------------------------------------------------------------------

admin.get("/users/:id/chase", async (c) => {
  const userId = c.req.param("id");
  const { getAdminUserChase } = await import("../services/admin");
  try {
    const entries = await getAdminUserChase(userId);
    return c.json({ entries }, 200);
  } catch {
    return c.json({ error: "Failed to fetch chase list" }, 500);
  }
});

admin.delete("/users/:id/chase/:entryId", async (c) => {
  const userId = c.req.param("id");
  const entryId = c.req.param("entryId");
  const { removeAdminChaseEntry } = await import("../services/admin");
  try {
    const removed = await removeAdminChaseEntry(userId, entryId);
    if (!removed) return c.json({ error: "Entry not found" }, 404);
    return c.json({ ok: true }, 200);
  } catch {
    return c.json({ error: "Failed to remove chase entry" }, 500);
  }
});

// ---------------------------------------------------------------------------
// Cache management
// ---------------------------------------------------------------------------

admin.get("/cache", async (c) => {
  const { getAdminCacheStats } = await import("../services/admin");
  try {
    const stats = await getAdminCacheStats();
    return c.json(stats, 200);
  } catch {
    return c.json({ error: "Failed to fetch cache stats" }, 500);
  }
});

admin.delete("/cache", async (c) => {
  const { flushAdminCache } = await import("../services/admin");
  try {
    const deleted = await flushAdminCache();
    return c.json({ deleted }, 200);
  } catch {
    return c.json({ error: "Failed to flush cache" }, 500);
  }
});

admin.delete("/cache/:cardId", async (c) => {
  const cardId = c.req.param("cardId");
  const { flushAdminCacheEntry } = await import("../services/admin");
  try {
    const removed = await flushAdminCacheEntry(cardId);
    if (!removed) return c.json({ error: "Cache entry not found" }, 404);
    return c.json({ ok: true }, 200);
  } catch {
    return c.json({ error: "Failed to flush cache entry" }, 500);
  }
});

export { admin as adminRoutes };
