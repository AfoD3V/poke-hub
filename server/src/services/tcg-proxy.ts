import type { TcgCard, TcgSearchResponse, SetItem, SeriesItem, SeriesDetail, SetCardItem } from "../../../shared/tcg";

const UPSTREAM_BASE = "https://api.tcgdex.net/v2/en";
const DEFAULT_TIMEOUT_MS = 10_000;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SETS_TTL_MS = CACHE_TTL_MS;

/** Supported language codes for TCGdex endpoints. */
export const SUPPORTED_LANGS = new Set(["en", "ja", "fr", "de", "es", "it", "pt"]);

// Static upstream endpoint builders — encodeURIComponent prevents injection
const UPSTREAM_SERIES_LIST = `${UPSTREAM_BASE}/series`;
const UPSTREAM_SERIES_DETAIL = (id: string) => `${UPSTREAM_BASE}/series/${encodeURIComponent(id)}`;
const UPSTREAM_SET_DETAIL = (id: string) => `${UPSTREAM_BASE}/sets/${encodeURIComponent(id)}`;

/** Module-level cache for the sets list to avoid repeated upstream calls. */
const setsCache: { data: SetItem[] | null; expiresAt: number } = {
  data: null,
  expiresAt: 0
};

/** Module-level cache for the merged series list. */
const seriesListCache: { data: SeriesItem[] | null; expiresAt: number } = {
  data: null,
  expiresAt: 0
};

/** Per-id cache for series detail. */
const seriesDetailCache: Map<string, { data: SeriesDetail; expiresAt: number }> = new Map();

/** Per-setId cache for set cards. */
const setCardsCache: Map<string, { data: SetCardItem[]; expiresAt: number }> = new Map();

/** Reset the sets cache — for use in tests only. */
export function _resetSetsCache(): void {
  setsCache.data = null;
  setsCache.expiresAt = 0;
}

/** Reset the series caches — for use in tests only. */
export function _resetSeriesCache(): void {
  seriesListCache.data = null;
  seriesListCache.expiresAt = 0;
  seriesDetailCache.clear();
}

/** Reset the set cards cache — for use in tests only. */
export function _resetSetCardsCache(): void {
  setCardsCache.clear();
}

// Static GraphQL query for all sets — no interpolation, safe from injection.
// NOTE: TCGdex GraphQL does not expose an `abbreviation` field on the Set type;
// abbreviation data is only available via the REST detail endpoint (N+1 problem).
// Sets are returned with `abbreviation: ""` — users can still filter by name or ID.
const SETS_QUERY = `
  query {
    sets {
      id
      name
      releaseDate
      cardCount { official }
    }
  }
`;

// ---------------------------------------------------------------------------
// GraphQL types — raw TCGdex response shape (attack fields may be null despite
// the TCGdex schema marking them non-nullable; handle defensively)
// ---------------------------------------------------------------------------

interface TcgdexGraphQLAttack {
  name: string | null;
  cost: string[] | null;
  damage: string | null;
  effect: string | null;
}

interface TcgdexGraphQLSet {
  id: string;
  name: string;
  logo: string | null;
  symbol: string | null;
}

interface TcgdexGraphQLVariants {
  normal: boolean;
  holo: boolean;
  reverse: boolean;
  firstEdition: boolean;
}

interface TcgdexGraphQLCard {
  id: string;
  localId: string | null;
  name: string;
  image: string | null;
  rarity: string | null;
  hp: number | null;
  types: string[] | null;
  stage: string | null;
  evolveFrom: string | null;
  description: string | null;
  illustrator: string | null;
  retreat: number | null;
  regulationMark: string | null;
  category: string;
  set: TcgdexGraphQLSet | null;
  variants: TcgdexGraphQLVariants | null;
  attacks: TcgdexGraphQLAttack[] | null;
  weaknesses: Array<{ type: string; value: string }> | null;
}

