import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  getCardById,
  getCardBySetAndNumber,
  getSets,
  _resetSetsCache,
  searchCards,
  getSeries,
  getSeriesById,
  getSetCards,
  _resetSeriesCache,
  _resetSetCardsCache,
  TcgProxyServiceError
} from "./tcg-proxy";

// ---------------------------------------------------------------------------
// REST fixture — used by getCardById tests (unchanged REST endpoint)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// GraphQL fixture — matches TCGdex GraphQL response card shape
// ---------------------------------------------------------------------------
const graphqlCard = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "swsh3-136",
  localId: "136",
  name: "Charizard",
  image: "https://assets.tcgdex.net/en/swsh/swsh3/136",
  rarity: "Rare Holo",
  hp: 170,
  types: ["Fire"],
  stage: "Stage2",
  evolveFrom: "Charmeleon",
  description: "Spits fire that is hot enough to melt boulders.",
  illustrator: "5ban Graphics",
  retreat: 3,
  regulationMark: "D",
  category: "Pokemon",
  set: {
    id: "swsh3",
    name: "Darkness Ablaze",
    logo: "https://assets.tcgdex.net/en/swsh/swsh3/logo.png",
    symbol: "https://assets.tcgdex.net/en/swsh/swsh3/symbol.png"
  },
  variants: {
    normal: false,
    holo: true,
    reverse: true,
    firstEdition: false
  },
  attacks: [
    {
      name: "Flare Blitz",
      cost: ["Fire", "Fire", "Colorless"],
      damage: "300",
      effect: "This Pokemon also does 50 damage to itself."
    }
  ],
  weaknesses: [
    { type: "Water", value: "×2" }
  ],
  ...overrides
});

