import postgres from "postgres";
import { getEnvVar } from "../config/env";
import { broadcast } from "./ws-broadcast";

/**
 * Opens a dedicated Postgres connection for LISTEN/NOTIFY.
 * This connection must NOT be shared with Drizzle — once a connection
 * enters LISTEN mode it cannot be used for regular queries.
 */
export async function startPgListener(): Promise<void> {
  const sql = postgres(getEnvVar("DATABASE_URL"), { max: 1 });

  await sql.listen("collection_insert", (rawPayload) => {
    try {
      const data = JSON.parse(rawPayload) as unknown;
      broadcast({ type: "card_added", data });
    } catch {
      // ignore malformed notification payloads
    }
  });

  console.log("Postgres LISTEN active on channel: collection_insert");
}
