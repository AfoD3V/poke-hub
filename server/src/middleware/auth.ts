import type { Context, Next } from "hono";
import { authConfig } from "../config/auth";
import { getAuthUserFromToken, parseAuthCookie } from "../services/auth-core";

export type AuthContext = {
  userId: string;
  email: string;
  displayName: string | null;
};

export const requireAuth = async (context: Context, next: Next): Promise<Response> => {
  const { authConfig } = await import("../config/auth");
  const token = parseAuthCookie(context.req.header("cookie"));
  if (!token) {
    return context.json({ error: "Unauthorized" }, 401);
  }
  const user = getAuthUserFromToken(token);
  if (!user) {
    return context.json({ error: "Unauthorized" }, 401);
  }

  context.set("auth", {
    userId: user.id,
    email: user.email,
    displayName: user.displayName
  } satisfies AuthContext);

  await next();
  return context.res;
};
