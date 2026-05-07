import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

type StoredUser = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
};

const usersByEmail = new Map<string, StoredUser>();
let nextId = 1;

mock.module("../services/auth-db", () => ({
  findUserByEmail: async (email: string): Promise<StoredUser | null> => {
    return usersByEmail.get(email) ?? null;
  },
  registerUser: async (email: string, password: string, displayName?: string) => {
    const { createPasswordHash } = await import("../services/auth-core");
    const user: StoredUser = {
      id: `user-${nextId++}`,
      email,
      passwordHash: createPasswordHash(password),
      displayName: displayName ?? null
    };
    usersByEmail.set(email, user);
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName
    };
  }
}));
describe("auth routes", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  beforeEach(() => {
    usersByEmail.clear();
    nextId = 1;
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it("returns 401 when session cookie is missing", async () => {
    const { createApp } = await import("../app");
    const app = createApp();
    const response = await app.request("/auth/session", { method: "GET" });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns session when cookie is valid", async () => {
    const { createApp } = await import("../app");
    const { createJwtForUser } = await import("../services/auth-core");
    const app = createApp();
    const token = createJwtForUser({
      id: "user-123",
      email: "ash@example.com",
      displayName: "Ash"
    });
    const response = await app.request("/auth/session", {
      method: "GET",
      headers: {
        Cookie: `pokehub_session=${token}`
      }
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      user: {
        id: "user-123",
        email: "ash@example.com",
        displayName: "Ash"
      }
    });
  });

  it("registers a user and sets a cookie", async () => {
    const { createApp } = await import("../app");
    const app = createApp();
    const response = await app.request("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "misty@example.com",
        password: "Psyduck123",
        displayName: "Misty"
      })
    });

    expect(response.status).toBe(201);
    expect(response.headers.get("set-cookie")).toContain("pokehub_session=");
    await expect(response.json()).resolves.toEqual({
      user: {
        id: "user-1",
        email: "misty@example.com",
        displayName: "Misty"
      }
    });
  });

  it("rejects login with invalid credentials", async () => {
    const { createApp } = await import("../app");
    const app = createApp();
    const response = await app.request("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "misty@example.com",
        password: "WrongPass"
      })
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Invalid credentials" });
  });

  it("logs in and sets a cookie", async () => {
    const { createApp } = await import("../app");
    const app = createApp();
    await app.request("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "misty@example.com",
        password: "Psyduck123",
        displayName: "Misty"
      })
    });

    const response = await app.request("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "misty@example.com",
        password: "Psyduck123"
      })
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("pokehub_session=");
    await expect(response.json()).resolves.toEqual({
      user: {
        id: "user-1",
        email: "misty@example.com",
        displayName: "Misty"
      }
    });
  });

  it("clears the cookie on logout", async () => {
    const { createApp } = await import("../app");
    const app = createApp();
    const response = await app.request("/auth/logout", { method: "POST" });

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
