## 1. Tests (Write First — TDD)

- [x] 1.1 Write failing Vitest tests for `GET /api/chase`, `POST /api/chase/add`, `DELETE /api/chase/remove` in `server/src/routes/chase.test.ts` — cover success, duplicate add, not-found remove, and unauthenticated access
- [x] 1.2 Write failing Vitest test for the SvelteKit proxy endpoint: mock `fetch` to verify it forwards cookie header and returns JSON on backend error (502)
- [x] 1.3 Run `bun run test` in `server/` and confirm all new tests are red (failing)

## 2. Database Schema

- [x] 2.1 Add `userChaseCards` table to `server/src/db/schema.ts` with columns: `id` (UUID PK), `userId` (FK → users, cascade delete), `cardId` (text), `cardSnapshot` (JSONB), `addedAt` (timestamptz); add unique constraint on `(userId, cardId)`
- [x] 2.2 Run `bun run db:generate` in `server/` to create the migration file; verify migration file appears in `server/src/db/migrations/`
- [x] 2.3 Run `docker compose up -d --build` and check `docker compose logs migrate` — confirm migration applied successfully

## 3. Shared Types

- [x] 3.1 Add `ChaseEntry` and `CardSnapshot` types to `shared/tcg.ts` (or a new `shared/chase.ts`) — `CardSnapshot: { name: string; setName: string; setId: string; imageSmall: string }`, `ChaseEntry: { id: string; userId: string; cardId: string; cardSnapshot: CardSnapshot; addedAt: string }`

## 4. Backend — Chase Routes

- [x] 4.1 Create `server/src/services/chaseService.ts` with `listChase(userId)`, `addChase(userId, cardId, cardSnapshot)` (upsert), `removeChase(userId, cardId)` using Drizzle ORM — no raw SQL
- [x] 4.2 Create `server/src/routes/chase.ts` with `GET /api/chase`, `POST /api/chase/add`, `DELETE /api/chase/remove` route handlers; protect with `requireAuth` middleware
- [x] 4.3 Register chase routes in `server/src/app.ts`: `app.use('/api/chase/*', requireAuth)` and `app.route('/api/chase', chaseRoutes)`
- [x] 4.4 Run `bun run test` in `server/` — confirm chase route tests are now green
- [x] 4.5 Add chase endpoints to the Postman collection (`docs/postman/`) with status and response shape assertions

## 5. Backend — Collection Add Proxy Fix

- [x] 5.1 Create `ui/src/routes/api/collection/add/+server.ts` — `POST` handler that reads `event.request.headers.get('cookie')`, forwards the JSON body to `${API_BASE_URL}/api/collection/add`, and returns the upstream response (status + body); catch fetch errors and return `{ error: "Backend unavailable" }` with status 502
- [x] 5.2 Run `docker compose up -d --build` and open the app at `http://localhost:4000`; open a card modal and click "Add to Collection" — verify success state appears (no JSON parse error)

## 6. Frontend — Chase Toggle in CardModal

- [x] 6.1 Update `CardModal.svelte` to accept a `chaseIds: Set<string>` prop (or read from a Svelte store); derive `isChaseing = chaseIds.has(card.id)` reactively
- [x] 6.2 Add `toggleChase()` async function: if chasing → `DELETE /api/chase/remove`; else → `POST /api/chase/add` with `cardSnapshot` built from `card`; update local state optimistically
- [x] 6.3 Add Chase button to the card detail panel — unfilled star icon + "Chase" label when inactive; filled star + "Chasing" label when active; show loading spinner during request
- [x] 6.4 Pass `chaseIds` down from collection/search pages that render `CardModal`; use `svelte-code-writer` and `svelte-core-bestpractices` skills before editing any `.svelte` file
- [x] 6.5 Visual verification: open a card modal → click "Chase" → button turns active; click again → turns inactive; reload page → state persists (loaded from server)

## 7. Frontend — Home Dashboard Stats

- [x] 7.1 Update `home/+page.server.ts` to also call `GET /api/chase` (forwarding cookie); compute `setBreakdown` (array of `{ setName, count }` sorted desc) and `rarityBreakdown` (object of rarity → count) from collection entries
- [x] 7.2 Update `home/+page.svelte` to render the enhanced stats: add a "By Set" subsection showing top sets with bar/count, and a "Rarity" subsection with counts per tier; use `ui-ux-pro-max` skill before editing
- [x] 7.3 Add the Chase Board section to `home/+page.svelte`: only render when `chaseEntries.length > 0`; group entries by `cardSnapshot.setName`; show set name + card thumbnails; clicking a thumbnail opens `CardModal` with the `isChaseing` flag set

## 8. Lint, Type-Check, Tests

- [x] 8.1 Run `bun run lint` from repo root — zero ESLint errors
- [x] 8.2 Run `bun run check` in `ui/` — zero TypeScript / svelte-check errors
- [x] 8.3 Run `bun run test` in `server/` and `ui/` — all tests pass
- [x] 8.4 Use `playwright-cli` to take a snapshot of the home page showing collection stats + chase board; take a snapshot of a card modal showing both "Add to Collection" and "Chase" buttons

## 9. Security & Wrap-Up

- [x] 9.1 Run `security-secure-coding` skill — resolve all findings
- [x] 9.2 Document any new gotchas in `AGENTS.md` > Project Learnings (e.g., SvelteKit proxy endpoint pattern for Docker)
- [x] 9.3 Update both `CLAUDE.md` and `AGENTS.md` to keep them in sync
- [x] 9.4 Push branch and open PR via `gh pr create`
