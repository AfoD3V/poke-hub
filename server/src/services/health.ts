export type HealthStatus = {
  ok: boolean;
  database: "up" | "down";
};

const defaultHealthQuery = async (): Promise<void> => {
  const { db } = await import("../db/client");
  const { users } = await import("../db/schema");
  await db.select({ id: users.id }).from(users).limit(1);
};

/**
 * Checks database connectivity by running a minimal query.
 */
export async function checkDatabaseConnection(
  query: () => Promise<unknown> = defaultHealthQuery
): Promise<boolean> {
  try {
    await query();
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the current health status for the API and database.
 */
export async function getHealthStatus(
  query: () => Promise<unknown> = defaultHealthQuery
): Promise<HealthStatus> {
  const databaseOk = await checkDatabaseConnection(query);

  return {
    ok: databaseOk,
    database: databaseOk ? "up" : "down"
  };
}
