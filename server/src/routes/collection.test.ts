import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { createJwtForUser } from "../services/auth-core";

describe("collection routes", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  const buildApp = (): Hono => {
    const app = new Hono();
    app.use("/api/collection/*", requireAuth);
    app.get("/api/collection/test", (context) => context.json({ ok: true }, 200));
    return app;
  };

  it("rejects requests without a session cookie", async () => {
    const app = buildApp();
    const response = await app.request("/api/collection/test", { method: "GET" });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects requests with an invalid session cookie", async () => {
    const app = buildApp();
    const response = await app.request("/api/collection/test", {
      method: "GET",
      headers: {
        Cookie: "pokehub_session=invalid"
      }
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("allows requests with a valid session cookie", async () => {
    const app = buildApp();
    const token = createJwtForUser({
      id: "user-777",
      email: "brock@example.com",
      displayName: "Brock"
    });
    const response = await app.request("/api/collection/test", {
      method: "GET",
      headers: {
        Cookie: `pokehub_session=${token}`
      }
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
