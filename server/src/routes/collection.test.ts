import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { createJwtForUser } from "../services/auth-core";

// ── Mocks ────────────────────────────────────────────────────────────────────
// Registered before any dynamic import of the service can resolve.

const mockEntry = {
  id: "entry-uuid-1",
  cardId: "swsh1-1",
  language: "en",
  quantity: 1,
  addedAt: new Date("2024-01-01T00:00:00Z")
};

const mockCollectionEntry = {
  ...mockEntry,
  addedAt: "2024-01-01T00:00:00.000Z",
  card: { id: "swsh1-1", name: "Celebi V", supertype: "Pokémon", set: "SWSH01", number: "1", images: { small: "", large: "" } }
};

const mockAddCard = mock(() => Promise.resolve(mockEntry));
const mockRemoveCard = mock(() => Promise.resolve(true));
const mockGetCollection = mock(() => Promise.resolve([mockCollectionEntry]));

mock.module("../services/collection", () => ({
  addCardToCollection: mockAddCard,
  removeCardFromCollection: mockRemoveCard,
  getUserCollection: mockGetCollection
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const SESSION_COOKIE = "pokehub_session";

function validToken() {
  return createJwtForUser({ id: "user-1", email: "ash@example.com", displayName: "Ash" });
}

function authHeaders(token = validToken()) {
  return { Cookie: `${SESSION_COOKIE}=${token}` };
}

async function buildApp(): Promise<Hono> {
  const { createApp } = await import("../app");
  return createApp();
}

// ── Auth middleware (backward-compatible with original tests) ─────────────────

describe("collection routes — auth middleware", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  const buildRaw = (): Hono => {
    const app = new Hono();
    app.use("/api/collection/*", requireAuth);
    app.get("/api/collection/test", (c) => c.json({ ok: true }, 200));
    return app;
  };

  it("rejects requests without a session cookie", async () => {
    const app = buildRaw();
    const res = await app.request("/api/collection/test", { method: "GET" });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects requests with an invalid session cookie", async () => {
    const app = buildRaw();
    const res = await app.request("/api/collection/test", {
      method: "GET",
      headers: { Cookie: `${SESSION_COOKIE}=invalid` }
    });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("allows requests with a valid session cookie", async () => {
    const app = buildRaw();
    const token = createJwtForUser({ id: "user-777", email: "brock@example.com", displayName: "Brock" });
    const res = await app.request("/api/collection/test", {
      method: "GET",
      headers: { Cookie: `${SESSION_COOKIE}=${token}` }
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});

// ── GET /api/collection ───────────────────────────────────────────────────────

describe("GET /api/collection", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request("/api/collection", { method: "GET" });
    expect(res.status).toBe(401);
  });

  it("returns 200 with entries array for authenticated user", async () => {
    const app = await buildApp();
    const res = await app.request("/api/collection", {
      method: "GET",
      headers: authHeaders()
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { entries: unknown[] };
    expect(Array.isArray(body.entries)).toBe(true);
  });
});

// ── POST /api/collection/add ──────────────────────────────────────────────────

describe("POST /api/collection/add", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  const minimalCard = {
    id: "swsh1-1",
    name: "Celebi V",
    supertype: "Pokémon",
    set: "SWSH01",
    number: "1",
    images: { small: "", large: "" }
  };

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request("/api/collection/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: "swsh1-1", card: minimalCard })
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when cardId is missing", async () => {
    const app = await buildApp();
    const res = await app.request("/api/collection/add", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ card: minimalCard })
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: expect.any(String) });
  });

  it("returns 400 when card payload is missing", async () => {
    const app = await buildApp();
    const res = await app.request("/api/collection/add", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ cardId: "swsh1-1" })
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: expect.any(String) });
  });

  it("returns 400 for non-JSON body", async () => {
    const app = await buildApp();
    const res = await app.request("/api/collection/add", {
      method: "POST",
      headers: { "Content-Type": "text/plain", ...authHeaders() },
      body: "not json"
    });
    expect(res.status).toBe(400);
  });

  it("returns 201 with the new entry on valid request", async () => {
    const app = await buildApp();
    const res = await app.request("/api/collection/add", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ cardId: "swsh1-1", card: minimalCard, language: "en", quantity: 1 })
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { cardId: string };
    expect(body.cardId).toBe("swsh1-1");
  });
});

// ── DELETE /api/collection/remove ────────────────────────────────────────────

describe("DELETE /api/collection/remove", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request("/api/collection/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: "swsh1-1" })
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when cardId is missing", async () => {
    const app = await buildApp();
    const res = await app.request("/api/collection/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({})
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: expect.any(String) });
  });

  it("returns 404 when card is not in collection", async () => {
    mockRemoveCard.mockImplementationOnce(() => Promise.resolve(false));
    const app = await buildApp();
    const res = await app.request("/api/collection/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ cardId: "does-not-exist" })
    });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Card not found in collection" });
  });

  it("returns 200 when card is successfully removed", async () => {
    const app = await buildApp();
    const res = await app.request("/api/collection/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ cardId: "swsh1-1" })
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});