// Static parameterized query — name passed as a variable, never interpolated
const SEARCH_QUERY = `
  query SearchCards($name: String) {
    cards(filters: { name: $name }) {
      id
      localId
      name
      image
      rarity
      hp
      types
      stage
      evolveFrom
      description
      illustrator
      retreat
      regulationMark
      category
      set {
        id
        name
        logo
        symbol
      }
      variants {
        normal
        holo
        reverse
        firstEdition
      }
      attacks {
        name
        cost
        damage
        effect
      }
      weaknesses {
        type
        value
      }
    }
  }
`;

/**
 * Dedicated error class thrown by the TCG proxy layer. Carries a suggested
 * HTTP status code so the route handler can map it accurately.
 */
export class TcgProxyServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "TcgProxyServiceError";
  }
}

/**
 * Wraps `fetch` with an `AbortController` so a slow upstream call times out
 * uniformly rather than hanging indefinitely.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return response;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new TcgProxyServiceError(
        "Upstream API request timed out",
        504
      );
    }
    throw new TcgProxyServiceError("Upstream API request failed", 502);
  } finally {
    clearTimeout(id);
  }
}

/**
 * Normalises a TCGdex card object into our internal {@link TcgCard} shape.
 */
function mapUpstreamCard(raw: unknown): TcgCard {
  const r = raw as Record<string, unknown>;
  const set = r.set as Record<string, unknown> | undefined;
  const serie = set?.serie as Record<string, unknown> | undefined;
  const cardCount = set?.cardCount as Record<string, unknown> | undefined;
  const imageBase = typeof r.image === "string" ? r.image : "";

  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    supertype: String(r.category ?? ""),
    subtypes: Array.isArray(r.variants) ? undefined : undefined,
    types: Array.isArray(r.types) ? r.types.map(String) : undefined,
    set: typeof set?.name === "string" ? set.name : "",
    setDetails: set
      ? {
          id: String(set.id ?? ""),
          name: String(set.name ?? ""),
          series: typeof serie?.name === "string" ? serie.name : "",
          printedTotal: Number(cardCount?.official ?? cardCount?.total ?? 0),
          total: Number(cardCount?.total ?? 0),
          releaseDate: String(set.releaseDate ?? ""),
          images: {
            symbol: typeof set.symbol === "string" ? set.symbol : "",
            logo: typeof set.logo === "string" ? set.logo : ""
          }
        }
      : undefined,
    hp: r.hp !== undefined && r.hp !== null ? String(r.hp) : undefined,
    evolvesFrom: typeof r.stage === "string" && r.evolvesFrom
      ? String(r.evolvesFrom)
      : undefined,
    abilities: Array.isArray(r.abilities)
      ? r.abilities.map((a: unknown) => ({
          name: String((a as Record<string, unknown>).name ?? ""),
          text: String((a as Record<string, unknown>).effect ?? ""),
          type: "Ability"
        }))
      : undefined,
    attacks: Array.isArray(r.attacks)
      ? r.attacks.map((a: unknown) => ({
          name: String((a as Record<string, unknown>).name ?? ""),
          cost: [],
          convertedEnergyCost: Number(
            (a as Record<string, unknown>).cost ?? 0
          ),
          damage: String((a as Record<string, unknown>).damage ?? ""),
          text: String((a as Record<string, unknown>).effect ?? "")
        }))
      : undefined,
    weaknesses: Array.isArray(r.weaknesses)
      ? r.weaknesses.map((w: unknown) => ({
          type: String((w as Record<string, unknown>).type ?? ""),
          value: String((w as Record<string, unknown>).value ?? "")
        }))
      : undefined,
    resistances: Array.isArray(r.resistances)
      ? r.resistances.map((w: unknown) => ({
          type: String((w as Record<string, unknown>).type ?? ""),
          value: String((w as Record<string, unknown>).value ?? "")
        }))
      : undefined,
    retreatCost: r.retreat !== undefined
      ? Array(Number(r.retreat)).fill("Colorless")
      : undefined,
    convertedRetreatCost: r.retreat !== undefined ? Number(r.retreat) : undefined,
    rules: Array.isArray(r.rules) ? r.rules.map(String) : undefined,
    number: String(r.localId ?? ""),
    artist: typeof r.illustrator === "string" ? r.illustrator : undefined,
    rarity: typeof r.rarity === "string" ? r.rarity : undefined,
    flavorText: typeof r.description === "string" ? r.description : undefined,
    nationalPokedexNumbers: Array.isArray(r.dexIds)
      ? r.dexIds.map(Number)
      : undefined,
    legalities:
      r.legal !== undefined
        ? (r.legal as Record<string, string | null>)
        : undefined,
    regulationMark:
      typeof r.regulationMark === "string" ? r.regulationMark : undefined,
    images: {
      small: imageBase ? `${imageBase}/low.webp` : "",
      large: imageBase ? `${imageBase}/high.webp` : ""
    },
    prices: (() => {
      const tcgplayer = r.tcgplayer as Record<string, unknown> | undefined;
      const cardmarket = r.cardmarket as Record<string, unknown> | undefined;
      if (!tcgplayer && !cardmarket) return undefined;
      return {
        tcgplayer: tcgplayer
          ? {
              url: String(tcgplayer.url ?? ""),
              updatedAt: String(tcgplayer.updatedAt ?? ""),
              prices: (tcgplayer.prices as Record<string, number | null>) ?? {}
            }
          : undefined,
        cardmarket: cardmarket
          ? {
              url: String(cardmarket.url ?? ""),
              updatedAt: String(cardmarket.updatedAt ?? ""),
              prices:
                (cardmarket.prices as Record<string, number | null>) ?? {}
            }
          : undefined
      };
    })(),
    holofoil: (() => {
      const variants = r.variants as Record<string, unknown> | undefined;
      return Boolean(variants?.holo ?? variants?.firstEditionHolo ?? false);
    })()
  };
}

