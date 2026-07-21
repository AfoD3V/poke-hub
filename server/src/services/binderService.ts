import { eq, and, count, sql as drizzleSql } from "drizzle-orm";
import { db } from "../db/client";
import { binders, binderPages, binderSlots, cardsCache } from "../db/schema";
import type {
  Binder,
  BinderPage,
  BinderSlot,
  BinderListItem,
  CardSnapshot
} from "../../../shared/binders";

// ── Allowed grid sizes ────────────────────────────────────────────────────────

const MIN_GRID = 1;
const MAX_GRID = 10;

export function isValidGridSize(cols: number, rows: number): boolean {
  return (
    Number.isInteger(cols) && Number.isInteger(rows) &&
    cols >= MIN_GRID && cols <= MAX_GRID &&
    rows >= MIN_GRID && rows <= MAX_GRID
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toBinderSlot(r: typeof binderSlots.$inferSelect): BinderSlot {
  return {
    id: r.id,
    pageId: r.pageId,
    slotIndex: r.slotIndex,
    cardId: r.cardId ?? null,
    cardSnapshot: r.cardSnapshot as CardSnapshot | null,
    customImageUrl: r.customImageUrl ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  };
}

function toBinderPage(
  r: typeof binderPages.$inferSelect,
  slots: BinderSlot[]
): BinderPage {
  return {
    id: r.id,
    binderId: r.binderId,
    pageNumber: r.pageNumber,
    slots,
    createdAt: r.createdAt.toISOString()
  };
}

function toBinder(
  r: typeof binders.$inferSelect,
  pages: BinderPage[]
): Binder {
  return {
    id: r.id,
    userId: r.userId,
    name: r.name,
    icon: r.icon,
    gridCols: r.gridCols,
    gridRows: r.gridRows,
    color: r.color,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    pages
  };
}

// ── CRUD: Binder ──────────────────────────────────────────────────────────────

export async function createBinder(
  userId: string,
  name: string,
  icon = "book-open",
  gridCols = 4,
  gridRows = 4,
  color = "purple"
): Promise<Binder> {
  const [binderRow] = await db
    .insert(binders)
    .values({ userId, name: name.trim(), icon, gridCols, gridRows, color })
    .returning();

  // Create the first page automatically
  const [pageRow] = await db
    .insert(binderPages)
    .values({ binderId: binderRow.id, pageNumber: 1 })
    .returning();

  return toBinder(binderRow, [toBinderPage(pageRow, [])]);
}

export async function listBinders(userId: string): Promise<BinderListItem[]> {
  const rows = await db
    .select()
    .from(binders)
    .where(eq(binders.userId, userId))
    .orderBy(binders.createdAt);

  if (rows.length === 0) return [];

  // Compute stats for each binder in one query per binder (acceptable for typical counts)
  const items: BinderListItem[] = await Promise.all(
    rows.map(async (b) => {
      const [stats] = await db
        .select({
          pageCount: count(binderPages.id),
        })
        .from(binderPages)
        .where(eq(binderPages.binderId, b.id));

      const [slotStats] = await db
        .select({
          filledSlots: drizzleSql<number>`cast(count(${binderSlots.cardId}) filter (where ${binderSlots.cardId} is not null) as integer)`,
        })
        .from(binderSlots)
        .innerJoin(binderPages, eq(binderSlots.pageId, binderPages.id))
        .where(eq(binderPages.binderId, b.id));

      const pageCount = Number(stats?.pageCount ?? 0);
      const totalSlots = pageCount * b.gridCols * b.gridRows;
      const filledSlots = Number(slotStats?.filledSlots ?? 0);

      // Estimate value from cached card prices
      const [valueResult] = await db
        .select({
          estimatedValue: drizzleSql<number>`coalesce(sum(cast(${cardsCache.payload}->>'price' as numeric)), 0)`
        })
        .from(binderSlots)
        .innerJoin(binderPages, eq(binderSlots.pageId, binderPages.id))
        .leftJoin(cardsCache, eq(binderSlots.cardId, cardsCache.cardId))
        .where(
          and(
            eq(binderPages.binderId, b.id),
            drizzleSql`${binderSlots.cardId} is not null`
          )
        );

      return {
        id: b.id,
        name: b.name,
        icon: b.icon,
        gridCols: b.gridCols,
        gridRows: b.gridRows,
        color: b.color,
        pageCount,
        filledSlots,
        totalSlots,
        estimatedValue: Number(valueResult?.estimatedValue ?? 0),
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString()
      };
    })
  );

  return items;
}

export async function getBinderById(
  userId: string,
  binderId: string
): Promise<Binder | null> {
  const [binderRow] = await db
    .select()
    .from(binders)
    .where(and(eq(binders.id, binderId), eq(binders.userId, userId)));

  if (!binderRow) return null;

  const pageRows = await db
    .select()
    .from(binderPages)
    .where(eq(binderPages.binderId, binderId))
    .orderBy(binderPages.pageNumber);

  const pages: BinderPage[] = await Promise.all(
    pageRows.map(async (p) => {
      const slotRows = await db
        .select()
        .from(binderSlots)
        .where(eq(binderSlots.pageId, p.id))
        .orderBy(binderSlots.slotIndex);
      return toBinderPage(p, slotRows.map(toBinderSlot));
    })
  );

  return toBinder(binderRow, pages);
}

export async function updateBinder(
  userId: string,
  binderId: string,
  updates: { name?: string; icon?: string; gridCols?: number; gridRows?: number; color?: string }
): Promise<Binder | null> {
  const [binderRow] = await db
    .select()
    .from(binders)
    .where(and(eq(binders.id, binderId), eq(binders.userId, userId)));

  if (!binderRow) return null;

  // Validate grid size if being changed
  const newCols = updates.gridCols ?? binderRow.gridCols;
  const newRows = updates.gridRows ?? binderRow.gridRows;
  if (updates.gridCols !== undefined || updates.gridRows !== undefined) {
    if (!isValidGridSize(newCols, newRows)) {
      const err = new Error("invalid_grid_size") as Error & { code: string };
      err.code = "INVALID_GRID_SIZE";
      throw err;
    }

    // Check if any existing slot would be out of bounds after the size change
    const maxNewSlotIndex = newCols * newRows - 1;
    const [outOfBounds] = await db
      .select({ count: count() })
      .from(binderSlots)
      .innerJoin(binderPages, eq(binderSlots.pageId, binderPages.id))
      .where(
        and(
          eq(binderPages.binderId, binderId),
          drizzleSql`${binderSlots.cardId} is not null`,
          drizzleSql`${binderSlots.slotIndex} > ${maxNewSlotIndex}`
        )
      );

    if (Number(outOfBounds?.count ?? 0) > 0) {
      const err = new Error("slots_out_of_bounds") as Error & { code: string };
      err.code = "SLOTS_OUT_OF_BOUNDS";
      throw err;
    }
  }

  const updateValues: Partial<typeof binders.$inferInsert> = {};
  if (updates.name !== undefined) updateValues.name = updates.name.trim();
  if (updates.icon !== undefined) updateValues.icon = updates.icon;
  if (updates.gridCols !== undefined) updateValues.gridCols = updates.gridCols;
  if (updates.gridRows !== undefined) updateValues.gridRows = updates.gridRows;
  if (updates.color !== undefined) updateValues.color = updates.color;

  const [updated] = await db
    .update(binders)
    .set(updateValues)
    .where(and(eq(binders.id, binderId), eq(binders.userId, userId)))
    .returning();

  if (!updated) return null;
  return getBinderById(userId, binderId);
}

export async function deleteBinder(
  userId: string,
  binderId: string
): Promise<boolean> {
  const deleted = await db
    .delete(binders)
    .where(and(eq(binders.id, binderId), eq(binders.userId, userId)))
    .returning({ id: binders.id });

  return deleted.length > 0;
}

// ── Pages ─────────────────────────────────────────────────────────────────────

export async function addPage(
  userId: string,
  binderId: string
): Promise<BinderPage | null> {
  // Verify ownership
  const [binderRow] = await db
    .select()
    .from(binders)
    .where(and(eq(binders.id, binderId), eq(binders.userId, userId)));

  if (!binderRow) return null;

  // Determine next page number
  const existingPages = await db
    .select({ pageNumber: binderPages.pageNumber })
    .from(binderPages)
    .where(eq(binderPages.binderId, binderId))
    .orderBy(binderPages.pageNumber);

  const nextPageNumber = existingPages.length > 0
    ? (existingPages[existingPages.length - 1].pageNumber + 1)
    : 1;

  const [pageRow] = await db
    .insert(binderPages)
    .values({ binderId, pageNumber: nextPageNumber })
    .returning();

  return toBinderPage(pageRow, []);
}

export async function removePage(
  userId: string,
  binderId: string,
  pageId: string
): Promise<boolean> {
  // Verify ownership via binder
  const [binderRow] = await db
    .select()
    .from(binders)
    .where(and(eq(binders.id, binderId), eq(binders.userId, userId)));

  if (!binderRow) return false;

  // Check page belongs to binder
  const [pageRow] = await db
    .select()
    .from(binderPages)
    .where(and(eq(binderPages.id, pageId), eq(binderPages.binderId, binderId)));

  if (!pageRow) return false;

  // Block removal if page has occupied slots
  const [occupiedCheck] = await db
    .select({ count: count() })
    .from(binderSlots)
    .where(
      and(
        eq(binderSlots.pageId, pageId),
        drizzleSql`${binderSlots.card_id} is not null`
      )
    );

  if (Number(occupiedCheck?.count ?? 0) > 0) {
    const err = new Error("page_has_slots") as Error & { code: string };
    err.code = "PAGE_HAS_SLOTS";
    throw err;
  }

  const deleted = await db
    .delete(binderPages)
    .where(eq(binderPages.id, pageId))
    .returning({ id: binderPages.id });

  return deleted.length > 0;
}

// ── Slots ─────────────────────────────────────────────────────────────────────

/** Verifies the page belongs to a binder owned by userId. */
async function verifyPageOwnership(
  userId: string,
  binderId: string,
  pageId: string
): Promise<boolean> {
  const [pageRow] = await db
    .select({ id: binderPages.id })
    .from(binderPages)
    .innerJoin(binders, eq(binderPages.binderId, binders.id))
    .where(
      and(
        eq(binderPages.id, pageId),
        eq(binderPages.binderId, binderId),
        eq(binders.userId, userId)
      )
    );
  return !!pageRow;
}

export async function placeCard(
  userId: string,
  binderId: string,
  pageId: string,
  slotIndex: number,
  cardId: string,
  cardSnapshot: CardSnapshot
): Promise<BinderSlot | null> {
  const owned = await verifyPageOwnership(userId, binderId, pageId);
  if (!owned) return null;

  const [slotRow] = await db
    .insert(binderSlots)
    .values({ pageId, slotIndex, cardId, cardSnapshot })
    .onConflictDoUpdate({
      target: [binderSlots.pageId, binderSlots.slotIndex],
      set: { cardId, cardSnapshot, updatedAt: new Date() }
    })
    .returning();

  return toBinderSlot(slotRow);
}

export async function clearSlot(
  userId: string,
  binderId: string,
  pageId: string,
  slotIndex: number
): Promise<boolean> {
  const owned = await verifyPageOwnership(userId, binderId, pageId);
  if (!owned) return false;

  // Clear by setting cardId and cardSnapshot to null (upsert to keep slot row)
  await db
    .insert(binderSlots)
    .values({ pageId, slotIndex, cardId: null, cardSnapshot: null })
    .onConflictDoUpdate({
      target: [binderSlots.pageId, binderSlots.slotIndex],
      set: { cardId: null, cardSnapshot: null, updatedAt: new Date() }
    });

  return true;
}

export async function moveCard(
  userId: string,
  binderId: string,
  fromPageId: string,
  fromSlotIndex: number,
  toPageId: string,
  toSlotIndex: number
): Promise<boolean> {
  const [fromOwned, toOwned] = await Promise.all([
    verifyPageOwnership(userId, binderId, fromPageId),
    verifyPageOwnership(userId, binderId, toPageId)
  ]);
  if (!fromOwned || !toOwned) return false;

  // Get the source slot
  const [fromSlot] = await db
    .select()
    .from(binderSlots)
    .where(
      and(eq(binderSlots.pageId, fromPageId), eq(binderSlots.slotIndex, fromSlotIndex))
    );

  if (!fromSlot || !fromSlot.cardId) return false;

  // Get the destination slot (may be empty or occupied)
  const [toSlot] = await db
    .select()
    .from(binderSlots)
    .where(
      and(eq(binderSlots.pageId, toPageId), eq(binderSlots.slotIndex, toSlotIndex))
    );

  // Place source card at destination
  await db
    .insert(binderSlots)
    .values({ pageId: toPageId, slotIndex: toSlotIndex, cardId: fromSlot.cardId, cardSnapshot: fromSlot.cardSnapshot })
    .onConflictDoUpdate({
      target: [binderSlots.pageId, binderSlots.slotIndex],
      set: { cardId: fromSlot.cardId, cardSnapshot: fromSlot.cardSnapshot, updatedAt: new Date() }
    });

  // Place destination card (or null) at source — swap semantics
  const swapCardId = toSlot?.cardId ?? null;
  const swapSnapshot = toSlot?.cardSnapshot ?? null;
  await db
    .insert(binderSlots)
    .values({ pageId: fromPageId, slotIndex: fromSlotIndex, cardId: swapCardId, cardSnapshot: swapSnapshot })
    .onConflictDoUpdate({
      target: [binderSlots.pageId, binderSlots.slotIndex],
      set: { cardId: swapCardId, cardSnapshot: swapSnapshot, updatedAt: new Date() }
    });

  return true;
}

export async function setSlotCustomImage(
  userId: string,
  binderId: string,
  pageId: string,
  slotIndex: number,
  dataUrl: string
): Promise<BinderSlot | null> {
  const owned = await verifyPageOwnership(userId, binderId, pageId);
  if (!owned) return null;

  // Slot must exist and have a card
  const [existing] = await db
    .select()
    .from(binderSlots)
    .where(and(eq(binderSlots.pageId, pageId), eq(binderSlots.slotIndex, slotIndex)));

  if (!existing || !existing.cardId) return null;

  const [updated] = await db
    .update(binderSlots)
    .set({ customImageUrl: dataUrl, updatedAt: new Date() })
    .where(and(eq(binderSlots.pageId, pageId), eq(binderSlots.slotIndex, slotIndex)))
    .returning();

  return updated ? toBinderSlot(updated) : null;
}

export async function clearSlotCustomImage(
  userId: string,
  binderId: string,
  pageId: string,
  slotIndex: number
): Promise<boolean> {
  const owned = await verifyPageOwnership(userId, binderId, pageId);
  if (!owned) return false;

  await db
    .update(binderSlots)
    .set({ customImageUrl: null, updatedAt: new Date() })
    .where(and(eq(binderSlots.pageId, pageId), eq(binderSlots.slotIndex, slotIndex)));

  return true;
}

export async function copyCard(
  userId: string,
  binderId: string,
  fromPageId: string,
  fromSlotIndex: number,
  toPageId: string,
  toSlotIndex: number
): Promise<BinderSlot | null> {
  const [fromOwned, toOwned] = await Promise.all([
    verifyPageOwnership(userId, binderId, fromPageId),
    verifyPageOwnership(userId, binderId, toPageId)
  ]);
  if (!fromOwned || !toOwned) return null;

  const [fromSlot] = await db
    .select()
    .from(binderSlots)
    .where(
      and(eq(binderSlots.pageId, fromPageId), eq(binderSlots.slotIndex, fromSlotIndex))
    );

  if (!fromSlot || !fromSlot.cardId) return null;

  const [slotRow] = await db
    .insert(binderSlots)
    .values({
      pageId: toPageId,
      slotIndex: toSlotIndex,
      cardId: fromSlot.cardId,
      cardSnapshot: fromSlot.cardSnapshot
    })
    .onConflictDoUpdate({
      target: [binderSlots.pageId, binderSlots.slotIndex],
      set: { cardId: fromSlot.cardId, cardSnapshot: fromSlot.cardSnapshot, updatedAt: new Date() }
    })
    .returning();

  return toBinderSlot(slotRow);
}
