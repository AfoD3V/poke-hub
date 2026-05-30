import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { createJwtForUser } from "../services/auth-core";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockCardSnapshot = {
  name: "Bulbasaur",
  imageSmall: "https://example.com/small.jpg",
  setName: "Mew",
  setId: "mew",
  setCode: "MEW",
  rarity: "Special Illustration Rare"
};

const mockSlot = {
  id: "slot-uuid-1",
  pageId: "page-uuid-1",
  slotIndex: 0,
  cardId: "sv3pt5-001",
  cardSnapshot: mockCardSnapshot,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
};

const mockPage = {
  id: "page-uuid-1",
  binderId: "binder-uuid-1",
  pageNumber: 1,
  slots: [mockSlot],
  createdAt: "2024-01-01T00:00:00.000Z"
};

const mockBinder = {
  id: "binder-uuid-1",
  userId: "user-1",
  name: "Pokedex",
  icon: "book-open",
  gridCols: 4,
  gridRows: 4,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  pages: [mockPage]
};

const mockBinderListItem = {
  id: "binder-uuid-1",
  name: "Pokedex",
  icon: "book-open",
  gridCols: 4,
  gridRows: 4,
  pageCount: 2,
  filledSlots: 1,
  totalSlots: 32,
  estimatedValue: 96.59,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
};

const mockCreateBinder = mock(() => Promise.resolve(mockBinder));
const mockListBinders = mock(() => Promise.resolve([mockBinderListItem]));
const mockGetBinderById = mock(() => Promise.resolve(mockBinder));
const mockUpdateBinder = mock(() => Promise.resolve(mockBinder));
const mockDeleteBinder = mock(() => Promise.resolve(true));
const mockAddPage = mock(() => Promise.resolve(mockPage));
const mockRemovePage = mock(() => Promise.resolve(true));
const mockPlaceCard = mock(() => Promise.resolve(mockSlot));
const mockClearSlot = mock(() => Promise.resolve(true));
const mockMoveCard = mock(() => Promise.resolve(true));
const mockCopyCard = mock(() => Promise.resolve(mockSlot));

mock.module("../services/binderService", () => ({
  createBinder: mockCreateBinder,
  listBinders: mockListBinders,
  getBinderById: mockGetBinderById,
  updateBinder: mockUpdateBinder,
  deleteBinder: mockDeleteBinder,
  addPage: mockAddPage,
  removePage: mockRemovePage,
  placeCard: mockPlaceCard,
  clearSlot: mockClearSlot,
  moveCard: mockMoveCard,
  copyCard: mockCopyCard
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const SESSION_COOKIE = "pokehub_session";

function validToken(userId = "user-1") {
  return createJwtForUser({ id: userId, email: "ash@example.com", displayName: "Ash" });
}

function authHeaders(userId = "user-1") {
  return { Cookie: `${SESSION_COOKIE}=${validToken(userId)}` };
}

async function buildApp() {
  const { createApp } = await import("../app");
  return createApp();
}

// ── GET /api/binders ─────────────────────────────────────────────────────────

describe("GET /api/binders", () => {
  const originalSecret = process.env.JWT_SECRET;
  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders", { method: "GET" });
    expect(res.status).toBe(401);
  });

  it("returns 200 with binder list for authenticated user", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders", {
      method: "GET",
      headers: authHeaders()
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { binders: unknown[] };
    expect(Array.isArray(body.binders)).toBe(true);
  });

  it("binder list items include stats fields", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders", {
      method: "GET",
      headers: authHeaders()
    });
    const body = await res.json() as { binders: typeof mockBinderListItem[] };
    const item = body.binders[0];
    expect(item).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      pageCount: expect.any(Number),
      filledSlots: expect.any(Number),
      totalSlots: expect.any(Number),
      estimatedValue: expect.any(Number)
    });
  });
});

// ── POST /api/binders ────────────────────────────────────────────────────────

describe("POST /api/binders", () => {
  const originalSecret = process.env.JWT_SECRET;
  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "My Binder" })
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({})
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: expect.any(String) });
  });

  it("returns 400 when name is whitespace-only", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ name: "   " })
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when grid size is invalid", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ name: "My Binder", gridCols: 11, gridRows: 5 })
    });
    expect(res.status).toBe(400);
  });

  it("returns 201 with binder on valid request", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ name: "Pokedex" })
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { binder: typeof mockBinder };
    expect(body.binder.name).toBe("Pokedex");
  });
});

// ── GET /api/binders/:id ─────────────────────────────────────────────────────

