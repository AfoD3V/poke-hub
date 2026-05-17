import { boolean, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

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

export const userCollection = pgTable("user_collection", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  cardId: text("card_id").notNull(),
  language: text("language").default("en").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull()
});
