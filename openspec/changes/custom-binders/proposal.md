## Why

PokeHub currently tracks a user's collection as a flat pool of owned cards, but collectors organise their physical cards in binders — themed, paginated sleeves where each slot position matters. Without binder support the app cannot mirror how collectors actually store and display their cards, leaving a core use-case unmet.

## What Changes

- Users can create multiple named binders, each with a chosen icon and a grid size (e.g. 3×3, 4×4).
- A binder is divided into pages; each page is a fixed grid of card slots determined by the chosen size.
- Users can add a card to any empty slot via a search modal (search by card name with autocomplete, or browse by set).
- Users can move, copy, or remove a card from a slot; pages can be added or removed.
- The binders list shows summary stats: owned-card count vs. total slots, page count, and estimated market value.
- Binders are independent of the existing collection — a card can appear in a binder even if it is not marked as owned in the collection, and vice versa.

## Capabilities

### New Capabilities

- `binder-management`: CRUD for binders — create, rename, change icon, change grid size, delete. Includes the binders list page and the binder settings bottom-sheet/modal.
- `binder-card-slots`: Per-slot card assignment within a binder page — place a card in a specific slot, move it to another slot, copy it, clear it. Includes the paginated binder grid view with page navigation.
- `binder-card-search`: Card search modal used when assigning a card to a slot — full-text card search with autocomplete suggestions and a set-browsing tab.

### Modified Capabilities

*(none — binders are additive and do not change existing collection-management requirements)*

## Impact

- **Backend**: New DB tables (`binders`, `binder_pages`, `binder_slots`). New Hono routes under `/api/binders/*`. New service layer in `server/src/services/binderService.ts`.
- **Frontend**: New Next.js route group pages under `ui/src/app/(app)/binders/`. New Client Components for the binder grid, slot actions toolbar, page navigation, and card-search modal. New API Route Handler proxies in `ui/src/app/api/binders/`.
- **Shared types**: New types in `shared/binders.ts` crossing the client/server boundary.
- **Database**: Schema change requires a new Drizzle migration.
- **No breaking changes** to existing collection, auth, or card-search APIs.
