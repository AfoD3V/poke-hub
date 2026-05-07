import crypto from "node:crypto";
import { authConfig } from "../config/auth";
import type { AuthUser } from "../../../shared/auth";

type JwtPayload = {
  sub: string;
  email: string;
  displayName: string | null;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
};

const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_BYTES = 32;
const PASSWORD_ITERATIONS = 210000;
const PASSWORD_DIGEST = "sha256";

const base64UrlEncode = (input: Buffer): string =>
  input
    .toString("base64")
    .replace(/=+$/u, "")
    .replace(/\+/gu, "-")
    .replace(/\//gu, "_");

const base64UrlDecode = (input: string): Buffer => {
  const padded = input.replace(/-/gu, "+").replace(/_/gu, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return Buffer.from(`${padded}${"=".repeat(padLength)}`, "base64");
};

const encodeJson = (value: object): string =>
  base64UrlEncode(Buffer.from(JSON.stringify(value), "utf8"));

const timingSafeEquals = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const signJwt = (payload: Omit<JwtPayload, "iss" | "aud" | "iat" | "exp">): string => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const body: JwtPayload = {
    ...payload,
    iss: authConfig.jwtIssuer,
    aud: authConfig.jwtAudience,
    iat: issuedAt,
    exp: issuedAt + authConfig.jwtExpiresInSeconds
  };
  const header = encodeJson({ alg: "HS256", typ: "JWT" });
  const payloadEncoded = encodeJson(body);
  const data = `${header}.${payloadEncoded}`;
  const signature = base64UrlEncode(
    crypto.createHmac("sha256", authConfig.jwtSecret).update(data).digest()
  );
  return `${data}.${signature}`;
};

const verifyJwt = (token: string): JwtPayload | null => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [header, payloadEncoded, signature] = parts;
  const data = `${header}.${payloadEncoded}`;
  const expected = base64UrlEncode(
    crypto.createHmac("sha256", authConfig.jwtSecret).update(data).digest()
  );
  if (!timingSafeEquals(signature, expected)) {
    return null;
  }
  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded).toString("utf8")) as JwtPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.iss !== authConfig.jwtIssuer || payload.aud !== authConfig.jwtAudience) {
      return null;
    }
    if (payload.exp <= now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

export const serializeAuthCookie = (token: string): string => {
  const maxAge = authConfig.jwtExpiresInSeconds;
  const secureFlag = process.env.NODE_ENV === "production" ? "Secure" : null;
  const parts = [
    `${authConfig.cookieName}=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
    `Max-Age=${maxAge}`,
    secureFlag
  ].filter((part): part is string => Boolean(part));
  return parts.join("; ");
};

export const clearAuthCookie = (): string => {
  const secureFlag = process.env.NODE_ENV === "production" ? "Secure" : null;
  const parts = [
    `${authConfig.cookieName}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
    "Max-Age=0",
    secureFlag
  ].filter((part): part is string => Boolean(part));
  return parts.join("; ");
};

export const parseAuthCookie = (cookieHeader: string | undefined): string | null => {
  const headerValue = cookieHeader ?? "";
  const match = headerValue
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${authConfig.cookieName}=`));

  if (!match) {
    return null;
  }

  return match.slice(`${authConfig.cookieName}=`.length);
};

export const createPasswordHash = (password: string): string => {
  const salt = crypto.randomBytes(PASSWORD_SALT_BYTES);
  const hash = crypto.pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_BYTES, PASSWORD_DIGEST);
  return `${PASSWORD_ITERATIONS}:${salt.toString("hex")}:${hash.toString("hex")}`;
};

export const verifyPassword = (password: string, storedHash: string): boolean => {
  const [iterationsRaw, saltHex, hashHex] = storedHash.split(":");
  const iterations = Number(iterationsRaw);
  if (!iterations || !saltHex || !hashHex) {
    return false;
  }
  const salt = Buffer.from(saltHex, "hex");
  const derived = crypto.pbkdf2Sync(
    password,
    salt,
    iterations,
    Buffer.from(hashHex, "hex").length,
    PASSWORD_DIGEST
  );
  return timingSafeEquals(derived.toString("hex"), hashHex);
};

export const createJwtForUser = (user: AuthUser): string =>
  signJwt({
    sub: user.id,
    email: user.email,
    displayName: user.displayName
  });

export const getAuthUserFromToken = (token: string): AuthUser | null => {
  const payload = verifyJwt(token);
  if (!payload) {
    return null;
  }
  return {
    id: payload.sub,
    email: payload.email,
    displayName: payload.displayName
  };
};

export const getAuthUserFromCookie = (cookieHeader: string | undefined): AuthUser | null => {
  const token = parseAuthCookie(cookieHeader);
  if (!token) {
    return null;
  }
  return getAuthUserFromToken(token);
};
