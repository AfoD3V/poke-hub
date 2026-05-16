import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { userChaseCards } from "../db/schema";
import type { ChaseEntry, CardSnapshot } from "../../../shared/tcg";

/**
 * Returns all chase entries for a user.
 */
export async function listChase(userId: string): Promise<ChaseEntry[]> {
  const rows = await db
    .select()
    .from(userChaseCards)
    .where(eq(userChaseCards.userId, userId))
    .orderBy(userChaseCards.addedAt);

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    cardId: r.cardId,
    cardSnapshot: r.cardSnapshot,
    addedAt: r.addedAt.toISOString()
  }));
}

/**
 * Adds a card to the user's chase list (upsert — duplicate is a no-op
 * that returns the existing row).
 */
export async function addChase(
  userId: string,
  cardId: string,
  cardSnapshot: CardSnapshot
): Promise<ChaseEntry> {
  const [row] = await db
    .insert(userChaseCards)
    .values({ userId, cardId, cardSnapshot })
    .onConflictDoUpdate({
      target: [userChaseCards.userId, userChaseCards.cardId],
      set: { cardSnapshot }
    })
    .returning();

  return {
    id: row.id,
    userId: row.userId,
    cardId: row.cardId,
    cardSnapshot: row.cardSnapshot,
    addedAt: row.addedAt.toISOString()
  };
}

/**
 * Removes a card from the user's chase list.
 * Returns true if a row was deleted, false if the card wasn't in the list.
 */
export async function removeChase(userId: string, cardId: string): Promise<boolean> {
  const deleted = await db
    .delete(userChaseCards)
    .where(and(eq(userChaseCards.userId, userId), eq(userChaseCards.cardId, cardId)))
    .returning({ id: userChaseCards.id });

  return deleted.length > 0;
}
