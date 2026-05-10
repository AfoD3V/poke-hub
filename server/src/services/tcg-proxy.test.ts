import { afterEach, describe, expect, it } from "bun:test";
import {
  getCardById,
  searchCards,
  TcgProxyServiceError
} from "./tcg-proxy";

/**
 * Minimal TCGdex card record for test fixtures.
 */
const upstreamCard = (overrides: Partial<Record<string, unknown>> = {}) => ({
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
    releaseDate: "2020-08-14",
    logo: "https://assets.tcgdex.net/en/swsh/swsh3/logo.png",
    symbol: "https://assets.tcgdex.net/en/swsh/swsh3/symbol.png"
  },
  rarity: "Rare Holo",
  illustrator: "5ban Graphics",
  hp: 170,
  ...overrides
});

describe("tcg-proxy service", () => {
  const originalFetch = globalThis.fetch;
  let capturedRequest: { url: string; init: RequestInit } | undefined;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    capturedRequest = undefined;
  });

  const stubOk = (jsonBody: unknown = []): void => {
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
    it("sends request to TCGdex and returns mapped cards", async () => {
      stubOk([upstreamCard()]);

      const result = await searchCards("Charizard", 1, 20);

      expect(capturedRequest).toBeDefined();
      expect(capturedRequest?.url).toContain("https://api.tcgdex.net/v2/en/cards");
      expect(capturedRequest?.url).toContain("name=Charizard");
      expect(capturedRequest?.url).toContain("pagination%3Apage=1");
      expect(capturedRequest?.url).toContain("pagination%3AitemsPerPage=20");

      expect(result.totalCount).toBe(1);
      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].id).toBe("swsh3-136");
      expect(result.cards[0].name).toBe("Charizard");
      expect(result.cards[0].images.small).toBe(
        "https://assets.tcgdex.net/en/swsh/swsh3/136/low.webp"
      );
      expect(result.cards[0].images.large).toBe(
        "https://assets.tcgdex.net/en/swsh/swsh3/136/high.webp"
      );
    });

    it("maps category to supertype", async () => {
      stubOk([upstreamCard({ category: "Trainer" })]);
      const result = await searchCards("Potion");
      expect(result.cards[0].supertype).toBe("Trainer");
    });

    it("maps illustrator to artist", async () => {
      stubOk([upstreamCard()]);
      const result = await searchCards("Charizard");
      expect(result.cards[0].artist).toBe("5ban Graphics");
    });

    it("maps localId to number", async () => {
      stubOk([upstreamCard()]);
      const result = await searchCards("Charizard");
      expect(result.cards[0].number).toBe("136");
    });

    it("maps hp as string", async () => {
      stubOk([upstreamCard({ hp: 170 })]);
      const result = await searchCards("Charizard");
      expect(result.cards[0].hp).toBe("170");
    });

    it("uses cards.length as totalCount", async () => {
      stubOk([upstreamCard(), upstreamCard({ id: "swsh3-137", name: "Charizard VMAX" })]);
      const result = await searchCards("Charizard");
      expect(result.totalCount).toBe(2);
    });

    it("does not send an API key header", async () => {
      stubOk([]);
      await searchCards("Pikachu");
      const headers = capturedRequest?.init.headers as Record<string, string> | undefined;
      expect(headers?.["X-Api-Key"]).toBeUndefined();
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

    it("throws with status 502 when response is not an array", async () => {
      stubOk({ unexpected: "object" });
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
      stubOk(upstreamCard({ id: "base1-58", name: "Pikachu", localId: "58" }));
      const card = await getCardById("base1-58");

      expect(card).not.toBeNull();
      expect(card?.id).toBe("base1-58");
      expect(card?.name).toBe("Pikachu");
      expect(card?.number).toBe("58");
    });

    it("returns null when upstream returns 404", async () => {
      globalThis.fetch = async (): Promise<Response> =>
        new Response(JSON.stringify({ message: "Not Found" }), { status: 404 });
      const card = await getCardById("missing");
      expect(card).toBeNull();
    });

    it("throws on upstream failure", async () => {
      stubUpstreamError(500);
      await expect(getCardById("swsh3-136")).rejects.toThrow(TcgProxyServiceError);
    });

    it("builds correct image URLs", async () => {
      stubOk(upstreamCard());
      const card = await getCardById("swsh3-136");
      expect(card?.images.small).toBe(
        "https://assets.tcgdex.net/en/swsh/swsh3/136/low.webp"
      );
      expect(card?.images.large).toBe(
        "https://assets.tcgdex.net/en/swsh/swsh3/136/high.webp"
      );
    });
  });
});
