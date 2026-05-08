import type { TcgCard } from './tcg';

/**
 * A single entry in the user's collection, enriched with the full card data.
 */
export interface CollectionEntry {
  id: string;
  cardId: string;
  language: string;
  quantity: number;
  addedAt: string;
  card: TcgCard;
}

/**
 * Request body for adding a card to the collection.
 * The full card payload is included so the backend can cache it.
 */
export interface AddToCollectionRequest {
  cardId: string;
  card: TcgCard;
  language?: string;
  quantity?: number;
}

/**
 * Request body for removing a card from the collection.
 */
export interface RemoveFromCollectionRequest {
  cardId: string;
}

/**
 * Response shape for GET /api/collection.
 */
export interface CollectionResponse {
  entries: CollectionEntry[];
}
