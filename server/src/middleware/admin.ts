import type { Context, Next } from "hono";
import { getAuthUserFromToken, parseAuthCookie } from "../services/auth-core";
import type { AuthContext } from "./auth";

/**
 * Admin middleware — extends requireAuth by also checking isAdmin in the DB.
 * Returns 401 if unauthenticated, 403 if authenticated but not an admin.
 */
export const requireAdmin = async (context: Context, next: Next): Promise<Response> => {
  const token = parseAuthCookie(context.req.header("cookie"));
  if (!token) {
    return context.json({ error: "Unauthorized" }, 401);
  }

  const user = getAuthUserFromToken(token);
  if (!user) {
    return context.json({ error: "Unauthorized" }, 401);
  }

  const { isUserAdmin } = await import("../services/admin");
  const admin = await isUserAdmin(user.id);
  if (!admin) {
    return context.json({ error: "Forbidden" }, 403);
  }

  context.set("auth", {
    userId: user.id,
    email: user.email,
    displayName: user.displayName
  } satisfies AuthContext);

  await next();
  return context.res;
};
