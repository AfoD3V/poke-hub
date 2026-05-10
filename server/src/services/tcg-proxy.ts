import type { TcgCard, TcgSearchResponse } from "../../../shared/tcg";

const UPSTREAM_BASE = "https://api.tcgdex.net/v2/en";
const DEFAULT_TIMEOUT_MS = 10_000;

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
 * Searches TCGdex for cards matching the provided name query.
 *
 * @param query     Plain card name (e.g. `Charizard`) or partial match
 * @param page      Page number (1-based)
 * @param pageSize  Items per page
 * @returns Mapped search result
 * @throws TcgProxyServiceError on upstream failure or timeout
 */
export async function searchCards(
  query: string,
  page = 1,
  pageSize = 20
): Promise<TcgSearchResponse> {
  const url = new URL(`${UPSTREAM_BASE}/cards`);
  url.searchParams.set("name", query.trim());
  url.searchParams.set("pagination:page", String(page));
  url.searchParams.set("pagination:itemsPerPage", String(pageSize));

  const response = await fetchWithTimeout(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" }
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

  if (!Array.isArray(body)) {
    throw new TcgProxyServiceError("Unexpected upstream response shape", 502);
  }

  const cards: TcgCard[] = body.map(mapUpstreamCard);

  return { cards, totalCount: cards.length };
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
