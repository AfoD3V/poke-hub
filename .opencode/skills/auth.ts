import { Hono } from "hono";
import { clearAuthCookie, createJwtForUser, getAuthUserFromCookie, serializeAuthCookie, verifyPassword } from "../services/auth-core";
import type { AuthLoginRequest, AuthRegisterRequest, AuthSessionResponse } from "../../../shared/auth";

const MIN_PASSWORD_LENGTH = 8;

const parseRequestBody = async <T>(context: { req: { json: () => Promise<T> } }): Promise<T | null> => {
  try {
    return await context.req.json();
  } catch {
    return null;
  }
};

export function registerAuthRoutes(app: Hono): void {
  app.post("/auth/register", async (context) => {
    const { findUserByEmail, registerUser } = await import("../services/auth-db");
    const body = (await parseRequestBody<AuthRegisterRequest>(context));
    if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
      return context.json({ error: "Invalid request" }, 400);
    }
    const email = body.email.trim().toLowerCase();
    const password = body.password.trim();
    if (!email || !email.includes("@") || password.length < MIN_PASSWORD_LENGTH) {
      return context.json({ error: "Invalid request" }, 400);
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return context.json({ error: "Email already registered" }, 409);
    }

    const displayName = body.displayName?.trim();
    const user = await registerUser(email, password, displayName || undefined);
    const token = createJwtForUser(user);

    context.header("Set-Cookie", serializeAuthCookie(token));
    const response: AuthSessionResponse = { user };
    return context.json(response, 201);
  });

  app.post("/auth/login", async (context) => {
    const { findUserByEmail } = await import("../services/auth-db");
    const body = (await parseRequestBody<AuthLoginRequest>(context));
    if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
      return context.json({ error: "Invalid request" }, 400);
    }
    const email = body.email.trim().toLowerCase();
    const password = body.password.trim();
    if (!email || !email.includes("@") || password.length === 0) {
      return context.json({ error: "Invalid request" }, 400);
    }

    const record = await findUserByEmail(email);
    if (!record || !verifyPassword(password, record.passwordHash)) {
      return context.json({ error: "Invalid credentials" }, 401);
    }

    const token = createJwtForUser({
      id: record.id,
      email: record.email,
      displayName: record.displayName
    });
    context.header("Set-Cookie", serializeAuthCookie(token));
    const response: AuthSessionResponse = {
      user: {
        id: record.id,
        email: record.email,
        displayName: record.displayName
      }
    };
    return context.json(response, 200);
  });

  app.get("/auth/session", (context) => {
    const user = getAuthUserFromCookie(context.req.header("cookie"));
    if (!user) {
      return context.json({ error: "Unauthorized" }, 401);
    }
    const response: AuthSessionResponse = { user };
    return context.json(response, 200);
  });

  app.post("/auth/logout", (context) => {
    context.header("Set-Cookie", clearAuthCookie());
    return context.json({ ok: true }, 200);
  });
}
