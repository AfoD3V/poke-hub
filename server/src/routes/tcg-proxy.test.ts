import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { _resetSetsCache } from "../services/tcg-proxy";

/** Must be set **before** dynamic imports that resolve auth config at load time. */
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

describe("tcg-proxy routes", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = originalFetch;
    _resetSetsCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    _resetSetsCache();
  });

  const buildApp = async () => {
    const { createApp } = await import("../app");
    return createApp();
  };

  const stubOk = (jsonBody: unknown): void => {
    globalThis.fetch = async (): Promise<Response> => {
      return new Response(JSON.stringify(jsonBody), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    };
  };

  const stubGraphQLOk = (cards: unknown[] = []): void => {
    globalThis.fetch = async (): Promise<Response> => {
      return new Response(JSON.stringify({ data: { cards } }), {
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

  // GraphQL card shape (used by searchCards)
  const tcgdexCard = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: "swsh3-136",
    name: "Charizard",
    localId: "136",
    category: "Pokemon",
    types: ["Fire"],
    image: "https://assets.tcgdex.net/en/swsh/swsh3/136",
    rarity: "Rare Holo",
    hp: 170,
    illustrator: "5ban Graphics",
    set: {
      id: "swsh3",
      name: "Darkness Ablaze",
      logo: "https://assets.tcgdex.net/en/swsh/swsh3/logo.png",
      symbol: "https://assets.tcgdex.net/en/swsh/swsh3/symbol.png"
    },
    variants: { normal: false, holo: true, reverse: true, firstEdition: false },
    ...overrides
  });

  // REST card shape (used by getCardById)
  const restCard = (overrides: Partial<Record<string, unknown>> = {}) => ({
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
      stubGraphQLOk([tcgdexCard()]);

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

  describe("GET /api/cards/by-set", () => {
    it("returns 400 when setId is missing", async () => {
      const app = await buildApp();
      const res = await app.request("/api/cards/by-set?cardNumber=112");
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({
        error: "Missing required parameters: setId and cardNumber"
      });
    });

    it("returns 400 when cardNumber is missing", async () => {
      const app = await buildApp();
      const res = await app.request("/api/cards/by-set?setId=SVN");
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({
        error: "Missing required parameters: setId and cardNumber"
      });
    });

    it("returns 400 when both params are missing", async () => {
      const app = await buildApp();
      const res = await app.request("/api/cards/by-set");
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({
        error: "Missing required parameters: setId and cardNumber"
      });
    });

    it("returns the card on success", async () => {
      stubOk(tcgdexCard({ id: "svn-112", name: "Pikachu", localId: "112" }));

      const app = await buildApp();
      const res = await app.request("/api/cards/by-set?setId=SVN&cardNumber=112");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe("svn-112");
      expect(body.name).toBe("Pikachu");
    });

    it("returns 404 when card is not found upstream", async () => {
      globalThis.fetch = async (): Promise<Response> =>
        new Response(JSON.stringify({ message: "Not Found" }), { status: 404 });

      const app = await buildApp();
      const res = await app.request("/api/cards/by-set?setId=SVN&cardNumber=999");
      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toEqual({ error: "Card not found" });
    });

    it("returns 502 on upstream failure", async () => {
      stubUpstreamError(500);
      const app = await buildApp();
      const res = await app.request("/api/cards/by-set?setId=SVN&cardNumber=112");
      expect(res.status).toBe(502);
      await expect(res.json()).resolves.toHaveProperty("error");
    });
  });

  describe("GET /api/sets", () => {
    const tcgdexSet = (overrides: Partial<Record<string, unknown>> = {}) => ({
      id: "sv03.5",
      name: "151",
      abbreviation: { official: "MEW" },
      releaseDate: "2023-09-22",
      cardCount: { official: 165 },
      ...overrides
    });

    const stubSetsOk = (sets: unknown[] = []): void => {
      globalThis.fetch = async (): Promise<Response> => {
        return new Response(JSON.stringify({ data: { sets } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      };
    };

    it("returns 200 with array of sets", async () => {
      stubSetsOk([tcgdexSet()]);

      const app = await buildApp();
      const res = await app.request("/api/sets");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe("sv03.5");
      expect(body[0].name).toBe("151");
      expect(body[0].abbreviation).toBe("MEW");
    });

    it("returns 502 when upstream fails", async () => {
      stubUpstreamError(500);
      const app = await buildApp();
      const res = await app.request("/api/sets");
      expect(res.status).toBe(502);
      await expect(res.json()).resolves.toHaveProperty("error");
    });

    it("second call within TTL makes only one upstream request", async () => {
      let fetchCount = 0;
      globalThis.fetch = async (): Promise<Response> => {
        fetchCount++;
        return new Response(JSON.stringify({ data: { sets: [tcgdexSet()] } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      };

      const app = await buildApp();
      await app.request("/api/sets");
      await app.request("/api/sets");
      expect(fetchCount).toBe(1);
    });
  });

  describe("GET /api/cards/:id", () => {
    it("returns card by id", async () => {
      stubOk(restCard({ id: "base1-58", name: "Pikachu", localId: "58" }));

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
