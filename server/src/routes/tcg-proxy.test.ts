import { afterEach, beforeEach, describe, expect, it } from "bun:test";

/** Must be set **before** dynamic imports that resolve auth config at load time. */
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

describe("tcg-proxy routes", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const buildApp = async () => {
    const { createApp } = await import("../app");
    return createApp();
  };

  const stubOk = (jsonBody: unknown = []): void => {
    globalThis.fetch = async (): Promise<Response> => {
      return new Response(JSON.stringify(jsonBody), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    };
  };

  const stubUpstreamError = (status: number, json: unknown = { error: "fail" }): void => {
    globalThis.fetch = async (): Promise<Response> => {
      return new Response(JSON.stringify(json), {
        status,
        headers: { "Content-Type": "application/json" }
      });
    };
  };

  const stubNetworkError = (): void => {
    globalThis.fetch = async (): Promise<Response> => {
      throw new Error("Network error");
    };
  };

  const tcgdexCard = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: "swsh3-136",
    name: "Charizard",
    localId: "136",
    category: "Pokemon",
    types: ["Fire"],
    image: "https://assets.tcgdex.net/en/swsh/swsh3/136",
    set: {
      id: "swsh3",
      name: "Darkness Ablaze",
      serie: { id: "swsh", name: "Sword & Shield" },
      cardCount: { official: 189, total: 201 },
      releaseDate: "2020-08-14"
    },
    rarity: "Rare Holo",
    illustrator: "5ban Graphics",
    hp: 170,
    ...overrides
  });

  describe("GET /api/cards/search", () => {
    it("returns 400 when 'q' query parameter is missing", async () => {
      const app = await buildApp();
      const res = await app.request("/api/cards/search");
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: "Missing search query parameter 'q'" });
    });

    it("returns 400 when 'q' is blank", async () => {
      const app = await buildApp();
      const res = await app.request("/api/cards/search?q=   ");
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: "Missing search query parameter 'q'" });
    });

    it("proxies search and returns cards", async () => {
      stubOk([tcgdexCard()]);

      const app = await buildApp();
      const res = await app.request("/api/cards/search?q=Charizard");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.cards).toHaveLength(1);
      expect(body.totalCount).toBe(1);
      expect(body.cards[0].id).toBe("swsh3-136");
    });

    it("returns 502 when upstream fails", async () => {
      stubUpstreamError(500);
      const app = await buildApp();
      const res = await app.request("/api/cards/search?q=Pikachu");
      expect(res.status).toBe(502);
      await expect(res.json()).resolves.toHaveProperty("error");
    });

    it("returns 502 on network failure", async () => {
      stubNetworkError();
      const app = await buildApp();
      const res = await app.request("/api/cards/search?q=Pikachu");
      expect(res.status).toBe(502);
      await expect(res.json()).resolves.toHaveProperty("error");
    });
  });

  describe("GET /api/cards/:id", () => {
    it("returns card by id", async () => {
      stubOk(tcgdexCard({ id: "base1-58", name: "Pikachu", localId: "58" }));

      const app = await buildApp();
      const res = await app.request("/api/cards/base1-58");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe("base1-58");
      expect(body.name).toBe("Pikachu");
    });

    it("returns 404 when card is not found", async () => {
      globalThis.fetch = async (): Promise<Response> =>
        new Response(JSON.stringify({ message: "Not Found" }), { status: 404 });

      const app = await buildApp();
      const res = await app.request("/api/cards/unknown");
      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toEqual({ error: "Card not found" });
    });

    it("returns 502 on upstream failure", async () => {
      stubUpstreamError(503);
      const app = await buildApp();
      const res = await app.request("/api/cards/base1-58");
      expect(res.status).toBe(502);
      await expect(res.json()).resolves.toHaveProperty("error");
    });
  });
});
