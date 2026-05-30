## 1. Tests — Shared Types & Backend (write failing tests first)

- [x] 1.1 Add `shared/binders.ts` with `Binder`, `BinderPage`, `BinderSlot`, `BinderListItem`, `CreateBinderBody`, `UpdateBinderBody`, `PlaceCardBody` types — verify `npm run check` in `ui/` passes with no new errors
- [x] 1.2 Write failing Vitest tests in `server/src/routes/binders.test.ts` covering: create binder (valid + missing name + invalid grid), list binders (stats shape), get binder (own + other user's → 404), update binder (rename + grid-shrink blocked), delete binder (cascade + other user → 404), add page, remove empty page, remove occupied page → 409
- [x] 1.3 Write failing Vitest tests for slot mutations: place card, replace card, clear slot, move card, copy card — ownership enforced (other user → 404)
- [x] 1.4 Run `bun run test` in `server/` and confirm all new tests are **red**

## 2. Database Schema & Migration

- [x] 2.1 Add `binders`, `binder_pages`, `binder_slots` tables to `server/src/db/schema.ts` per design (cols, rows, icon, card_snapshot jsonb, unique constraints, cascades) — verify file compiles cleanly
- [x] 2.2 Run `bun run db:generate` in `server/` to produce the migration file; inspect the generated SQL for correctness
- [x] 2.3 Run `docker compose up -d --build` and verify `docker compose logs migrate` shows the migration applied without errors

## 3. Backend — Binder Service

- [x] 3.1 Create `server/src/services/binderService.ts` with `createBinder`, `listBinders` (with stats JOIN), `getBinderById`, `updateBinder` (grid-shrink check), `deleteBinder`
- [x] 3.2 Add `addPage`, `removePage` (occupied check) to `binderService.ts`
- [x] 3.3 Add slot functions to `binderService.ts`: `placeCard`, `clearSlot`, `moveCard`, `copyCard` (all verify ownership via binder lookup)
- [x] 3.4 Run `bun run test` in `server/` — all binder service tests should be **green**

## 4. Backend — Binder Routes

- [x] 4.1 Create `server/src/routes/binders.ts` with route handlers for all endpoints listed in design (GET /api/binders, POST /api/binders, GET /api/binders/:id, PATCH /api/binders/:id, DELETE /api/binders/:id, POST/DELETE pages, PUT/DELETE slot)
- [x] 4.2 Register the binder router in `server/src/index.ts` (or app entry) under `/api/binders`
- [x] 4.3 Run `bun run test` in `server/` — all route-level tests should be **green**; run `bun run lint` — zero errors

## 5. Backend — Postman Collection

- [x] 5.1 Add a "Binders" folder to `docs/postman/` with requests for every endpoint (create, list, get, update, delete, add page, remove page, place card, clear slot, move card) including status and shape assertions
- [x] 5.2 Manually execute the collection against the running Docker stack and confirm all requests pass

## 6. Frontend — Tests (write failing tests first)

- [x] 6.1 Write failing Vitest + React Testing Library tests for `BinderCard` component (renders name, icon, stats), `BinderGrid` (correct slot count, occupied vs empty), `AddCardModal` (opens on empty slot click, closes on Escape, calls callback on card select)
- [x] 6.2 Run `bun run test` in `ui/` and confirm new tests are **red**

## 7. Frontend — Shared Types & API Proxy Helpers

- [x] 7.1 Add Next.js API Route Handler proxies in `ui/src/app/api/binders/` covering all binder endpoints — use the existing `proxyGet/proxyPost/proxyDelete` helpers from `apiProxy.ts`
- [x] 7.2 Add a `ui/src/lib/api/binders.ts` client helper with typed fetch wrappers for each endpoint

## 8. Frontend — Binders List Page

- [x] 8.1 Add "Binders" nav item to the sidebar (`ui/src/lib/components/Sidebar.tsx` or equivalent) and bottom navigation
- [x] 8.2 Create `ui/src/app/(app)/binders/page.tsx` as a Server Component — fetch binder list and render `<BinderList>` with stats cards
- [x] 8.3 Build `BinderCard` Client Component showing binder name, icon, page count, filled/total slots — clicking navigates to `/binders/[id]`
- [x] 8.4 Add "New Binder" button that opens `<CreateBinderModal>`; on save, optimistically prepend the new binder to the list
- [x] 8.5 Run `docker compose up -d --build`; use `playwright-cli` to snapshot `/binders` — verify nav item present, list renders, create modal opens

## 9. Frontend — Create & Edit Binder Modal

- [x] 9.1 Build `CreateEditBinderModal` Client Component with: name text input, icon dropdown (10–15 Lucide icons), grid-size dropdown (3×3, 4×4), Cancel/Save buttons, and (edit mode only) "Delete binder" destructive button
- [x] 9.2 Wire Save → POST /api/binders (create) or PATCH /api/binders/:id (edit); on success close modal and refresh binder list
- [x] 9.3 Wire Delete → DELETE /api/binders/:id with confirmation; on success navigate to `/binders`
- [x] 9.4 Snapshot the create modal and edit modal via `playwright-cli` — verify pre-population in edit mode

## 10. Frontend — Binder Grid View Page

- [x] 10.1 Create `ui/src/app/(app)/binders/[id]/page.tsx` as a Server Component — fetch binder with pages/slots and render `<BinderPageView>`
- [x] 10.2 Build `BinderGrid` Client Component rendering cols×rows slot cells; occupied slot shows card thumbnail + rarity badge + set-code badge; empty slot shows "+" icon
- [x] 10.3 Build `PageNavigation` Client Component with prev/next buttons and "X / Y" indicator; prev disabled on page 1, next disabled on last page; settings gear button opens the edit modal
- [x] 10.4 Build `SlotActionToolbar` Client Component that appears when a slot is selected: Edit (open search modal), Clear, Move (enter move mode), Copy (enter copy mode); dismisses on outside click or Escape
- [x] 10.5 Implement move mode: after selecting Move, user clicks a destination slot — swap or move card, then exit move mode
- [x] 10.6 Implement copy mode: after selecting Copy, user clicks a destination slot — place duplicate, then exit copy mode
- [x] 10.7 Run `docker compose up -d --build`; use `playwright-cli` to open a binder, verify grid renders with correct slot count, page navigation works

## 11. Frontend — Add Card Modal (Card Search)

- [x] 11.1 Build `AddCardModal` Client Component with Cards/Sets tabs, close button, Escape key handler, ARIA `role="dialog"` with `aria-label`, focus trap, and focus restore on close
- [x] 11.2 Cards tab: text input with debounced calls to `/api/cards/search?q=...` (min 2 chars); render autocomplete dropdown from results; selecting suggestion populates input and shows 3-column card grid
- [x] 11.3 Cards tab: each card tile shows thumbnail, set-code badge, zoom icon (future preview), and add icon; clicking add icon calls `onSelect(card)` callback and closes modal
- [x] 11.4 Sets tab: fetch set list from existing API; render set list with logo + code badge + name; text input filters list; clicking a set shows its cards in a grid with same add-icon UX
- [x] 11.5 Wire `AddCardModal` to empty-slot click in `BinderGrid`; on `onSelect(card)` call PUT slot endpoint and update slot state
- [x] 11.6 Run `bun run test` in `ui/` — all component tests **green**; run `npm run check` — no type errors
- [x] 11.7 Use `playwright-cli` to open a binder, click an empty slot, search "Bulbasaur", select a card — verify it appears in the slot

## 12. Verification & Cleanup

- [x] 12.1 Run `bun run lint` from repo root — zero errors
- [x] 12.2 Run `bun run test` in both `server/` and `ui/` — all tests pass
- [x] 12.3 Run `npm run check` in `ui/` — zero type errors
- [x] 12.4 Full end-to-end `playwright-cli` walkthrough: create binder → enter binder → add card to slot → move card → clear slot → edit binder name → delete binder; take screenshots to `screenshots/binders-*.png`
- [x] 12.5 Document any new gotchas in `AGENTS.md` > Project Learnings
- [x] 12.6 Invoke `security-secure-coding` skill and resolve all findings
- [x] 12.7 Push feature branch and open PR via `gh pr create`
