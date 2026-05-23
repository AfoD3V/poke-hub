## 1. Create ARCHITECTURE.md

- [x] 1.1 Create `ARCHITECTURE.md` at repo root. Open the file and verify it exists with `ls ARCHITECTURE.md`.
- [x] 1.2 Write the **Repo Layout** section: table of actual top-level dirs (`server/`, `ui/`, `shared/`, `openspec/`) with their roles, plus a mapping note explaining how the reference architecture's `apps/web/` → `ui/` and `apps/server/` → `server/`.
- [x] 1.3 Write the **Frontend Structure** section for `ui/src/`: cover `components/` (with ui/cards/layout sub-layers and their scope rules), `features/` (vertical slice pattern, public API via `index.ts`, no cross-feature imports), `animations/` (composable hooks, no data fetching), `hooks/` (cross-feature only), `pages/` (thin route entry points), `lib/` (infra config), `store/` (global client state only).
- [x] 1.4 Write the **Backend Structure** section for `server/src/`: document actual Hono layout (routes → services → Drizzle). Note that the reference architecture's separate `controllers/` layer is collapsed into route handlers in this project. Cover `middleware/`, `db/schema`, `db/migrations`.
- [x] 1.5 Write the **Shared Package** section for `shared/`: explain that types crossing client/server boundary live here, no `any`, no logic.
- [x] 1.6 Write the **Naming Conventions** section: file/folder table (PascalCase components, `use` prefix hooks, kebab-case folders/routes, `.types.ts` / `.queries.ts` / `.constants.ts` suffixes) plus semantic naming rules (`is/has/can/should` booleans, effect-not-target animation names, full words not abbreviations).
- [x] 1.7 Write the **Anti-Patterns** section: all 8 items from the input (logic in pages, data fetching in components, animation logic in JSX, raw API calls in components, inline named types, client-only cache, `any`, blanket barrel re-exports).
- [x] 1.8 Write the **When to Break the Rules** section: all 5 documented exceptions with their rationale and resolution.
- [x] 1.9 Write the **Decision Checklist** section: the 5-question checklist to apply before adding any new file.
- [x] 1.10 Verification: Read through `ARCHITECTURE.md` end-to-end and confirm all sections are present, paths reference the real repo structure, and no section references non-existent dirs like `apps/`.

## 2. Playwright Screenshots Folder

- [x] 2.1 Create a `screenshots/` directory at the repo root (add a `.gitkeep` so it's tracked).
- [x] 2.2 Add `screenshots/*.png` and `screenshots/*.jpg` to `.gitignore` (keep the dir, ignore the files).
- [x] 2.3 Add a "Playwright Screenshots" gotcha to `CLAUDE.md` Key Gotchas: all `playwright-cli screenshot` / `playwright-cli snapshot` calls MUST write output to `screenshots/<descriptive-name>.png`; never write to the repo root or inside a package.
- [x] 2.4 Add the matching entry to `AGENTS.md` in the same commit.
- [x] 2.5 Verification: Confirm `screenshots/` exists at repo root, `.gitignore` excludes image files within it, and both `CLAUDE.md` and `AGENTS.md` mention the `screenshots/` convention.

## 3. Update CLAUDE.md

- [x] 3.1 Add an **Architecture Reference** section to `CLAUDE.md` (after the Project Overview section). It MUST include: a link to `ARCHITECTURE.md`, the prime directive quote, and an instruction to consult the decision checklist before adding any new file.
- [x] 3.2 Extend the existing keep-in-sync rule in `CLAUDE.md` to include `ARCHITECTURE.md`: state that `ARCHITECTURE.md` MUST be updated in the same commit whenever a new structural pattern is introduced.
- [x] 3.3 Verification: Open `CLAUDE.md`, search for "ARCHITECTURE.md" — it MUST appear in the new section. Confirm the keep-in-sync rule now names all three files.

## 4. Update AGENTS.md

- [x] 4.1 Add a matching **Architecture Reference** section to `AGENTS.md` consistent with the one added to `CLAUDE.md`. Content should be equivalent; level of detail may be expanded for agent-specific guidance.
- [x] 4.2 Update the keep-in-sync rule in `AGENTS.md` to mirror the change made in `CLAUDE.md` (include `ARCHITECTURE.md` in the three-file sync requirement).
- [x] 4.3 Verification: Open `AGENTS.md`, confirm "ARCHITECTURE.md" appears in the new section and the keep-in-sync rule.

## 5. Final Validation

- [x] 5.1 Run `bun run lint` from repo root — zero errors.
- [x] 5.2 Confirm `ARCHITECTURE.md`, updated `CLAUDE.md`, updated `AGENTS.md`, `screenshots/.gitkeep`, and `.gitignore` changes are all staged in the same commit (do not commit yet — human approves first).
- [ ] 5.3 Human review: Open `ARCHITECTURE.md` and verify it accurately describes the actual codebase structure (no phantom dirs, correct layer rules, real file path examples).
- [ ] 5.4 Human review: Open `CLAUDE.md` and confirm the Architecture Reference section links correctly to `ARCHITECTURE.md`, the keep-in-sync rule covers all three files, and the `screenshots/` gotcha is present.
- [ ] 5.5 Human review: Confirm `AGENTS.md` matches `CLAUDE.md` on the architecture reference, keep-in-sync rule, and `screenshots/` convention — no divergence between the two files.