/**
 * Maps a raw TCGdex GraphQL card to the internal {@link TcgCard} shape.
 * Handles nulls on attack sub-fields defensively — attacks with a null name
 * are filtered out entirely.
 */
function mapGraphQLCard(raw: TcgdexGraphQLCard): TcgCard {
  const imageBase = typeof raw.image === "string" ? raw.image : "";

  const attacks = Array.isArray(raw.attacks)
    ? raw.attacks
        .filter((a) => a !== null && a.name !== null)
        .map((a) => ({
          name: a.name as string,
          cost: Array.isArray(a.cost) ? a.cost : [],
          convertedEnergyCost: Array.isArray(a.cost) ? a.cost.length : 0,
          damage: a.damage ?? "",
          text: a.effect ?? ""
        }))
    : undefined;

  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    supertype: String(raw.category ?? ""),
    types: Array.isArray(raw.types) ? raw.types : undefined,
    set: raw.set?.name ?? "",
    setDetails: raw.set
      ? {
          id: String(raw.set.id ?? ""),
          name: String(raw.set.name ?? ""),
          series: "",
          printedTotal: 0,
          total: 0,
          releaseDate: "",
          images: {
            symbol: raw.set.symbol ?? "",
            logo: raw.set.logo ?? ""
          }
        }
      : undefined,
    hp: raw.hp != null ? String(raw.hp) : undefined,
    evolvesFrom: raw.evolveFrom ?? undefined,
    attacks,
    weaknesses: Array.isArray(raw.weaknesses)
      ? raw.weaknesses.map((w) => ({ type: w.type, value: w.value }))
      : undefined,
    retreatCost: raw.retreat != null
      ? Array(Number(raw.retreat)).fill("Colorless")
      : undefined,
    convertedRetreatCost: raw.retreat != null ? Number(raw.retreat) : undefined,
    number: String(raw.localId ?? ""),
    artist: raw.illustrator ?? undefined,
    rarity: raw.rarity ?? undefined,
    flavorText: raw.description ?? undefined,
    regulationMark: raw.regulationMark ?? undefined,
    images: {
      small: imageBase ? `${imageBase}/low.webp` : "",
      large: imageBase ? `${imageBase}/high.webp` : ""
    },
    holofoil: Boolean(raw.variants?.holo ?? raw.variants?.firstEdition ?? false)
  };
}