describe("GET /api/binders/:id", () => {
  const originalSecret = process.env.JWT_SECRET;
  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders/binder-uuid-1", { method: "GET" });
    expect(res.status).toBe(401);
  });

  it("returns 200 with binder for owner", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders/binder-uuid-1", {
      method: "GET",
      headers: authHeaders()
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { binder: typeof mockBinder };
    expect(body.binder.id).toBe("binder-uuid-1");
    expect(Array.isArray(body.binder.pages)).toBe(true);
  });

  it("returns 404 when binder belongs to different user", async () => {
    mockGetBinderById.mockImplementationOnce(() => Promise.resolve(null));
    const app = await buildApp();
    const res = await app.request("/api/binders/other-binder", {
      method: "GET",
      headers: authHeaders("user-2")
    });
    expect(res.status).toBe(404);
  });
});

// ── PATCH /api/binders/:id ───────────────────────────────────────────────────

describe("PATCH /api/binders/:id", () => {
  const originalSecret = process.env.JWT_SECRET;
  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders/binder-uuid-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Renamed" })
    });
    expect(res.status).toBe(401);
  });

  it("returns 200 with updated binder on valid rename", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders/binder-uuid-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ name: "Renamed Binder" })
    });
    expect(res.status).toBe(200);
  });

  it("returns 409 when grid size change would orphan slots", async () => {
    mockUpdateBinder.mockImplementationOnce(() => Promise.reject(Object.assign(new Error("slots_out_of_bounds"), { code: "SLOTS_OUT_OF_BOUNDS" })));
    const app = await buildApp();
    const res = await app.request("/api/binders/binder-uuid-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ gridCols: 3, gridRows: 3 })
    });
    expect(res.status).toBe(409);
  });

  it("returns 404 when binder not found", async () => {
    mockUpdateBinder.mockImplementationOnce(() => Promise.resolve(null));
    const app = await buildApp();
    const res = await app.request("/api/binders/does-not-exist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ name: "X" })
    });
    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/binders/:id ──────────────────────────────────────────────────

describe("DELETE /api/binders/:id", () => {
  const originalSecret = process.env.JWT_SECRET;
  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders/binder-uuid-1", { method: "DELETE" });
    expect(res.status).toBe(401);
  });

  it("returns 200 on successful delete", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders/binder-uuid-1", {
      method: "DELETE",
      headers: authHeaders()
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
  });

  it("returns 404 when binder not found or belongs to other user", async () => {
    mockDeleteBinder.mockImplementationOnce(() => Promise.resolve(false));
    const app = await buildApp();
    const res = await app.request("/api/binders/other-binder", {
      method: "DELETE",
      headers: authHeaders("user-2")
    });
    expect(res.status).toBe(404);
  });
});

// ── POST /api/binders/:id/pages ──────────────────────────────────────────────

