import { getEnvVar } from "./env";

export const authConfig = {
  jwtSecret: getEnvVar("JWT_SECRET"),
  jwtIssuer: "pokehub",
  jwtAudience: "pokehub-client",
  jwtExpiresInSeconds: 60 * 60 * 24 * 7,
  cookieName: "pokehub_session"
};
