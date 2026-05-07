import { describe, expect, it, beforeAll, afterAll } from "bun:test";

describe("auth jwt", () => {
  const originalSecret = process.env.JWT_SECRET;
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it("creates and validates a token", async () => {
    const { createJwtForUser, getAuthUserFromToken } = await import("./auth-core");
    const token = createJwtForUser({
      id: "user-123",
      email: "ash@example.com",
      displayName: "Ash"
    });

    const user = getAuthUserFromToken(token);
    expect(user).not.toBeNull();
    expect(user?.id).toBe("user-123");
    expect(user?.email).toBe("ash@example.com");
    expect(user?.displayName).toBe("Ash");
  });

  it("hashes and verifies passwords", async () => {
    const { createPasswordHash, verifyPassword } = await import("./auth-core");
    const hash = createPasswordHash("Pikachu123");
    expect(verifyPassword("Pikachu123", hash)).toBe(true);
    expect(verifyPassword("WrongPass", hash)).toBe(false);
  });
});