/**
 * Returns all TCG sets from TCGdex, sorted by release date (newest first).
 * Results are cached in-memory for 24 hours.
 *
 * @throws TcgProxyServiceError on upstream failure or timeout
 */
export async function getSets(): Promise<SetItem[]> {
  const now = Date.now();
  if (setsCache.data !== null && now < setsCache.expiresAt) {
    return setsCache.data;
  }

  const graphqlEndpoint = `https://api.tcgdex.net/v2/en/graphql`;
  const response = await fetchWithTimeout(graphqlEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: SETS_QUERY })
  });

  if (!response.ok) {
    throw new TcgProxyServiceError(
      `Upstream returned ${response.status}`,
      502
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new TcgProxyServiceError("Invalid upstream response body", 502);
  }

  const gqlBody = body as { data?: { sets?: unknown[] }; errors?: unknown[] };
  const rawSets = gqlBody.data?.sets;

  if (!Array.isArray(rawSets)) {
    throw new TcgProxyServiceError(
      Array.isArray(gqlBody.errors)
        ? "TCGdex GraphQL returned errors"
        : "Unexpected upstream response shape",
      502
    );
  }

  const sets: SetItem[] = rawSets
    .map((s) => {
      const raw = s as Record<string, unknown>;
      const abbr = raw.abbreviation as Record<string, unknown> | null;
      const cardCount = raw.cardCount as Record<string, unknown> | null;
      return {
        id: String(raw.id ?? ""),
        name: String(raw.name ?? ""),
        abbreviation: typeof abbr?.official === "string" ? abbr.official : "",
        cardCount: Number(cardCount?.official ?? 0),
        releaseDate: String(raw.releaseDate ?? "")
      };
    })
    .sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : a.releaseDate > b.releaseDate ? -1 : 0));

  setsCache.data = sets;
  setsCache.expiresAt = now + SETS_TTL_MS;

  return sets;
}

/**
 * Searches TCGdex for cards matching the provided name query.
 *
 * @param query     Plain card name (e.g. `Charizard`) or partial match
 * @param page      Page number (1-based)
 * @param pageSize  Items per page
 * @param lang      Language code (e.g. `en`, `ja`); defaults to `en`
 * @returns Mapped search result
 * @throws TcgProxyServiceError on upstream failure, timeout, or invalid lang
 */
export async function searchCards(
  query: string,
  _page = 1,
  _pageSize = 20,
  lang = "en"
): Promise<TcgSearchResponse> {
  if (!SUPPORTED_LANGS.has(lang)) {
    throw new TcgProxyServiceError(`Unsupported language: ${lang}`, 400);
  }

  // TCGdex GraphQL is language-agnostic — only the REST API uses lang prefixes.
  // The lang param is validated above but does not change the endpoint.
  const graphqlEndpoint = "https://api.tcgdex.net/v2/graphql";
  const response = await fetchWithTimeout(graphqlEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: SEARCH_QUERY,
      variables: { name: query.trim() }
    })
  });

  if (!response.ok) {
    throw new TcgProxyServiceError(
      `Upstream returned ${response.status}`,
      502
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new TcgProxyServiceError("Invalid upstream response body", 502);
  }

  const gqlBody = body as { data?: { cards?: unknown[] }; errors?: unknown[] };

  // TCGdex may return field-level errors (e.g. null attack names) alongside
  // valid data. Only fail hard when data.cards is absent entirely.
  const rawCards = gqlBody.data?.cards;
  if (!Array.isArray(rawCards)) {
    throw new TcgProxyServiceError(
      Array.isArray(gqlBody.errors)
        ? "TCGdex GraphQL returned errors"
        : "Unexpected upstream response shape",
      502
    );
  }

  const cards: TcgCard[] = rawCards.map((c) =>
    mapGraphQLCard(c as TcgdexGraphQLCard)
  );

  return { cards, totalCount: cards.length };
}

