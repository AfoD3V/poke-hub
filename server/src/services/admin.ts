import { eq, and, count, sql } from "drizzle-orm";
import { db } from "../db/client";
import { users, userCollection, userChaseCards, cardsCache } from "../db/schema";
import { createPasswordHash } from "./auth-core";
import type {
  AdminStats,
  AdminUser,
  AdminCollectionEntry,
  AdminChaseEntry,
  AdminCacheStats,
  AdminUsersResponse
} from "../../../shared/admin";

/**
 * Returns true if the user with the given ID has isAdmin = true.
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.isAdmin ?? false;
}

/**
 * Platform-wide stats for the admin dashboard.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const [[userCount], [collectionCount], [chaseCount], [cacheCount]] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(userCollection),
    db.select({ value: count() }).from(userChaseCards),
    db.select({ value: count() }).from(cardsCache)
  ]);

  return {
    totalUsers: Number(userCount?.value ?? 0),
    totalCollectionEntries: Number(collectionCount?.value ?? 0),
    totalChaseCards: Number(chaseCount?.value ?? 0),
    totalCachedCards: Number(cacheCount?.value ?? 0)
  };
}

/**
 * Paginated list of all users with per-user collection and chase counts.
 */
export async function listAdminUsers(
  page: number,
  pageSize: number
): Promise<AdminUsersResponse> {
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      collectionCount: sql<number>`cast(count(distinct ${userCollection.id}) as int)`,
      chaseCount: sql<number>`cast(count(distinct ${userChaseCards.id}) as int)`
    })
    .from(users)
    .leftJoin(userCollection, eq(userCollection.userId, users.id))
    .leftJoin(userChaseCards, eq(userChaseCards.userId, users.id))
    .groupBy(users.id)
    .orderBy(users.createdAt)
    .limit(pageSize)
    .offset(offset);

  const [totalRow] = await db.select({ value: count() }).from(users);

  return {
    users: rows.map((r) => ({
      id: r.id,
      email: r.email,
      displayName: r.displayName,
      isAdmin: r.isAdmin,
      createdAt: r.createdAt.toISOString(),
      collectionCount: r.collectionCount,
      chaseCount: r.chaseCount
    })),
    total: Number(totalRow?.value ?? 0)
  };
}

/**
 * Single user detail with counts.
 */
export async function getAdminUser(id: string): Promise<AdminUser | null> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      collectionCount: sql<number>`cast(count(distinct ${userCollection.id}) as int)`,
      chaseCount: sql<number>`cast(count(distinct ${userChaseCards.id}) as int)`
    })
    .from(users)
    .leftJoin(userCollection, eq(userCollection.userId, users.id))
    .leftJoin(userChaseCards, eq(userChaseCards.userId, users.id))
    .where(eq(users.id, id))
    .groupBy(users.id)
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    isAdmin: row.isAdmin,
    createdAt: row.createdAt.toISOString(),
    collectionCount: row.collectionCount,
    chaseCount: row.chaseCount
  };
}

/**
 * Update displayName and/or isAdmin for a user.
 */
export async function updateAdminUser(
  id: string,
  data: { displayName?: string; isAdmin?: boolean }
): Promise<AdminUser | null> {
  const existing = await getAdminUser(id);
  if (!existing) return null;

  await db
    .update(users)
    .set({
      ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
      ...(data.isAdmin !== undefined ? { isAdmin: data.isAdmin } : {})
    })
    .where(eq(users.id, id));

  return getAdminUser(id);
}

/**
 * Hard-delete a user (collection + chase cascade via FK).
 */
export async function deleteAdminUser(id: string): Promise<boolean> {
  const deleted = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
  return deleted.length > 0;
}

/**
 * Reset a user's password to a new plaintext value.
 */
export async function resetAdminUserPassword(id: string, newPassword: string): Promise<boolean> {
  const passwordHash = createPasswordHash(newPassword);
  const updated = await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, id))
    .returning({ id: users.id });
  return updated.length > 0;
}

/**
 * All collection entries for a given user (without full card payload).
 */
export async function getAdminUserCollection(userId: string): Promise<AdminCollectionEntry[]> {
  const rows = await db
    .select()
    .from(userCollection)
    .where(eq(userCollection.userId, userId))
    .orderBy(userCollection.addedAt);

  return rows.map((r) => ({
    id: r.id,
    cardId: r.cardId,
    language: r.language,
    quantity: r.quantity,
    addedAt: r.addedAt.toISOString()
  }));
}

/**
 * Remove a specific collection entry by its row ID (not cardId).
 */
export async function removeAdminCollectionEntry(
  userId: string,
  entryId: string
): Promise<boolean> {
  const deleted = await db
    .delete(userCollection)
    .where(and(eq(userCollection.id, entryId), eq(userCollection.userId, userId)))
    .returning({ id: userCollection.id });
  return deleted.length > 0;
}

/**
 * All chase entries for a given user.
 */
export async function getAdminUserChase(userId: string): Promise<AdminChaseEntry[]> {
  const rows = await db
    .select()
    .from(userChaseCards)
    .where(eq(userChaseCards.userId, userId))
    .orderBy(userChaseCards.addedAt);

  return rows.map((r) => ({
    id: r.id,
    cardId: r.cardId,
    cardSnapshot: r.cardSnapshot,
    addedAt: r.addedAt.toISOString()
  }));
}

/**
 * Remove a specific chase entry by its row ID.
 */
export async function removeAdminChaseEntry(userId: string, entryId: string): Promise<boolean> {
  const deleted = await db
    .delete(userChaseCards)
    .where(and(eq(userChaseCards.id, entryId), eq(userChaseCards.userId, userId)))
    .returning({ id: userChaseCards.id });
  return deleted.length > 0;
}

/**
 * Cache stats: total count + metadata list.
 */
export async function getAdminCacheStats(): Promise<AdminCacheStats> {
  const rows = await db
    .select({ cardId: cardsCache.cardId, fetchedAt: cardsCache.fetchedAt })
    .from(cardsCache)
    .orderBy(cardsCache.fetchedAt);

  return {
    total: rows.length,
    entries: rows.map((r) => ({ cardId: r.cardId, fetchedAt: r.fetchedAt.toISOString() }))
  };
}

/**
 * Flush entire cards cache. Returns number of rows deleted.
 */
export async function flushAdminCache(): Promise<number> {
  const deleted = await db.delete(cardsCache).returning({ cardId: cardsCache.cardId });
  return deleted.length;
}

/**
 * Flush a single cache entry by cardId. Returns false if it didn't exist.
 */
export async function flushAdminCacheEntry(cardId: string): Promise<boolean> {
  const deleted = await db
    .delete(cardsCache)
    .where(eq(cardsCache.cardId, cardId))
    .returning({ cardId: cardsCache.cardId });
  return deleted.length > 0;
}
