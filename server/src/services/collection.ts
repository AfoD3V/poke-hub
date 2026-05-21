import { eq, and, inArray, sql as drizzleSql } from "drizzle-orm";
import { db, sql } from "../db/client";
import { userCollection, cardsCache } from "../db/schema";
import type { TcgCard } from "../../../shared/tcg";
import type { CollectionEntry } from "../../../shared/collection";

/**
 * Adds a card to the user's collection. Also upserts the card payload into
 * cards_cache so the collection page can render full card data without hitting
 * the upstream TCG API again.
 * 
 * If the card is already in the collection, the quantity is incremented.
 */
export async function addCardToCollection(
  userId: string,
  cardId: string,
  card: TcgCard,
  language: string = "en",
  quantity: number = 1
): Promise<{ id: string; cardId: string; language: string; quantity: number; addedAt: Date }> {
  await db
    .insert(cardsCache)
    .values({ cardId, payload: card as Record<string, unknown> })
    .onConflictDoUpdate({
      target: cardsCache.cardId,
      set: { payload: card as Record<string, unknown>, fetchedAt: new Date() }
    });

  const [entry] = await db
    .insert(userCollection)
    .values({ userId, cardId, language, quantity })
    .onConflictDoUpdate({
      target: [userCollection.userId, userCollection.cardId],
      set: {
        quantity: drizzleSql`${userCollection.quantity} + ${quantity}`,
        language,
        addedAt: new Date()
      }
    })
    .returning();

  // Notify any LISTEN subscribers so WebSocket clients get a real-time event.
  await sql.notify("collection_insert", JSON.stringify({
    cardId,
    cardName: card.name,
    userId,
  })).catch(() => {
    // Non-fatal: real-time push is best-effort
  });

  return entry;
}

/**
 * Removes a card (by cardId) from the user's collection.
 * With the unique constraint on (userId, cardId), this removes exactly one row.
 * Returns true if the row was deleted, false if the card wasn't found.
 */
export async function removeCardFromCollection(userId: string, cardId: string): Promise<boolean> {
  const deleted = await db
    .delete(userCollection)
    .where(and(eq(userCollection.userId, userId), eq(userCollection.cardId, cardId)))
    .returning({ id: userCollection.id });

  return deleted.length > 0;
}

/**
 * Returns all collection entries for a user, each enriched with the full card
 * data from the cards_cache table. Entries whose card cache has been evicted
 * are omitted.
 */
export async function getUserCollection(userId: string): Promise<CollectionEntry[]> {
  const entries = await db
    .select()
    .from(userCollection)
    .where(eq(userCollection.userId, userId))
    .orderBy(userCollection.addedAt);

  if (entries.length === 0) return [];

  const cardIds = entries.map((e) => e.cardId);
  const cached = await db
    .select()
    .from(cardsCache)
    .where(inArray(cardsCache.cardId, cardIds));

  const cardMap = new Map(cached.map((c) => [c.cardId, c.payload as unknown as TcgCard]));

  return entries
    .filter((e) => cardMap.has(e.cardId))
    .map((e) => ({
      id: e.id,
      cardId: e.cardId,
      language: e.language,
      quantity: e.quantity,
      addedAt: e.addedAt.toISOString(),
      card: cardMap.get(e.cardId)!
    }));
}
