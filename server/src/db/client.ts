import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { getEnvVar } from "../config/env";
import * as schema from "./schema";

const connectionString = getEnvVar("DATABASE_URL");

export const sql = postgres(connectionString, {
  max: 1
});

export const db = drizzle(sql, {
  schema
});