describe("POST /api/binders/:id/pages", () => {
  const originalSecret = process.env.JWT_SECRET;
  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders/binder-uuid-1/pages", { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("returns 201 with new page", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders/binder-uuid-1/pages", {
      method: "POST",
      headers: authHeaders()
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { page: typeof mockPage };
    expect(body.page.binderId).toBe("binder-uuid-1");
  });

  it("returns 404 when binder not found", async () => {
    mockAddPage.mockImplementationOnce(() => Promise.resolve(null));
    const app = await buildApp();
    const res = await app.request("/api/binders/does-not-exist/pages", {
      method: "POST",
      headers: authHeaders()
    });
    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/binders/:id/pages/:pageId ───────────────────────────────────

describe("DELETE /api/binders/:id/pages/:pageId", () => {
  const originalSecret = process.env.JWT_SECRET;
  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders/binder-uuid-1/pages/page-uuid-1", { method: "DELETE" });
    expect(res.status).toBe(401);
  });

  it("returns 200 on successful page removal", async () => {
    const app = await buildApp();
    const res = await app.request("/api/binders/binder-uuid-1/pages/page-uuid-1", {
      method: "DELETE",
      headers: authHeaders()
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
  });

  it("returns 404 when page not found", async () => {
    mockRemovePage.mockImplementationOnce(() => Promise.resolve(false));
    const app = await buildApp();
    const res = await app.request("/api/binders/binder-uuid-1/pages/does-not-exist", {
      method: "DELETE",
      headers: authHeaders()
    });
    expect(res.status).toBe(404);
  });

  it("returns 409 when page has occupied slots", async () => {
    mockRemovePage.mockImplementationOnce(() => Promise.reject(Object.assign(new Error("page_has_slots"), { code: "PAGE_HAS_SLOTS" })));
    const app = await buildApp();
    const res = await app.request("/api/binders/binder-uuid-1/pages/page-uuid-1", {
      method: "DELETE",
      headers: authHeaders()
    });
    expect(res.status).toBe(409);
  });
});

// ── PUT /api/binders/:id/pages/:pageId/slots/:slotIndex ─────────────────────

describe("PUT /api/binders/:id/pages/:pageId/slots/:slotIndex", () => {
  const originalSecret = process.env.JWT_SECRET;
  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  const slotUrl = "/api/binders/binder-uuid-1/pages/page-uuid-1/slots/0";
  const validBody = { cardId: "sv3pt5-001", cardSnapshot: mockCardSnapshot };

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request(slotUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody)
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when cardId is missing", async () => {
    const app = await buildApp();
    const res = await app.request(slotUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ cardSnapshot: mockCardSnapshot })
    });
    expect(res.status).toBe(400);
  });

  it("returns 200 with placed slot", async () => {
    const app = await buildApp();
    const res = await app.request(slotUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(validBody)
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { slot: typeof mockSlot };
    expect(body.slot.cardId).toBe("sv3pt5-001");
  });

  it("returns 404 when page not found or not owned", async () => {
    mockPlaceCard.mockImplementationOnce(() => Promise.resolve(null));
    const app = await buildApp();
    const res = await app.request(slotUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders("user-2") },
      body: JSON.stringify(validBody)
    });
    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/binders/:id/pages/:pageId/slots/:slotIndex ──────────────────

describe("DELETE /api/binders/:id/pages/:pageId/slots/:slotIndex", () => {
  const originalSecret = process.env.JWT_SECRET;
  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  const slotUrl = "/api/binders/binder-uuid-1/pages/page-uuid-1/slots/0";

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request(slotUrl, { method: "DELETE" });
    expect(res.status).toBe(401);
  });

  it("returns 200 on successful clear", async () => {
    const app = await buildApp();
    const res = await app.request(slotUrl, {
      method: "DELETE",
      headers: authHeaders()
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
  });

  it("returns 404 when not owned", async () => {
    mockClearSlot.mockImplementationOnce(() => Promise.resolve(false));
    const app = await buildApp();
    const res = await app.request(slotUrl, {
      method: "DELETE",
      headers: authHeaders("user-2")
    });
    expect(res.status).toBe(404);
  });
});

// ── POST /api/binders/:id/pages/:pageId/slots/:slotIndex/move ────────────────

describe("POST /api/binders/:id/pages/:pageId/slots/:slotIndex/move", () => {
  const originalSecret = process.env.JWT_SECRET;
  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  const moveUrl = "/api/binders/binder-uuid-1/pages/page-uuid-1/slots/0/move";
  const validBody = { toPageId: "page-uuid-1", toSlotIndex: 5 };

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request(moveUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody)
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when toPageId is missing", async () => {
    const app = await buildApp();
    const res = await app.request(moveUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ toSlotIndex: 5 })
    });
    expect(res.status).toBe(400);
  });

  it("returns 200 on successful move", async () => {
    const app = await buildApp();
    const res = await app.request(moveUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(validBody)
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
  });

  it("returns 404 when not owned", async () => {
    mockMoveCard.mockImplementationOnce(() => Promise.resolve(false));
    const app = await buildApp();
    const res = await app.request(moveUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders("user-2") },
      body: JSON.stringify(validBody)
    });
    expect(res.status).toBe(404);
  });
});

// ── POST /api/binders/:id/pages/:pageId/slots/:slotIndex/copy ────────────────

describe("POST /api/binders/:id/pages/:pageId/slots/:slotIndex/copy", () => {
  const originalSecret = process.env.JWT_SECRET;
  beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  const copyUrl = "/api/binders/binder-uuid-1/pages/page-uuid-1/slots/0/copy";
  const validBody = { toPageId: "page-uuid-1", toSlotIndex: 7 };

  it("returns 401 without auth", async () => {
    const app = await buildApp();
    const res = await app.request(copyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody)
    });
    expect(res.status).toBe(401);
  });

  it("returns 200 with new slot on successful copy", async () => {
    const app = await buildApp();
    const res = await app.request(copyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(validBody)
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { slot: typeof mockSlot };
    expect(body.slot).toBeDefined();
  });

  it("returns 404 when not owned", async () => {
    mockCopyCard.mockImplementationOnce(() => Promise.resolve(null));
    const app = await buildApp();
    const res = await app.request(copyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders("user-2") },
      body: JSON.stringify(validBody)
    });
    expect(res.status).toBe(404);
  });
});
