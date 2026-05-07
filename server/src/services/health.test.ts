import { describe, expect, it } from "bun:test";
import { checkDatabaseConnection, getHealthStatus } from "./health";

describe("health service", () => {
  it("returns database down when query fails", async () => {
    const status = await getHealthStatus(() => {
      throw new Error("db down");
    });

    expect(status).toEqual({
      ok: false,
      database: "down"
    });
  });

  it("returns database up when query succeeds", async () => {
    const status = await getHealthStatus(async () => undefined);

    expect(status).toEqual({
      ok: true,
      database: "up"
    });
  });

  it("reports connectivity from check helper", async () => {
    const ok = await checkDatabaseConnection(async () => undefined);

    expect(ok).toBe(true);
  });
});
