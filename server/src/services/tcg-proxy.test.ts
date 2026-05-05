import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import {
  getCardById,
  searchCards,
  TcgProxyServiceError
} from "./tcg-proxy";

/**
 * Minimal upstream card record for test fixtures.
 */
const upstreamCard = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "swsh4-107",
  name: "Charizard",
  supertype: "Pokémon",
  types: ["Fire"],
  set: {
    id: "swsh4",
    name: "Vivid Voltage",
    series: "Sword & Shield",
    printedTotal: 185,
    total: 205,
    ptcgoCode: "VIV",
    releaseDate: "2020/01/01",
    updatedAt: "2020/01/01",
    images: { symbol: "", logo: "" }
  },
  number: "107",
  images: { small: "https://example.com/small.jpg", large: "https://example.com/large.jpg" },
  ...overrides
});

describe("tcg-proxy service", () => {
  const originalFetch = globalThis.fetch;
  let capturedRequest: { url: string; init: RequestInit } | undefined;

  beforeAll(() => {
    process.env.POKEMONTCG_API_KEY = "test-api-key";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    capturedRequest = undefined;
  });

  const stubOk = (jsonBody: unknown = { data: [] }): void => {
    globalThis.fetch = async (_url: RequestInfo | URL, _init: RequestInit): Promise<Response> => {
      const url = typeof _url === "string" ? _url : _url.toString();
      capturedRequest = { url, init: _init };
      return new Response(JSON.stringify(jsonBody), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    };
  };

  const stubNetworkError = (): void => {
    globalThis.fetch = async (): Promise<Response> => {
      throw new Error("Network error");
    };
  };

  const stubUpstreamError = (status: number): void => {
    globalThis.fetch = async (): Promise<Response> => {
      return new Response(JSON.stringify({ error: "fail" }), {
        status,
        headers: { "Content-Type": "application/json" }
      });
    };
  };

  describe("searchCards", () => {
    it("forwards raw query to upstream and returns mapped cards", async () => {
      stubOk({
        data: [upstreamCard()],
        totalCount: 1
      });

      const result = await searchCards("name:Charizard", 1, 20);

      expect(capturedRequest).toBeDefined();
      expect(capturedRequest?.url).toContain("https://api.pokemontcg.io/v2/cards");
      expect(capturedRequest?.url).toContain("q=name%3ACharizard");
      expect(capturedRequest?.url).toContain("page=1");
      expect(capturedRequest?.url).toContain("pageSize=20");

      expect(result.totalCount).toBe(1);
      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].id).toBe("swsh4-107");
      expect(result.cards[0].name).toBe("Charizard");
      expect(result.cards[0].images.small).toBe("https://example.com/small.jpg");
    });

    it("auto-prefixes simple keyword queries with name filter", async () => {
      stubOk({ data: [], totalCount: 0 });
      await searchCards("Pikachu");
      expect(capturedRequest?.url).toContain('q=name%3A%22Pikachu%22');
    });

    it("does not auto-prefix raw pokemontcg.io query expressions", async () => {
      stubOk({ data: [], totalCount: 0 });
      await searchCards("set:base1 supertype:Pokémon");
      expect(capturedRequest?.url).toContain("q=set%3Abase1+supertype%3APok%C3%A9mon");
      expect(capturedRequest?.url).not.toContain('name%3A');
    });

    it("sends the API key header", async () => {
      stubOk({ data: [], totalCount: 0 });
      await searchCards("Pikachu");
      expect(capturedRequest?.init.headers).toBeDefined();
      expect(JSON.stringify(capturedRequest?.init.headers)).toContain("test-api-key");
    });

    it("throws TcgProxyServiceError when upstream returns non-OK", async () => {
      stubUpstreamError(500);
      await expect(searchCards("xxx")).rejects.toThrow(TcgProxyServiceError);
    });

    it("throws TcgProxyServiceError on network failure", async () => {
      stubNetworkError();
      await expect(searchCards("xxx")).rejects.toThrow(TcgProxyServiceError);
    });

    it("throws with status 502 on bad JSON from upstream", async () => {
      globalThis.fetch = async (): Promise<Response> =>
        new Response("not json", { status: 200 });

      try {
        await searchCards("xxx");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(TcgProxyServiceError);
        expect((err as TcgProxyServiceError).statusCode).toBe(502);
      }
    });

    it("throws with status 502 when data field is missing", async () => {
      stubOk({ totalCount: 0 });
      try {
        await searchCards("xxx");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(TcgProxyServiceError);
        expect((err as TcgProxyServiceError).statusCode).toBe(502);
      }
    });
  });

  describe("getCardById", () => {
    it("returns mapped card on success", async () => {
      stubOk({ data: upstreamCard({ id: "base1-58", name: "Pikachu" }) });
      const card = await getCardById("base1-58");

      expect(card).not.toBeNull();
      expect(card?.id).toBe("base1-58");
      expect(card?.name).toBe("Pikachu");
    });

    it("returns null when upstream returns 404", async () => {
      globalThis.fetch = async (): Promise<Response> =>
        new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
      const card = await getCardById("missing");
      expect(card).toBeNull();
    });

    it("throws on upstream failure", async () => {
      stubUpstreamError(500);
      await expect(getCardById("base1-58")).rejects.toThrow(TcgProxyServiceError);
    });
  });
});