/**
 * Fetches a single card by set ID and local card number.
 *
 * @param setId       The TCGdex set code (e.g. `SVN`)
 * @param cardNumber  The card's local number within the set (e.g. `112`)
 * @returns           The matched card
 * @throws TcgProxyServiceError with status 404 if not found, 502/504 on upstream failure
 */
export async function getCardBySetAndNumber(
  setId: string,
  cardNumber: string
): Promise<TcgCard> {
  const url = `${UPSTREAM_BASE}/sets/${encodeURIComponent(setId)}/${encodeURIComponent(cardNumber)}`;

  const response = await fetchWithTimeout(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  if (response.status === 404) {
    throw new TcgProxyServiceError("Card not found", 404);
  }

  if (!response.ok) {
    throw new TcgProxyServiceError(
      `Upstream returned ${response.status}`,
      502
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new TcgProxyServiceError("Invalid upstream response body", 502);
  }

  if (!body || typeof body !== "object") {
    throw new TcgProxyServiceError("Unexpected upstream response shape", 502);
  }

  return mapUpstreamCard(body);
}

/**
 * Fetches a single card by its unique identifier.
 *
 * @param id  The card id (e.g. `swsh3-136`)
 * @returns   The card, or `null` if not found
 * @throws TcgProxyServiceError on upstream failure or timeout
 */
export async function getCardById(id: string): Promise<TcgCard | null> {
  const url = `${UPSTREAM_BASE}/cards/${encodeURIComponent(id)}`;

  const response = await fetchWithTimeout(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new TcgProxyServiceError(
      `Upstream returned ${response.status}`,
      502
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new TcgProxyServiceError("Invalid upstream response body", 502);
  }

  if (!body || typeof body !== "object") {
    throw new TcgProxyServiceError("Unexpected upstream response shape", 502);
  }

  return mapUpstreamCard(body);
}

// ---------------------------------------------------------------------------
// Series service functions
// ---------------------------------------------------------------------------

/** Appends .webp to a TCGdex logo URL that has no file extension. */
function normalizeLogo(logo: unknown): string {
  if (typeof logo !== "string" || !logo) return "";
  if (/\.\w{2,5}$/.test(logo)) return logo; // already has extension
  return `${logo}.webp`;
}

/**
 * TCGdex series IDs to exclude from the browser. These are catch-all
 * buckets (Miscellaneous, Trainer kits) or promotional sub-collections
 * (McDonald's) that have no logos, few/no card images, and don't
 * correspond to a real TCG expansion series.
 */
const EXCLUDED_SERIES_IDS = new Set(["misc", "tk", "mc"]);

/**
 * Returns all TCGdex series, merged with release dates (fetched from detail
 * endpoints in parallel), sorted newest-first then alphabetically for undated.
 * Results are cached in-memory for 24 hours.
 *
 * @throws TcgProxyServiceError on upstream failure or timeout
 */
export async function getSeries(): Promise<SeriesItem[]> {
  const now = Date.now();
  if (seriesListCache.data !== null && now < seriesListCache.expiresAt) {
    return seriesListCache.data;
  }

  const listResponse = await fetchWithTimeout(UPSTREAM_SERIES_LIST, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  if (!listResponse.ok) {
    throw new TcgProxyServiceError(`Upstream returned ${listResponse.status}`, 502);
  }

  let listBody: unknown;
  try {
    listBody = await listResponse.json();
  } catch {
    throw new TcgProxyServiceError("Invalid upstream response body", 502);
  }

  if (!Array.isArray(listBody)) {
    throw new TcgProxyServiceError("Unexpected upstream response shape", 502);
  }

  const listItems = (listBody as Array<Record<string, unknown>>)
    .filter((item) => !EXCLUDED_SERIES_IDS.has(String(item.id ?? "")));

  // Fan-out to all series detail endpoints in parallel to collect releaseDate + logo
  const detailResults = await Promise.allSettled(
    listItems.map((item) =>
      fetchWithTimeout(UPSTREAM_SERIES_DETAIL(String(item.id ?? "")), {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      }).then((r) => (r.ok ? r.json() : Promise.resolve(null)))
    )
  );

  const series: SeriesItem[] = listItems.map((item, i) => {
    const detail = detailResults[i].status === "fulfilled"
      ? (detailResults[i] as PromiseFulfilledResult<unknown>).value as Record<string, unknown> | null
      : null;

    return {
      id: String(item.id ?? ""),
      name: String(item.name ?? ""),
      logo: normalizeLogo(detail?.logo ?? item.logo),
      releaseDate: typeof detail?.releaseDate === "string" ? detail.releaseDate : ""
    };
  });

  // Sort: dated newest-first, then undated alphabetically
  series.sort((a, b) => {
    if (a.releaseDate && b.releaseDate) {
      return a.releaseDate < b.releaseDate ? 1 : a.releaseDate > b.releaseDate ? -1 : 0;
    }
    if (a.releaseDate) return -1;
    if (b.releaseDate) return 1;
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });

  seriesListCache.data = series;
  seriesListCache.expiresAt = now + CACHE_TTL_MS;

  return series;
}

/**
 * Returns a single series with its embedded sets array.
 * Results are cached per id for 24 hours.
 *
 * @throws TcgProxyServiceError(404) if series not found
 * @throws TcgProxyServiceError(502/504) on upstream failure
 */
export async function getSeriesById(id: string): Promise<SeriesDetail> {
  const now = Date.now();
  const cached = seriesDetailCache.get(id);
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  const response = await fetchWithTimeout(UPSTREAM_SERIES_DETAIL(id), {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  if (response.status === 404) {
    throw new TcgProxyServiceError("Series not found", 404);
  }

  if (!response.ok) {
    throw new TcgProxyServiceError(`Upstream returned ${response.status}`, 502);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new TcgProxyServiceError("Invalid upstream response body", 502);
  }

  const raw = body as Record<string, unknown>;
  const rawSets = Array.isArray(raw.sets) ? raw.sets as Array<Record<string, unknown>> : [];

  const detail: SeriesDetail = {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    logo: normalizeLogo(raw.logo),
    releaseDate: typeof raw.releaseDate === "string" ? raw.releaseDate : "",
    sets: rawSets.map((s) => {
      const cardCount = s.cardCount as Record<string, unknown> | null;
      return {
        id: String(s.id ?? ""),
        name: String(s.name ?? ""),
        logo: normalizeLogo(s.logo),
        cardCount: Number(cardCount?.official ?? cardCount?.total ?? s.cardCount ?? 0)
      };
    })
  };

  seriesDetailCache.set(id, { data: detail, expiresAt: now + CACHE_TTL_MS });

  return detail;
}

/**
 * Returns lightweight cards for a given set, sorted by localId ascending.
 * Results are cached per setId for 24 hours.
 *
 * @throws TcgProxyServiceError(404) if set not found
 * @throws TcgProxyServiceError(502/504) on upstream failure
 */
export async function getSetCards(setId: string): Promise<SetCardItem[]> {
  const now = Date.now();
  const cached = setCardsCache.get(setId);
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  const response = await fetchWithTimeout(UPSTREAM_SET_DETAIL(setId), {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  if (response.status === 404) {
    throw new TcgProxyServiceError("Set not found", 404);
  }

  if (!response.ok) {
    throw new TcgProxyServiceError(`Upstream returned ${response.status}`, 502);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new TcgProxyServiceError("Invalid upstream response body", 502);
  }

  const raw = body as Record<string, unknown>;
  const rawCards = Array.isArray(raw.cards) ? raw.cards as Array<Record<string, unknown>> : [];

  const cards: SetCardItem[] = rawCards
    .map((c) => ({
      id: String(c.id ?? ""),
      name: String(c.name ?? ""),
      localId: String(c.localId ?? ""),
      image: typeof c.image === "string" ? c.image : ""
    }))
    .sort((a, b) => {
      const na = Number(a.localId);
      const nb = Number(b.localId);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localId < b.localId ? -1 : a.localId > b.localId ? 1 : 0;
    });

  setCardsCache.set(setId, { data: cards, expiresAt: now + CACHE_TTL_MS });

  return cards;
}
