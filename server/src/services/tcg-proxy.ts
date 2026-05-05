import type { TcgCard, TcgSearchResponse } from "../../../shared/tcg";
import { getOptionalEnvVar } from "../config/env";

const UPSTREAM_BASE = "https://api.pokemontcg.io/v2";
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
 * Builds a `Headers` object that includes the upstream API key.
 */
function buildHeaders(): Headers {
  const key = getOptionalEnvVar("POKEMONTCG_API_KEY");
  const headers = new Headers({
    "Content-Type": "application/json"
  });
  if (key) {
    headers.set("X-Api-Key", key);
  }
  return headers;
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
 * Normalises the upstream JSON into our internal {@link TcgCard} shape.
 */
function mapUpstreamCard(raw: unknown): TcgCard {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    supertype: String(r.supertype ?? ""),
    subtypes: Array.isArray(r.subtypes) ? r.subtypes.map(String) : undefined,
    types: Array.isArray(r.types) ? r.types.map(String) : undefined,
    set: typeof r.set === "string" ? r.set : (r.set as Record<string, unknown>)?.name ?? "",
    setDetails: r.set ?? undefined,
    hp: r.hp ?? undefined,
    level: r.level ?? undefined,
    evolvesFrom: r.evolvesFrom ?? undefined,
    evolvesTo: Array.isArray(r.evolvesTo)
      ? r.evolvesTo.map(String)
      : undefined,
    abilities: Array.isArray(r.abilities)
      ? r.abilities.map((a: unknown) => ({
          name: String((a as Record<string, unknown>).name ?? ""),
          text: String((a as Record<string, unknown>).text ?? ""),
          type: String((a as Record<string, unknown>).type ?? "")
        }))
      : undefined,
    attacks: Array.isArray(r.attacks)
      ? r.attacks.map((a: unknown) => ({
          name: String((a as Record<string, unknown>).name ?? ""),
          cost: Array.isArray((a as Record<string, unknown>).cost)
            ? (a as Record<string, unknown>).cost.map(String)
            : [],
          convertedEnergyCost: Number(
            (a as Record<string, unknown>).convertedEnergyCost ?? 0
          ),
          damage: String((a as Record<string, unknown>).damage ?? ""),
          text: String((a as Record<string, unknown>).text ?? "")
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
    retreatCost: Array.isArray(r.retreatCost)
      ? r.retreatCost.map(String)
      : undefined,
    convertedRetreatCost: r.convertedRetreatCost ?? undefined,
    rules: Array.isArray(r.rules) ? r.rules.map(String) : undefined,
    number: String(r.number ?? ""),
    artist: r.artist ?? undefined,
    rarity: r.rarity ?? undefined,
    flavorText: r.flavorText ?? undefined,
    nationalPokedexNumbers: Array.isArray(r.nationalPokedexNumbers)
      ? r.nationalPokedexNumbers.map(Number)
      : undefined,
    legalities: r.legalities ?? undefined,
    regulationMark: r.regulationMark ?? undefined,
    images: {
      small: String((r.images as Record<string, unknown>)?.small ?? ""),
      large: String((r.images as Record<string, unknown>)?.large ?? "")
    },
    prices: r.prices ?? undefined,
    holofoil: Boolean(r.holofoil ?? false)
  };
}

/**
 * Searches pokemontcg.io for cards matching the provided query.
 *
 * @param query     A pokemontcg.io query expression (e.g. `name:Charizard`)
 * @param page      Page number (1-based)
 * @param pageSize  Items per page (capped at 250 by the upstream API)
 * @returns Mapped search result
 * @throws TcgProxyServiceError on upstream failure or timeout
 */
export async function searchCards(
  query: string,
  page = 1,
  pageSize = 20
): Promise<TcgSearchResponse> {
  /**
   * Auto-prefix simple keyword queries with `name:` so users can type
   * plain Pokemon names while still allowing power-users to pass raw
   * pokemontcg.io query expressions (e.g. `set:base1 supertype:Pokémon`).
   */
  const normalisedQuery = /^[a-z0-9\-\s.]+$/i.test(query.trim())
    ? `name:"${query.trim()}"`
    : query;

  const url = new URL(`${UPSTREAM_BASE}/cards`);
  url.searchParams.set("q", normalisedQuery);
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));

  const response = await fetchWithTimeout(url.toString(), {
    method: "GET",
    headers: buildHeaders()
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

  if (!body || typeof body !== "object") {
    throw new TcgProxyServiceError("Unexpected upstream response shape", 502);
  }

  const data = (body as Record<string, unknown>).data;
  const totalCount = Number(
    (body as Record<string, unknown>).totalCount ?? 0
  );

  if (!Array.isArray(data)) {
    throw new TcgProxyServiceError("Unexpected upstream response shape", 502);
  }

  const cards: TcgCard[] = data.map(mapUpstreamCard);

  return { cards, totalCount };
}

/**
 * Fetches a single card by its unique identifier.
 *
 * @param id  The card id (e.g. `swsh4-107`)
 * @returns   The card, or `null` if not found
 * @throws TcgProxyServiceError on upstream failure or timeout
 */
export async function getCardById(id: string): Promise<TcgCard | null> {
  const url = `${UPSTREAM_BASE}/cards/${encodeURIComponent(id)}`;

  const response = await fetchWithTimeout(url, {
    method: "GET",
    headers: buildHeaders()
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

  const data = (body as Record<string, unknown>).data;
  if (!data) {
    throw new TcgProxyServiceError("Unexpected upstream response shape", 502);
  }

  return mapUpstreamCard(data);
}
