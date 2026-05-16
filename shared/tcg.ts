/**
 * Shared type definitions for the Pokemon TCG API proxy layer.
 *
 * These types are used by both the Hono backend (proxy service) and the
 * SvelteKit frontend (search UI). Keep them free from framework-specific
 * imports so they can be imported by any consumer.
 */

/**
 * Represents a single TCG card returned by the upstream API.
 */
export interface TcgCard {
  /** Unique card identifier (e.g. "swsh3-136") */
  id: string;

  /** Human-readable card name */
  name: string;

  /** Supertype (e.g. "Pokemon", "Trainer", "Energy") */
  supertype: string;

  /** Subtypes (e.g. "Basic", "Stage 1") */
  subtypes?: string[];

  /** Primary type (e.g. "Fire", "Water") */
  types?: string[];

  /** Set name */
  set: string;

  /** Set details */
  setDetails?: {
    id: string;
    name: string;
    series: string;
    printedTotal: number;
    total: number;
    legalities?: Record<string, unknown>;
    ptcgoCode?: string;
    releaseDate: string;
    updatedAt?: string;
    images?: {
      symbol: string;
      logo: string;
    };
  };

  /** Pokemon-specific data */
  hp?: string;
  level?: string;
  evolvesFrom?: string;
  evolvesTo?: string[];
  abilities?: Array<{
    name: string;
    text: string;
    type: string;
  }>;
  attacks?: Array<{
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage: string;
    text: string;
  }>;
  weaknesses?: Array<{
    type: string;
    value: string;
  }>;
  resistances?: Array<{
    type: string;
    value: string;
  }>;
  retreatCost?: string[];
  convertedRetreatCost?: number;
  rules?: string[];
  number: string;
  artist?: string;
  rarity?: string;
  flavorText?: string;
  nationalPokedexNumbers?: number[];
  legalities?: Record<string, string | null>;
  regulationMark?: string;

  /** Card images (small = low quality, large = high quality) */
  images: {
    small: string;
    large: string;
  };

  /** Cardmarket / TcgPlayer prices (optional) */
  prices?: {
    cardmarket?: {
      url: string;
      updatedAt: string;
      prices: Record<string, number | null>;
    };
    tcgplayer?: {
      url: string;
      updatedAt: string;
      prices: Record<string, number | null>;
    };
  };

  /** Whether the card has a holo or first-edition holo variant */
  holofoil?: boolean;
}

/**
 * Search-specific response wrapper when the proxy is asked for multiple cards.
 */
export interface TcgSearchResponse {
  cards: TcgCard[];
  totalCount: number;
}

/**
 * Error shape returned by the proxy when upstream fails.
 */
export interface TcgProxyError {
  error: string;
}

/**
 * A single TCG set entry returned by the sets list endpoint.
 */
export interface SetItem {
  /** TCGdex internal set ID (e.g. "sv03.5") */
  id: string;
  /** Human-readable set name (e.g. "151") */
  name: string;
  /** Official printed abbreviation (e.g. "MEW"), or empty string if absent */
  abbreviation: string;
  /** Number of official cards in the set */
  cardCount: number;
  /** Release date string (e.g. "2023-09-22") */
  releaseDate: string;
}
