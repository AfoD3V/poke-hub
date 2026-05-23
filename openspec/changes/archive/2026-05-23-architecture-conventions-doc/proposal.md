## Why

PokéHub lacks a single, authoritative document that defines *where code lives and why*. As the codebase grows, inconsistent placement of components, hooks, animations, and services creates friction and diverging conventions. This change introduces an `ARCHITECTURE.md` reference document and ensures `CLAUDE.md` and `AGENTS.md` point to it explicitly, giving both humans and AI agents a shared decision framework.

## What Changes

- **New file** `ARCHITECTURE.md` at repo root — full reference for repo layout, frontend structure, backend layering, naming conventions, anti-patterns, and when rules may be broken
- **Updated** `CLAUDE.md` — new "Architecture Reference" section pointing to `ARCHITECTURE.md` with a summary of the prime directive
- **Updated** `AGENTS.md` — corresponding section added/updated to match `CLAUDE.md`, per the keep-in-sync rule

## Capabilities

### New Capabilities

- `architecture-reference`: A living `ARCHITECTURE.md` document that governs structural, naming, and organizational decisions across the PokéHub monorepo — covering repo layout, frontend layers (`components/`, `features/`, `animations/`, `hooks/`, `lib/`, `store/`, `pages/`), backend layers (routes → controllers → services → repositories), shared packages, naming conventions, anti-patterns, and a decision checklist for adding new files

### Modified Capabilities

- `core-infrastructure`: `CLAUDE.md` and `AGENTS.md` gain explicit cross-references to `ARCHITECTURE.md` so agents always know where the authoritative structural guide lives

## Impact

- `ARCHITECTURE.md` (new file, repo root)
- `CLAUDE.md` (updated — new section added)
- `AGENTS.md` (updated — matching section added)
- No code changes; no API changes; no migration needed
