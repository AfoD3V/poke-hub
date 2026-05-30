import { boolean, check, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export const cardsCache = pgTable("cards_cache", {
  cardId: text("card_id").primaryKey(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull()
});

export const userChaseCards = pgTable(
  "user_chase_cards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardId: text("card_id").notNull(),
    cardSnapshot: jsonb("card_snapshot")
      .$type<{ name: string; setName: string; setId: string; imageSmall: string }>()
      .notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [unique("user_chase_cards_user_card_unique").on(t.userId, t.cardId)]
);

export const userCollection = pgTable(
  "user_collection",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardId: text("card_id").notNull(),
    language: text("language").default("en").notNull(),
    quantity: integer("quantity").default(1).notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [unique("user_collection_user_card_unique").on(t.userId, t.cardId)]
);

// ── Binders ───────────────────────────────────────────────────────────────────

export const binders = pgTable(
  "binders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("book-open"),
    gridCols: integer("grid_cols").notNull().default(4),
    gridRows: integer("grid_rows").notNull().default(4),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  (t) => [
    check("binders_grid_size_check", sql`(${t.gridCols} = 3 AND ${t.gridRows} = 3) OR (${t.gridCols} = 4 AND ${t.gridRows} = 4)`)
  ]
);

export const binderPages = pgTable("binder_pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  binderId: uuid("binder_id")
    .notNull()
    .references(() => binders.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const binderSlots = pgTable(
  "binder_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => binderPages.id, { onDelete: "cascade" }),
    slotIndex: integer("slot_index").notNull(),
    cardId: text("card_id"),
    cardSnapshot: jsonb("card_snapshot")
      .$type<{
        name: string;
        imageSmall: string;
        setName: string;
        setId: string;
        setCode: string;
        rarity: string | null;
      }>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  (t) => [unique("binder_slots_page_slot_unique").on(t.pageId, t.slotIndex)]
);
