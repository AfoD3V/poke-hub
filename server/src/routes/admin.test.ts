import { beforeAll, beforeEach, afterAll, describe, expect, it, mock } from "bun:test";
import { createJwtForUser } from "../services/auth-core";

// ---------------------------------------------------------------------------
// Shared in-memory state mocking the DB layer
// ---------------------------------------------------------------------------

type StoredUser = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type StoredCollection = {
  id: string;
  userId: string;
  cardId: string;
  language: string;
  quantity: number;
  addedAt: Date;
};

type StoredChase = {
  id: string;
  userId: string;
  cardId: string;
  cardSnapshot: { name: string; setName: string; setId: string; imageSmall: string };
  addedAt: Date;
};

type StoredCache = {
  cardId: string;
  payload: Record<string, unknown>;
  fetchedAt: Date;
};

const users = new Map<string, StoredUser>();
const collection = new Map<string, StoredCollection>();
const chaseCards = new Map<string, StoredChase>();
const cache = new Map<string, StoredCache>();

mock.module("../services/admin", () => ({
  isUserAdmin: async (userId: string) => {
    const u = users.get(userId);
    return u?.isAdmin ?? false;
  },

  getAdminStats: async () => ({
    totalUsers: users.size,
    totalCollectionEntries: collection.size,
    totalChaseCards: chaseCards.size,
    totalCachedCards: cache.size
  }),

  listAdminUsers: async (page: number, pageSize: number) => {
    const all = Array.from(users.values());
    const start = (page - 1) * pageSize;
    return {
      users: all.slice(start, start + pageSize).map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt.toISOString(),
        collectionCount: Array.from(collection.values()).filter((c) => c.userId === u.id).length,
        chaseCount: Array.from(chaseCards.values()).filter((c) => c.userId === u.id).length
      })),
      total: all.length
    };
  },

  getAdminUser: async (id: string) => {
    const u = users.get(id);
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt.toISOString(),
      collectionCount: Array.from(collection.values()).filter((c) => c.userId === u.id).length,
      chaseCount: Array.from(chaseCards.values()).filter((c) => c.userId === u.id).length
    };
  },

  updateAdminUser: async (id: string, data: { displayName?: string; isAdmin?: boolean }) => {
    const u = users.get(id);
    if (!u) return null;
    if (data.displayName !== undefined) u.displayName = data.displayName;
    if (data.isAdmin !== undefined) u.isAdmin = data.isAdmin;
    users.set(id, u);
    return { id: u.id, email: u.email, displayName: u.displayName, isAdmin: u.isAdmin, createdAt: u.createdAt.toISOString() };
  },

  deleteAdminUser: async (id: string) => {
    if (!users.has(id)) return false;
    users.delete(id);
    for (const [k, v] of collection) { if (v.userId === id) collection.delete(k); }
    for (const [k, v] of chaseCards) { if (v.userId === id) chaseCards.delete(k); }
    return true;
  },

  resetAdminUserPassword: async (id: string, _newPassword: string) => {
    return users.has(id);
  },

  getAdminUserCollection: async (userId: string) => {
    return Array.from(collection.values())
      .filter((c) => c.userId === userId)
      .map((c) => ({ id: c.id, cardId: c.cardId, language: c.language, quantity: c.quantity, addedAt: c.addedAt.toISOString() }));
  },

  removeAdminCollectionEntry: async (userId: string, entryId: string) => {
    const entry = collection.get(entryId);
    if (!entry || entry.userId !== userId) return false;
    collection.delete(entryId);
    return true;
  },

  getAdminUserChase: async (userId: string) => {
    return Array.from(chaseCards.values())
      .filter((c) => c.userId === userId)
      .map((c) => ({ id: c.id, cardId: c.cardId, cardSnapshot: c.cardSnapshot, addedAt: c.addedAt.toISOString() }));
  },

  removeAdminChaseEntry: async (userId: string, entryId: string) => {
    const entry = chaseCards.get(entryId);
    if (!entry || entry.userId !== userId) return false;
    chaseCards.delete(entryId);
    return true;
  },

  getAdminCacheStats: async () => ({
    total: cache.size,
    entries: Array.from(cache.values()).map((c) => ({ cardId: c.cardId, fetchedAt: c.fetchedAt.toISOString() }))
  }),

  flushAdminCache: async () => {
    const count = cache.size;
    cache.clear();
    return count;
  },

  flushAdminCacheEntry: async (cardId: string) => {
    if (!cache.has(cardId)) return false;
    cache.delete(cardId);
    return true;
  }
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(overrides: Partial<StoredUser> = {}): StoredUser {
  const id = overrides.id ?? `user-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    email: `${id}@test.com`,
    passwordHash: "hash",
    displayName: null,
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

function adminCookie(user: { id: string; email: string; displayName: string | null }): string {
  const token = createJwtForUser(user);
  return `pokehub_session=${token}`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("admin routes", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  beforeEach(() => {
    users.clear();
    collection.clear();
    chaseCards.clear();
    cache.clear();
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  // -------------------------------------------------------------------------
  // Auth guards
  // -------------------------------------------------------------------------

  describe("auth guards", () => {
    it("returns 401 when no cookie is provided", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const res = await app.request("/api/admin/stats");
      expect(res.status).toBe(401);
    });

    it("returns 403 when user is not admin", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const normalUser = makeUser({ id: "user-normal", isAdmin: false });
      users.set(normalUser.id, normalUser);

      const res = await app.request("/api/admin/stats", {
        headers: { Cookie: adminCookie({ id: normalUser.id, email: normalUser.email, displayName: null }) }
      });
      expect(res.status).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------

  describe("GET /api/admin/stats", () => {
    it("returns platform stats for admin users", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);
      const regular = makeUser({ id: "user-2", isAdmin: false });
      users.set(regular.id, regular);

      const res = await app.request("/api/admin/stats", {
        headers: { Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }) }
      });
      expect(res.status).toBe(200);
      const body = await res.json() as Record<string, unknown>;
      expect(body).toMatchObject({
        totalUsers: 2,
        totalCollectionEntries: 0,
        totalChaseCards: 0,
        totalCachedCards: 0
      });
    });
  });

  // -------------------------------------------------------------------------
  // Users
  // -------------------------------------------------------------------------

  describe("GET /api/admin/users", () => {
    it("returns paginated user list", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);
      const u2 = makeUser({ id: "user-2" });
      users.set(u2.id, u2);

      const res = await app.request("/api/admin/users?page=1&pageSize=10", {
        headers: { Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }) }
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { users: unknown[]; total: number };
      expect(body.total).toBe(2);
      expect(body.users).toHaveLength(2);
    });
  });

  describe("GET /api/admin/users/:id", () => {
    it("returns user detail", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);
      const u = makeUser({ id: "user-2", email: "u2@test.com" });
      users.set(u.id, u);

      const res = await app.request(`/api/admin/users/${u.id}`, {
        headers: { Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }) }
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { id: string; email: string };
      expect(body.id).toBe(u.id);
      expect(body.email).toBe("u2@test.com");
    });

    it("returns 404 for unknown user", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);

      const res = await app.request("/api/admin/users/not-a-real-id", {
        headers: { Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }) }
      });
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/admin/users/:id", () => {
    it("updates displayName and isAdmin flag", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);
      const u = makeUser({ id: "user-2" });
      users.set(u.id, u);

      const res = await app.request(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: {
          Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ displayName: "Ash", isAdmin: true })
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { displayName: string; isAdmin: boolean };
      expect(body.displayName).toBe("Ash");
      expect(body.isAdmin).toBe(true);
    });
  });

  describe("DELETE /api/admin/users/:id", () => {
    it("deletes a user and returns 200", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);
      const u = makeUser({ id: "user-2" });
      users.set(u.id, u);

      const res = await app.request(`/api/admin/users/${u.id}`, {
        method: "DELETE",
        headers: { Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }) }
      });
      expect(res.status).toBe(200);
      expect(users.has(u.id)).toBe(false);
    });

    it("returns 404 when user does not exist", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);

      const res = await app.request("/api/admin/users/ghost", {
        method: "DELETE",
        headers: { Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }) }
      });
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/admin/users/:id/reset-password", () => {
    it("resets password for existing user", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);
      const u = makeUser({ id: "user-2" });
      users.set(u.id, u);

      const res = await app.request(`/api/admin/users/${u.id}/reset-password`, {
        method: "POST",
        headers: {
          Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ newPassword: "NewSecure123" })
      });
      expect(res.status).toBe(200);
    });

    it("returns 400 when newPassword is missing", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);

      const res = await app.request(`/api/admin/users/${admin.id}/reset-password`, {
        method: "POST",
        headers: {
          Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // User collection management
  // -------------------------------------------------------------------------

  describe("GET /api/admin/users/:id/collection", () => {
    it("returns user collection entries", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);
      const u = makeUser({ id: "user-2" });
      users.set(u.id, u);
      collection.set("entry-1", { id: "entry-1", userId: u.id, cardId: "sv1-1", language: "en", quantity: 1, addedAt: new Date() });

      const res = await app.request(`/api/admin/users/${u.id}/collection`, {
        headers: { Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }) }
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { entries: unknown[] };
      expect(body.entries).toHaveLength(1);
    });
  });

  describe("DELETE /api/admin/users/:id/collection/:entryId", () => {
    it("removes a collection entry", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);
      const u = makeUser({ id: "user-2" });
      users.set(u.id, u);
      collection.set("entry-1", { id: "entry-1", userId: u.id, cardId: "sv1-1", language: "en", quantity: 1, addedAt: new Date() });

      const res = await app.request(`/api/admin/users/${u.id}/collection/entry-1`, {
        method: "DELETE",
        headers: { Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }) }
      });
      expect(res.status).toBe(200);
      expect(collection.has("entry-1")).toBe(false);
    });

    it("returns 404 for missing entry", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);
      const u = makeUser({ id: "user-2" });
      users.set(u.id, u);

      const res = await app.request(`/api/admin/users/${u.id}/collection/no-such-entry`, {
        method: "DELETE",
        headers: { Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }) }
      });
      expect(res.status).toBe(404);
    });
  });

  // -------------------------------------------------------------------------
  // User chase management
  // -------------------------------------------------------------------------

  describe("GET /api/admin/users/:id/chase", () => {
    it("returns user chase entries", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);
      const u = makeUser({ id: "user-2" });
      users.set(u.id, u);
      chaseCards.set("chase-1", {
        id: "chase-1", userId: u.id, cardId: "sv1-1",
        cardSnapshot: { name: "Pikachu", setName: "Base", setId: "base1", imageSmall: "" },
        addedAt: new Date()
      });

      const res = await app.request(`/api/admin/users/${u.id}/chase`, {
        headers: { Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }) }
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { entries: unknown[] };
      expect(body.entries).toHaveLength(1);
    });
  });

  describe("DELETE /api/admin/users/:id/chase/:entryId", () => {
    it("removes a chase entry", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);
      const u = makeUser({ id: "user-2" });
      users.set(u.id, u);
      chaseCards.set("chase-1", {
        id: "chase-1", userId: u.id, cardId: "sv1-1",
        cardSnapshot: { name: "Pikachu", setName: "Base", setId: "base1", imageSmall: "" },
        addedAt: new Date()
      });

      const res = await app.request(`/api/admin/users/${u.id}/chase/chase-1`, {
        method: "DELETE",
        headers: { Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }) }
      });
      expect(res.status).toBe(200);
      expect(chaseCards.has("chase-1")).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Cache management
  // -------------------------------------------------------------------------

  describe("GET /api/admin/cache", () => {
    it("returns cache stats", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);
      cache.set("sv1-1", { cardId: "sv1-1", payload: {}, fetchedAt: new Date() });

      const res = await app.request("/api/admin/cache", {
        headers: { Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }) }
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { total: number };
      expect(body.total).toBe(1);
    });
  });

  describe("DELETE /api/admin/cache", () => {
    it("flushes all cache entries", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);
      cache.set("sv1-1", { cardId: "sv1-1", payload: {}, fetchedAt: new Date() });
      cache.set("sv1-2", { cardId: "sv1-2", payload: {}, fetchedAt: new Date() });

      const res = await app.request("/api/admin/cache", {
        method: "DELETE",
        headers: { Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }) }
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { deleted: number };
      expect(body.deleted).toBe(2);
      expect(cache.size).toBe(0);
    });
  });

  describe("DELETE /api/admin/cache/:cardId", () => {
    it("flushes a single cache entry", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);
      cache.set("sv1-1", { cardId: "sv1-1", payload: {}, fetchedAt: new Date() });

      const res = await app.request("/api/admin/cache/sv1-1", {
        method: "DELETE",
        headers: { Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }) }
      });
      expect(res.status).toBe(200);
      expect(cache.has("sv1-1")).toBe(false);
    });

    it("returns 404 for unknown cardId", async () => {
      const { createApp } = await import("../app");
      const app = createApp();
      const admin = makeUser({ id: "admin-1", isAdmin: true });
      users.set(admin.id, admin);

      const res = await app.request("/api/admin/cache/unknown-card", {
        method: "DELETE",
        headers: { Cookie: adminCookie({ id: admin.id, email: admin.email, displayName: null }) }
      });
      expect(res.status).toBe(404);
    });
  });
});