describe("tcg-proxy service", () => {
  const originalFetch = globalThis.fetch;
  let capturedRequest: { url: string; init: RequestInit } | undefined;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    capturedRequest = undefined;
  });

  // Stubs a plain JSON response (used by getCardById REST tests)
  const stubOk = (jsonBody: unknown): void => {
    globalThis.fetch = async (_url: RequestInfo | URL, _init: RequestInit): Promise<Response> => {
      const url = typeof _url === "string" ? _url : _url.toString();
      capturedRequest = { url, init: _init };
      return new Response(JSON.stringify(jsonBody), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    };
  };

  // Stubs a GraphQL success response wrapping cards in { data: { cards: [...] } }
  const stubGraphQLOk = (cards: unknown[] = []): void => {
    globalThis.fetch = async (_url: RequestInfo | URL, _init: RequestInit): Promise<Response> => {
      const url = typeof _url === "string" ? _url : _url.toString();
      capturedRequest = { url, init: _init };
      return new Response(JSON.stringify({ data: { cards } }), {
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

  // ---------------------------------------------------------------------------
  // searchCards — GraphQL
  // ---------------------------------------------------------------------------
  describe("searchCards", () => {
    it("sends POST to TCGdex GraphQL endpoint", async () => {
      stubGraphQLOk([graphqlCard()]);

      await searchCards("Charizard", 1, 20);

      expect(capturedRequest).toBeDefined();
      expect(capturedRequest?.url).toBe("https://api.tcgdex.net/v2/en/graphql");
      expect(capturedRequest?.init.method).toBe("POST");
    });

    it("sends query and name variable in the request body", async () => {
      stubGraphQLOk([graphqlCard()]);

      await searchCards("Charizard", 1, 20);

      const body = JSON.parse(capturedRequest?.init.body as string) as {
        query: string;
        variables: { name: string };
      };
      expect(typeof body.query).toBe("string");
      expect(body.query).toContain("cards");
      expect(body.variables.name).toBe("Charizard");
    });

    it("returns mapped cards from data.cards", async () => {
      stubGraphQLOk([graphqlCard()]);

      const result = await searchCards("Charizard", 1, 20);

      expect(result.totalCount).toBe(1);
      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].id).toBe("swsh3-136");
      expect(result.cards[0].name).toBe("Charizard");
    });

    it("maps image to small/large webp URLs", async () => {
      stubGraphQLOk([graphqlCard()]);

      const result = await searchCards("Charizard");

      expect(result.cards[0].images.small).toBe(
        "https://assets.tcgdex.net/en/swsh/swsh3/136/low.webp"
      );
      expect(result.cards[0].images.large).toBe(
        "https://assets.tcgdex.net/en/swsh/swsh3/136/high.webp"
      );
    });

    it("maps category to supertype", async () => {
      stubGraphQLOk([graphqlCard({ category: "Trainer" })]);
      const result = await searchCards("Potion");
      expect(result.cards[0].supertype).toBe("Trainer");
    });

    it("maps illustrator to artist", async () => {
      stubGraphQLOk([graphqlCard()]);
      const result = await searchCards("Charizard");
      expect(result.cards[0].artist).toBe("5ban Graphics");
    });

    it("maps localId to number", async () => {
      stubGraphQLOk([graphqlCard()]);
      const result = await searchCards("Charizard");
      expect(result.cards[0].number).toBe("136");
    });

    it("maps hp as string", async () => {
      stubGraphQLOk([graphqlCard({ hp: 170 })]);
      const result = await searchCards("Charizard");
      expect(result.cards[0].hp).toBe("170");
    });

    it("maps set id, name, logo and symbol", async () => {
      stubGraphQLOk([graphqlCard()]);
      const result = await searchCards("Charizard");
      expect(result.cards[0].setDetails?.id).toBe("swsh3");
      expect(result.cards[0].setDetails?.name).toBe("Darkness Ablaze");
      expect(result.cards[0].setDetails?.images?.logo).toBe(
        "https://assets.tcgdex.net/en/swsh/swsh3/logo.png"
      );
      expect(result.cards[0].setDetails?.images?.symbol).toBe(
        "https://assets.tcgdex.net/en/swsh/swsh3/symbol.png"
      );
    });

    it("maps variants.holo to holofoil", async () => {
      stubGraphQLOk([graphqlCard({ variants: { normal: false, holo: true, reverse: false, firstEdition: false } })]);
      const result = await searchCards("Charizard");
      expect(result.cards[0].holofoil).toBe(true);
    });

    it("maps attacks with cost array", async () => {
      stubGraphQLOk([graphqlCard()]);
      const result = await searchCards("Charizard");
      expect(result.cards[0].attacks).toHaveLength(1);
      expect(result.cards[0].attacks?.[0].name).toBe("Flare Blitz");
      expect(result.cards[0].attacks?.[0].cost).toEqual(["Fire", "Fire", "Colorless"]);
      expect(result.cards[0].attacks?.[0].damage).toBe("300");
    });

    it("maps weaknesses", async () => {
      stubGraphQLOk([graphqlCard()]);
      const result = await searchCards("Charizard");
      expect(result.cards[0].weaknesses?.[0]).toEqual({ type: "Water", value: "×2" });
    });

    it("filters out attacks where name is null", async () => {
      stubGraphQLOk([
        graphqlCard({
          attacks: [
            { name: null, cost: ["Fire"], damage: "10", effect: "" },
            { name: "Flare Blitz", cost: ["Fire", "Fire", "Colorless"], damage: "300", effect: "" }
          ]
        })
      ]);
      const result = await searchCards("Charizard");
      expect(result.cards[0].attacks).toHaveLength(1);
      expect(result.cards[0].attacks?.[0].name).toBe("Flare Blitz");
    });

    it("filters out null attack entries (entire item null, not just name)", async () => {
      stubGraphQLOk([
        graphqlCard({
          attacks: [
            null,
            { name: "Flare Blitz", cost: ["Fire"], damage: "100", effect: "" }
          ]
        })
      ]);
      const result = await searchCards("Charizard");
      expect(result.cards[0].attacks).toHaveLength(1);
      expect(result.cards[0].attacks?.[0].name).toBe("Flare Blitz");
    });

    it("defaults null attack cost to empty array", async () => {
      stubGraphQLOk([
        graphqlCard({
          attacks: [{ name: "Tackle", cost: null, damage: "10", effect: "" }]
        })
      ]);
      const result = await searchCards("Charizard");
      expect(result.cards[0].attacks?.[0].cost).toEqual([]);
    });

    it("defaults null attack damage to empty string", async () => {
      stubGraphQLOk([
        graphqlCard({
          attacks: [{ name: "Tackle", cost: ["Colorless"], damage: null, effect: "" }]
        })
      ]);
      const result = await searchCards("Charizard");
      expect(result.cards[0].attacks?.[0].damage).toBe("");
    });

    it("returns empty array when data.cards is empty", async () => {
      stubGraphQLOk([]);
      const result = await searchCards("NoSuchCard");
      expect(result.cards).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("uses cards.length as totalCount", async () => {
      stubGraphQLOk([graphqlCard(), graphqlCard({ id: "swsh3-137", name: "Charizard VMAX" })]);
      const result = await searchCards("Charizard");
      expect(result.totalCount).toBe(2);
    });

    it("does not send an API key header", async () => {
      stubGraphQLOk([]);
      await searchCards("Pikachu");
      const headers = capturedRequest?.init.headers as Record<string, string> | undefined;
      expect(headers?.["X-Api-Key"]).toBeUndefined();
    });

    it("throws TcgProxyServiceError when errors present and data.cards is absent", async () => {
      globalThis.fetch = async (_url: RequestInfo | URL, _init: RequestInit): Promise<Response> => {
        const url = typeof _url === "string" ? _url : _url.toString();
        capturedRequest = { url, init: _init };
        return new Response(
          JSON.stringify({ errors: [{ message: "Fatal error" }] }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      };

      try {
        await searchCards("Pikachu");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(TcgProxyServiceError);
        expect((err as TcgProxyServiceError).statusCode).toBe(502);
      }
    });

    it("returns cards when errors and data.cards are both present (field-level null warnings)", async () => {
      globalThis.fetch = async (_url: RequestInfo | URL, _init: RequestInit): Promise<Response> => {
        const url = typeof _url === "string" ? _url : _url.toString();
        capturedRequest = { url, init: _init };
        return new Response(
          JSON.stringify({
            errors: [{ message: "Cannot return null for non-nullable field AttacksListItem.name." }],
            data: { cards: [graphqlCard()] }
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      };

      const result = await searchCards("Pikachu");
      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].name).toBe("Charizard");
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
  });

  // ---------------------------------------------------------------------------
  // getCardBySetAndNumber — REST
  // ---------------------------------------------------------------------------
  describe("getCardBySetAndNumber", () => {
    it("returns mapped card on success", async () => {
      stubOk(upstreamCard({ id: "svn-112", name: "Pikachu", localId: "112" }));
      const card = await getCardBySetAndNumber("SVN", "112");

      expect(card.id).toBe("svn-112");
      expect(card.name).toBe("Pikachu");
      expect(card.number).toBe("112");
    });

    it("builds the correct upstream URL", async () => {
      stubOk(upstreamCard());
      await getCardBySetAndNumber("SVN", "112");
      expect(capturedRequest?.url).toContain("/sets/SVN/112");
    });

    it("throws TcgProxyServiceError with status 404 when upstream returns 404", async () => {
      globalThis.fetch = async (): Promise<Response> =>
        new Response(JSON.stringify({ message: "Not Found" }), { status: 404 });

      try {
        await getCardBySetAndNumber("SVN", "999");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(TcgProxyServiceError);
        expect((err as TcgProxyServiceError).statusCode).toBe(404);
        expect((err as TcgProxyServiceError).message).toBe("Card not found");
      }
    });

    it("throws TcgProxyServiceError with status 502 when upstream returns 500", async () => {
      globalThis.fetch = async (): Promise<Response> =>
        new Response(JSON.stringify({ error: "fail" }), { status: 500 });

      try {
        await getCardBySetAndNumber("SVN", "112");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(TcgProxyServiceError);
        expect((err as TcgProxyServiceError).statusCode).toBe(502);
      }
    });

    it("throws TcgProxyServiceError with status 504 on timeout", async () => {
      globalThis.fetch = async (): Promise<Response> => {
        const err = new Error("The operation was aborted.");
        err.name = "AbortError";
        throw err;
      };

      try {
        await getCardBySetAndNumber("SVN", "112");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(TcgProxyServiceError);
        expect((err as TcgProxyServiceError).statusCode).toBe(504);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getCardById — REST (unchanged)
  // ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// TCGdex sets GraphQL fixture
// ---------------------------------------------------------------------------
const tcgdexSet = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "sv03.5",
  name: "151",
  abbreviation: { official: "MEW" },
  releaseDate: "2023-09-22",
  cardCount: { official: 165 },
  ...overrides
});

describe("getSets service", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    _resetSetsCache();
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    _resetSetsCache();
    globalThis.fetch = originalFetch;
  });

  const stubSetsGraphQLOk = (sets: unknown[] = []): void => {
    globalThis.fetch = async (): Promise<Response> => {
      return new Response(JSON.stringify({ data: { sets } }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
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

  it("returns array with id, name, abbreviation, cardCount, releaseDate", async () => {
    stubSetsGraphQLOk([tcgdexSet()]);

    const sets = await getSets();
    expect(sets).toHaveLength(1);
    expect(sets[0].id).toBe("sv03.5");
    expect(sets[0].name).toBe("151");
    expect(sets[0].abbreviation).toBe("MEW");
    expect(sets[0].cardCount).toBe(165);
    expect(sets[0].releaseDate).toBe("2023-09-22");
  });

  it("returns sets sorted by releaseDate descending", async () => {
    stubSetsGraphQLOk([
      tcgdexSet({ id: "swsh3", name: "Darkness Ablaze", abbreviation: { official: "DAA" }, releaseDate: "2020-08-14", cardCount: { official: 189 } }),
      tcgdexSet({ id: "sv03.5", name: "151", abbreviation: { official: "MEW" }, releaseDate: "2023-09-22", cardCount: { official: 165 } })
    ]);

    const sets = await getSets();
    expect(sets[0].id).toBe("sv03.5");  // newest first
    expect(sets[1].id).toBe("swsh3");
  });

  it("returns empty string for abbreviation when null", async () => {
    stubSetsGraphQLOk([
      tcgdexSet({ id: "base1", name: "Base Set", abbreviation: null, releaseDate: "1999-01-09", cardCount: { official: 102 } })
    ]);

    const sets = await getSets();
    expect(sets[0].abbreviation).toBe("");
  });

  it("throws TcgProxyServiceError with status 502 on upstream failure", async () => {
    stubUpstreamError(500);

    try {
      await getSets();
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(TcgProxyServiceError);
      expect((err as TcgProxyServiceError).statusCode).toBe(502);
    }
  });

  it("uses in-memory cache: second call within TTL makes only one upstream request", async () => {
    let fetchCount = 0;
    globalThis.fetch = async (): Promise<Response> => {
      fetchCount++;
      return new Response(JSON.stringify({ data: { sets: [tcgdexSet()] } }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    };

    await getSets();
    await getSets();
    expect(fetchCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// TCGdex series fixtures
// ---------------------------------------------------------------------------
const tcgdexSeriesListItem = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "sv",
  name: "Scarlet & Violet",
  logo: "https://assets.tcgdex.net/univ/sv/logo.png",
  ...overrides
});

const tcgdexSeriesDetail = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "sv",
  name: "Scarlet & Violet",
  logo: "https://assets.tcgdex.net/univ/sv/logo.png",
  releaseDate: "2023-03-31",
  sets: [
    { id: "sv03.5", name: "151", logo: "https://assets.tcgdex.net/en/sv/sv03.5/logo.png", cardCount: { official: 165 } }
  ],
  ...overrides
});

// ---------------------------------------------------------------------------
// getSeries
// ---------------------------------------------------------------------------
describe("getSeries service", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    _resetSeriesCache();
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    _resetSeriesCache();
    globalThis.fetch = originalFetch;
  });

  // Stubs series list then detail responses (fan-out pattern)
  const stubSeriesList = (list: unknown[], detailFn: (id: string) => unknown): void => {
    globalThis.fetch = async (url: RequestInfo | URL): Promise<Response> => {
      const urlStr = typeof url === "string" ? url : url.toString();
      if (urlStr.match(/\/series\/[^/]+$/)) {
        const id = urlStr.split("/").pop()!;
        const detail = detailFn(id);
        return new Response(JSON.stringify(detail), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      // series list
      return new Response(JSON.stringify(list), { status: 200, headers: { "Content-Type": "application/json" } });
    };
  };

  it("returns array of SeriesItem sorted by releaseDate descending (dated first)", async () => {
    const list = [
      tcgdexSeriesListItem({ id: "bw", name: "Black & White" }),
      tcgdexSeriesListItem({ id: "sv", name: "Scarlet & Violet" })
    ];
    stubSeriesList(list, (id) =>
      id === "sv"
        ? tcgdexSeriesDetail({ id: "sv", name: "Scarlet & Violet", releaseDate: "2023-03-31" })
        : tcgdexSeriesDetail({ id: "bw", name: "Black & White", releaseDate: "2011-04-25" })
    );

    const result = await getSeries();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("sv"); // newest first
    expect(result[1].id).toBe("bw");
  });

  it("undated series appear last, sorted alphabetically", async () => {
    const list = [
      tcgdexSeriesListItem({ id: "misc", name: "Miscellaneous" }),
      tcgdexSeriesListItem({ id: "sv", name: "Scarlet & Violet" }),
      tcgdexSeriesListItem({ id: "promo", name: "Promos" })
    ];
    stubSeriesList(list, (id) => {
      if (id === "sv") return tcgdexSeriesDetail({ id: "sv", releaseDate: "2023-03-31" });
      return tcgdexSeriesDetail({ id, releaseDate: "" });
    });

    const result = await getSeries();
    expect(result[0].id).toBe("sv"); // dated first
    // undated in alpha order
    const undated = result.slice(1).map((s) => s.name);
    expect(undated).toEqual([...undated].sort());
  });

  it("throws TcgProxyServiceError(502) when series list upstream fails", async () => {
    globalThis.fetch = async (): Promise<Response> =>
      new Response(JSON.stringify({ error: "fail" }), { status: 502 });

    await expect(getSeries()).rejects.toThrow(TcgProxyServiceError);
    try {
      await getSeries();
    } catch (err) {
      expect((err as TcgProxyServiceError).statusCode).toBe(502);
    }
  });

  it("second call within TTL makes only one upstream request to list endpoint", async () => {
    let listFetchCount = 0;
    globalThis.fetch = async (url: RequestInfo | URL): Promise<Response> => {
      const urlStr = typeof url === "string" ? url : url.toString();
      if (!urlStr.match(/\/series\/[^/]+$/)) listFetchCount++;
      return new Response(
        JSON.stringify(urlStr.match(/\/series\/[^/]+$/) ? tcgdexSeriesDetail() : [tcgdexSeriesListItem()]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    await getSeries();
    await getSeries();
    expect(listFetchCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getSeriesById
// ---------------------------------------------------------------------------
describe("getSeriesById service", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    _resetSeriesCache();
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    _resetSeriesCache();
    globalThis.fetch = originalFetch;
  });

  it("returns SeriesDetail with sets array on valid id", async () => {
    globalThis.fetch = async (): Promise<Response> =>
      new Response(JSON.stringify(tcgdexSeriesDetail()), { status: 200, headers: { "Content-Type": "application/json" } });

    const result = await getSeriesById("sv");
    expect(result.id).toBe("sv");
    expect(result.name).toBe("Scarlet & Violet");
    expect(Array.isArray(result.sets)).toBe(true);
    expect(result.sets).toHaveLength(1);
    expect(result.sets[0].id).toBe("sv03.5");
  });

  it("throws TcgProxyServiceError(404) on unknown id", async () => {
    globalThis.fetch = async (): Promise<Response> =>
      new Response(JSON.stringify({ message: "Not Found" }), { status: 404 });

    try {
      await getSeriesById("nonexistent");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(TcgProxyServiceError);
      expect((err as TcgProxyServiceError).statusCode).toBe(404);
    }
  });

  it("second call for same id makes only one upstream request (cache hit)", async () => {
    let fetchCount = 0;
    globalThis.fetch = async (): Promise<Response> => {
      fetchCount++;
      return new Response(JSON.stringify(tcgdexSeriesDetail()), { status: 200, headers: { "Content-Type": "application/json" } });
    };

    await getSeriesById("sv");
    await getSeriesById("sv");
    expect(fetchCount).toBe(1);
  });

  it("throws TcgProxyServiceError(502) on upstream error", async () => {
    globalThis.fetch = async (): Promise<Response> =>
      new Response(JSON.stringify({ error: "fail" }), { status: 500 });

    try {
      await getSeriesById("sv");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(TcgProxyServiceError);
      expect((err as TcgProxyServiceError).statusCode).toBe(502);
    }
  });
});

// ---------------------------------------------------------------------------
// getSetCards
// ---------------------------------------------------------------------------
const tcgdexSetDetail = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "sv03.5",
  name: "151",
  cards: [
    { id: "sv03.5-10", name: "Metapod", localId: "10", image: "https://assets.tcgdex.net/en/sv/sv03.5/10" },
    { id: "sv03.5-1", name: "Bulbasaur", localId: "1", image: "https://assets.tcgdex.net/en/sv/sv03.5/1" },
    { id: "sv03.5-2", name: "Ivysaur", localId: "2", image: null }
  ],
  ...overrides
});

describe("getSetCards service", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    _resetSetCardsCache();
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    _resetSetCardsCache();
    globalThis.fetch = originalFetch;
  });

  it("returns card array ordered by localId ascending", async () => {
    globalThis.fetch = async (): Promise<Response> =>
      new Response(JSON.stringify(tcgdexSetDetail()), { status: 200, headers: { "Content-Type": "application/json" } });

    const result = await getSetCards("sv03.5");
    expect(result).toHaveLength(3);
    expect(result[0].localId).toBe("1");
    expect(result[1].localId).toBe("2");
    expect(result[2].localId).toBe("10");
  });

  it("returns cards with id, name, localId, image fields", async () => {
    globalThis.fetch = async (): Promise<Response> =>
      new Response(JSON.stringify(tcgdexSetDetail()), { status: 200, headers: { "Content-Type": "application/json" } });

    const result = await getSetCards("sv03.5");
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("localId");
    expect(result[0]).toHaveProperty("image");
  });

  it("throws TcgProxyServiceError(404) on unknown set", async () => {
    globalThis.fetch = async (): Promise<Response> =>
      new Response(JSON.stringify({ message: "Not Found" }), { status: 404 });

    try {
      await getSetCards("nonexistent");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(TcgProxyServiceError);
      expect((err as TcgProxyServiceError).statusCode).toBe(404);
    }
  });

  it("second call for same setId makes only one upstream request (cache hit)", async () => {
    let fetchCount = 0;
    globalThis.fetch = async (): Promise<Response> => {
      fetchCount++;
      return new Response(JSON.stringify(tcgdexSetDetail()), { status: 200, headers: { "Content-Type": "application/json" } });
    };

    await getSetCards("sv03.5");
    await getSetCards("sv03.5");
    expect(fetchCount).toBe(1);
  });

  it("throws TcgProxyServiceError(502) when upstream returns 502", async () => {
    globalThis.fetch = async (): Promise<Response> =>
      new Response(JSON.stringify({ error: "fail" }), { status: 502 });

    try {
      await getSetCards("sv03.5");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(TcgProxyServiceError);
      expect((err as TcgProxyServiceError).statusCode).toBe(502);
    }
  });
});

// ---------------------------------------------------------------------------
// searchCards with lang param
// ---------------------------------------------------------------------------
describe("searchCards with lang param", () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";

  afterEach(() => {
    globalThis.fetch = originalFetch;
    capturedUrl = "";
  });

  const stubGraphQLOkLang = (cards: unknown[] = []): void => {
    globalThis.fetch = async (url: RequestInfo | URL): Promise<Response> => {
      capturedUrl = typeof url === "string" ? url : url.toString();
      return new Response(JSON.stringify({ data: { cards } }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    };
  };

  it("defaults to English endpoint when lang is not provided", async () => {
    stubGraphQLOkLang([]);
    await searchCards("Pikachu");
    expect(capturedUrl).toContain("/v2/en/graphql");
  });

  it("uses language-specific graphql endpoint for ja", async () => {
    stubGraphQLOkLang([]);
    await searchCards("ピカチュウ", 1, 20, "ja");
    expect(capturedUrl).toContain("/v2/ja/graphql");
  });

  it("throws TcgProxyServiceError(400) for unsupported language code", async () => {
    try {
      await searchCards("Pikachu", 1, 20, "zz");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(TcgProxyServiceError);
      expect((err as TcgProxyServiceError).statusCode).toBe(400);
      expect((err as TcgProxyServiceError).message).toContain("Unsupported language: zz");
    }
  });
});
