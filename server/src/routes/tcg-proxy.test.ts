import { afterEach, beforeEach, describe, expect, it } from "bun:test";

/** Must be set **before** dynamic imports that resolve auth config at load time. */
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

describe("tcg-proxy routes", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.POKEMONTCG_API_KEY = "test-key";
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const buildApp = async () => {
    const { createApp } = await import("../app");
    return createApp();
  };

  const stubOk = (jsonBody: unknown = { data: [] }): void => {
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
      stubOk({
        data: [
          {
            id: "swsh4-107",
            name: "Charizard",
            supertype: "Pokémon",
            types: ["Fire"],
            set: "Vivid Voltage",
            number: "107",
            images: { small: "https://example.com/small.jpg", large: "https://example.com/large.jpg" }
          }
        ],
        totalCount: 1
      });

      const app = await buildApp();
      const res = await app.request("/api/cards/search?q=name:Charizard");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.cards).toHaveLength(1);
      expect(body.totalCount).toBe(1);
      expect(body.cards[0].id).toBe("swsh4-107");
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
      stubOk({
        data: {
          id: "base1-58",
          name: "Pikachu",
          supertype: "Pokémon",
          set: "Base",
          number: "58",
          images: { small: "https://example.com/s.jpg", large: "https://example.com/l.jpg" }
        }
      });

      const app = await buildApp();
      const res = await app.request("/api/cards/base1-58");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe("base1-58");
      expect(body.name).toBe("Pikachu");
    });

    it("returns 404 when card is not found", async () => {
      globalThis.fetch = async (): Promise<Response> =>
        new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });

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
