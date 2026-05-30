## Context

PokeHub is a Bun + Hono API backend with a Next.js 14 App Router frontend, PostgreSQL + Drizzle ORM, and shared TypeScript types. Currently users can track a flat collection (`userCollection` table) and chase cards (`userChaseCards`). There is no concept of a binder — a physical card binder has pages and fixed grid slots that reflect where each card physically sits.

The images show the reference mobile app (PokeCardex): a binders list, a paginated 4×4 grid view where each slot holds one card, a settings bottom-sheet (name / icon / size), and a search modal (search by name with autocomplete + browse by set).

## Goals / Non-Goals

**Goals:**
- Users can create, rename, configure, and delete named binders.
- Each binder has a configurable grid size (3×3, 4×4) and one or more pages.
- Users can place any TCG card in any slot, move/copy/clear slots.
- Binder list shows summary stats: total slots, filled slots, page count, and estimated value (sum of `cardsCache` prices where available).
- Card search within the binder uses the existing TCG proxy API.
- Full TDD: failing tests before implementation in every task group.

**Non-Goals:**
- Monetisation tiers / subscription limits (all users get unlimited binders for now).
- Card condition grading or quantity tracking within a slot.
- Public / shareable binder links (future).
- Image scan for card identification (future).
- Drag-and-drop reorder between slots (future).

## Decisions

### 1. Data model: three new tables

```
binders          (id, user_id, name, icon, grid_cols, grid_rows, created_at, updated_at)
binder_pages     (id, binder_id, page_number, created_at)
binder_slots     (id, page_id, slot_index, card_id, card_snapshot jsonb, created_at, updated_at)
```

**Why**: A normalised three-table design mirrors the physical object (binder → pages → slots) and makes page reordering and slot queries straightforward. Denormalising into a `jsonb` array per page would make partial updates (move single slot) awkward and prevent indexing on `card_id`.

`card_snapshot` stores `{ name, imageSmall, setName, setId, rarity }` at insert time so the grid renders without a live TCG API call. We already use this pattern in `userChaseCards`.

**Alternative considered**: Single `binder_slots` table with a `(binder_id, page_number, slot_index)` composite — simpler, but removes the ability to add per-page metadata (title, notes) later.

### 2. Grid size stored as cols × rows (integers), not an enum

**Why**: Avoids a DB migration each time a new size is added. Validation (allowed sizes: 3×3, 4×4) lives in the service layer and is enforced via a check constraint.

### 3. Backend routes follow the existing pattern

New route file `server/src/routes/binders.ts`, service `server/src/services/binderService.ts`. Route handlers stay thin; all business logic (ownership checks, page management, slot validation) goes in the service.

Endpoints:
```
GET    /api/binders                   → list user's binders with stats
POST   /api/binders                   → create binder
GET    /api/binders/:id               → get binder with pages and slots
PATCH  /api/binders/:id               → update name/icon/size
DELETE /api/binders/:id               → delete binder + cascade
GET    /api/binders/:id/pages         → list pages
POST   /api/binders/:id/pages         → add page
DELETE /api/binders/:id/pages/:pageId → remove page (fails if slots occupied)
PUT    /api/binders/:id/pages/:pageId/slots/:slotIndex → place/replace card
DELETE /api/binders/:id/pages/:pageId/slots/:slotIndex → clear slot
```

### 4. Frontend: new route group page, not a modal

Binders are a primary navigation section — given the mobile reference app shows them in the bottom nav alongside Home, the desktop sidebar should gain a "Binders" nav item. The binder grid view is a full page (`/binders/[id]`), not a modal, so the URL is shareable.

The card-search modal (`AddCardModal`) is a Client Component shared by slot click actions.

### 5. Estimated value derived from `cardsCache`

When loading binder stats, the backend JOINs `binder_slots.card_id` against `cardsCache.payload->>'price'`. If a card is not cached, its value is treated as 0. No new external API calls at list time.

## Risks / Trade-offs

- **Stale card snapshots** → Cards are snapshotted at placement time. If TCGdex updates artwork or price, the snapshot does not auto-update. Mitigation: a future background job can re-fetch; for now, document this limitation.
- **Large binders** → A user with 50 pages × 16 slots = 800 slots per binder. The list stats query does a COUNT + SUM per binder; index on `binder_slots.page_id` mitigates this.
- **Grid size change with existing slots** → If the user shrinks the grid (e.g. 4×4 → 3×3) slots beyond the new capacity become orphaned. Decision: disallow size change if any page has slots outside the new bounds; surface a clear error.

## Migration Plan

1. `bun run db:generate` in `server/` after adding tables to `schema.ts`.
2. `docker compose up -d --build` applies the migration via the `migrate` service.
3. No data migration required (feature is additive).
4. Rollback: down migration drops the three new tables (no existing data affected).

## Open Questions

- **Icon set**: The reference app uses custom Pokémon-themed icons. For initial implementation, a curated list of 10–15 Lucide icons (e.g. BookOpen, Star, Heart, Flame…) is sufficient. Expand later.
- **Page removal with occupied slots**: Block or auto-clear? Decision above says block. Revisit if UX feedback suggests auto-clear is preferred.
