/**
 * Shared type definitions for the Binders feature.
 * Used by both the Hono backend and the Next.js frontend.
 */

/** Card snapshot stored at placement time — avoids live TCG API calls for grid rendering. */
export interface CardSnapshot {
  name: string;
  imageSmall: string;
  setName: string;
  setId: string;
  setCode: string;
  rarity: string | null;
}

/** A single slot within a binder page. */
export interface BinderSlot {
  id: string;
  pageId: string;
  slotIndex: number;
  cardId: string | null;
  cardSnapshot: CardSnapshot | null;
  /** Base64 data URL of a user-uploaded custom image for this slot. */
  customImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A page within a binder. */
export interface BinderPage {
  id: string;
  binderId: string;
  pageNumber: number;
  slots: BinderSlot[];
  createdAt: string;
}

/** Allowed grid size options. */
export type GridSize = '3x3' | '4x4';

/** Full binder with pages and slots. */
export interface Binder {
  id: string;
  userId: string;
  name: string;
  icon: string;
  gridCols: number;
  gridRows: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
  pages: BinderPage[];
}

/** Summary item returned in the binders list — includes computed stats. */
export interface BinderListItem {
  id: string;
  name: string;
  icon: string;
  gridCols: number;
  gridRows: number;
  color?: string;
  pageCount: number;
  filledSlots: number;
  totalSlots: number;
  estimatedValue: number;
  createdAt: string;
  updatedAt: string;
}

/** Request body for creating a binder. */
export interface CreateBinderBody {
  name: string;
  icon?: string;
  gridCols?: number;
  gridRows?: number;
  color?: string;
}

/** Request body for updating a binder. */
export interface UpdateBinderBody {
  name?: string;
  icon?: string;
  gridCols?: number;
  gridRows?: number;
  color?: string;
}

/** Request body for placing a card in a slot. */
export interface PlaceCardBody {
  cardId: string;
  cardSnapshot: CardSnapshot;
}

/** Request body for moving a card from one slot to another. */
export interface MoveCardBody {
  fromPageId: string;
  fromSlotIndex: number;
  toPageId: string;
  toSlotIndex: number;
}

/** Request body for copying a card to another slot. */
export interface CopyCardBody {
  toPageId: string;
  toSlotIndex: number;
}

/** Request body for setting a custom image on a slot. */
export interface SetCustomImageBody {
  /** Base64 data URL (e.g. "data:image/jpeg;base64,..."). Max 2 MB. */
  dataUrl: string;
}
