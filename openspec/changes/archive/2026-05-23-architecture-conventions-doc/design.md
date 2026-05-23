## Context

PokéHub is a Next.js 14 monorepo (`server/` + `ui/` + `shared/`). `CLAUDE.md` and `AGENTS.md` are the primary guidance files for AI agents and developers, but neither contains a structural map of where code belongs. Conventions have been accumulated implicitly in CLAUDE.md's "Key Gotchas" section and in developers' heads. A new `ARCHITECTURE.md` file will be the single canonical reference for structural and naming decisions, cross-linked from both guidance files.

## Goals / Non-Goals

**Goals:**
- Create `ARCHITECTURE.md` at repo root with the full architecture & conventions reference (repo layout, frontend layers, backend layers, shared packages, naming conventions, anti-patterns, exception rules, decision checklist)
- Add a concise "Architecture Reference" section to `CLAUDE.md` that names `ARCHITECTURE.md` and states the prime directive
- Add a matching section to `AGENTS.md` in the same commit (per the keep-in-sync rule)
- The document must reflect the *actual* current layout (`server/`, `ui/`, `shared/`) — not a hypothetical future layout — with notes on where the reference architecture's ideals apply and where the existing structure is the convention

**Non-Goals:**
- Refactoring any existing code to conform to the architecture document
- Introducing Turborepo, new `apps/` or `packages/` directories, or any structural changes to the repo itself
- Replacing or duplicating content already authoritatively covered in `CLAUDE.md` (e.g., Docker commands, test runners, auth flow) — `ARCHITECTURE.md` is additive

## Decisions

### D1: Separate file (`ARCHITECTURE.md`) rather than expanding `CLAUDE.md`

**Decision:** Create a new top-level `ARCHITECTURE.md` and link to it from `CLAUDE.md`/`AGENTS.md`.

**Rationale:** `CLAUDE.md` is already dense and is loaded into every agent context window. A large architecture reference embedded there would exceed context budgets and bury actionable commands. Keeping it in a dedicated file lets agents load it on demand (when making structural decisions) without bloating every session.

**Alternative considered:** Append the full content to `CLAUDE.md`. Rejected — `CLAUDE.md` serves as quick-reference; the architecture doc is reference material consulted when adding files, not on every task.

### D2: Reflect actual repo layout, not the idealised prompt layout

**Decision:** `ARCHITECTURE.md` will describe the conventions in terms of the *existing* repo structure (`server/`, `ui/src/`, `shared/`) and map the idealised layers onto what actually exists, calling out deviations explicitly.

**Rationale:** Describing a layout that doesn't exist (`apps/web/`, `packages/types/`) would confuse agents navigating the real repo. The value is the *principles* (layers, naming, anti-patterns) applied to the real paths.

**Alternative considered:** Describe the idealised layout and note the current structure as a deviation. Rejected — the current structure is the convention, not a deviation; the idealised prompt is the *source of the principles*, not the target layout.

### D3: Single `ARCHITECTURE.md` at repo root (not inside a sub-package)

**Decision:** Place the file at `/ARCHITECTURE.md`.

**Rationale:** Architecture conventions span the entire monorepo. Placing it at root makes it discoverable and signals its cross-cutting scope. Agent instructions in `CLAUDE.md` reference root-relative paths consistently.

## Risks / Trade-offs

- **Stale documentation risk:** `ARCHITECTURE.md` may drift from the real codebase as it evolves. Mitigation: add a note in `CLAUDE.md` requiring agents to update `ARCHITECTURE.md` when introducing new structural patterns (same keep-in-sync rule that governs `CLAUDE.md`↔`AGENTS.md`).
- **Verbosity vs. utility:** A long reference doc is only useful if agents actually read it. Mitigation: the `CLAUDE.md` cross-reference names the *specific decision checklist* so agents know *when* to consult it.
- **Mapping idealised → real layout may confuse:** The reference architecture uses `apps/web/src/` paths; the real repo uses `ui/src/`. Mitigation: the doc will open with an explicit mapping table.
