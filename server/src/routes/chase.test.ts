import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { createJwtForUser } from "../services/auth-core";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockSnapshot = {
  name: "Bulbasaur",
  setName: "Base Set",
  setId: "base1",
  imageSmall: "https://example.com/small.jpg"
};

const mockChaseEntry = {
  id: "chase-uuid-1",
  userId: "user-1",
  cardId: "sv1-001",
  cardSnapshot: mockSnapshot,
  addedAt: "2024-01-01T00:00:00.000Z"
};

const mockListChase = mock(() => Promise.resolve([mockChaseEntry]));
const mockAddChase = mock(() => Promise.resolve(mockChaseEntry));
const mockRemoveChase = mock(() => Promise.resolve(true));

mock.module("../services/chaseService", () => ({
  listChase: mockListChase,
  addChase: mockAddChase,
  removeChase: mockRemoveChase
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const SESSION_COOKIE = "pokehub_session";

function validToken() {
  return createJwtForUser({ id: "user-1", email: "ash@example.com", displayName: "Ash" });
}

function authHeaders(token = validToken()) {
  return { Cookie: `${SESSION_COOKIE}=${token}` };
}

async function buildApp() {
  const { createApp } = await import("../app");
  return createApp();
}

// ── GET /api/chase ─────────────────────────────────────────────────────────────

describe("GET /api/chase", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request("/api/chase", { method: "GET" });
    expect(res.status).toBe(401);
  });

  it("returns 200 with entries array for authenticated user", async () => {
    const app = await buildApp();
    const res = await app.request("/api/chase", {
      method: "GET",
      headers: authHeaders()
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { entries: unknown[] };
    expect(Array.isArray(body.entries)).toBe(true);
  });
});

// ── POST /api/chase/add ────────────────────────────────────────────────────────

describe("POST /api/chase/add", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request("/api/chase/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: "sv1-001", cardSnapshot: mockSnapshot })
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when cardId is missing", async () => {
    const app = await buildApp();
    const res = await app.request("/api/chase/add", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ cardSnapshot: mockSnapshot })
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: expect.any(String) });
  });

  it("returns 400 when cardSnapshot is missing", async () => {
    const app = await buildApp();
    const res = await app.request("/api/chase/add", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ cardId: "sv1-001" })
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: expect.any(String) });
  });

  it("returns 201 with entry on valid request", async () => {
    const app = await buildApp();
    const res = await app.request("/api/chase/add", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ cardId: "sv1-001", cardSnapshot: mockSnapshot })
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { entry: { cardId: string } };
    expect(body.entry.cardId).toBe("sv1-001");
  });

  it("returns 201 on duplicate add (idempotent upsert)", async () => {
    const app = await buildApp();
    const res = await app.request("/api/chase/add", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ cardId: "sv1-001", cardSnapshot: mockSnapshot })
    });
    expect(res.status).toBe(201);
  });
});

// ── DELETE /api/chase/remove ──────────────────────────────────────────────────

describe("DELETE /api/chase/remove", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request("/api/chase/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: "sv1-001" })
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when cardId is missing", async () => {
    const app = await buildApp();
    const res = await app.request("/api/chase/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({})
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: expect.any(String) });
  });

  it("returns 404 when card is not in chase list", async () => {
    mockRemoveChase.mockImplementationOnce(() => Promise.resolve(false));
    const app = await buildApp();
    const res = await app.request("/api/chase/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ cardId: "does-not-exist" })
    });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Not found" });
  });

  it("returns 200 when card is successfully removed", async () => {
    const app = await buildApp();
    const res = await app.request("/api/chase/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ cardId: "sv1-001" })
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
  });
});
