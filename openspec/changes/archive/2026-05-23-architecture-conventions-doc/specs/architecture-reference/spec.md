## ADDED Requirements

### Requirement: ARCHITECTURE.md exists at repo root
The repository SHALL contain an `ARCHITECTURE.md` file at the root level that serves as the single authoritative reference for structural, naming, and organisational decisions across the PokéHub monorepo.

#### Scenario: File is present
- **WHEN** a developer or agent navigates to the repo root
- **THEN** `ARCHITECTURE.md` exists and is readable

### Requirement: Repo layout section
`ARCHITECTURE.md` SHALL include a section defining the actual monorepo layout (`server/`, `ui/`, `shared/`) and a mapping to the reference architecture layers.

#### Scenario: Layout section present
- **WHEN** `ARCHITECTURE.md` is opened
- **THEN** it contains a section documenting the repo directory layout with roles for each top-level directory

### Requirement: Frontend structure section
`ARCHITECTURE.md` SHALL define the intended layer structure for `ui/src/`, covering `components/` (ui, cards, layout sub-layers), `features/`, `animations/`, `hooks/`, `lib/`, `store/`, and `pages/` — with the scope, rules, and examples for each layer.

#### Scenario: Layer rules are documented
- **WHEN** a developer asks "where does this hook go?"
- **THEN** `ARCHITECTURE.md` contains a section for `hooks/` that states the rule (cross-feature only) and gives examples

### Requirement: Backend structure section
`ARCHITECTURE.md` SHALL define the backend layering for `server/src/`: routes → services (no separate controller layer in the current Hono setup) → DB via Drizzle. It SHALL call out that the reference architecture's controller layer is collapsed into routes for this project.

#### Scenario: Backend layer rules documented
- **WHEN** a developer adds a new Hono route
- **THEN** `ARCHITECTURE.md` clarifies that business logic belongs in `server/src/services/`, not in route handlers

### Requirement: Naming conventions section
`ARCHITECTURE.md` SHALL list file and folder naming conventions (PascalCase components, camelCase hooks with `use` prefix, kebab-case folders and route files, `.types.ts` / `.queries.ts` / `.constants.ts` suffixes) and semantic naming rules.

#### Scenario: Naming convention lookup
- **WHEN** a developer names a new query file
- **THEN** `ARCHITECTURE.md` confirms the `.queries.ts` suffix convention and provides an example

### Requirement: Anti-patterns section
`ARCHITECTURE.md` SHALL list explicitly forbidden patterns (logic in pages, data fetching in components, animation logic in JSX, raw API calls in components, inline named types, client-only cache, `any` in TypeScript, blanket barrel re-exports).

#### Scenario: Anti-pattern identified
- **WHEN** a developer is about to fetch data inside a component
- **THEN** `ARCHITECTURE.md`'s anti-patterns section flags this and redirects to the correct layer

### Requirement: Decision checklist section
`ARCHITECTURE.md` SHALL include a decision checklist (5 questions) that MUST be applied before adding any new file to the codebase.

#### Scenario: Checklist used before adding a file
- **WHEN** a developer is about to create a new file
- **THEN** the checklist in `ARCHITECTURE.md` guides the layer placement, naming, and responsibility check

### Requirement: Documented exceptions section
`ARCHITECTURE.md` SHALL include a "When to Break the Rules" section with documented, named exceptions — each with a stated rationale — covering single-use animations, single-file features, circular dependency types, non-Node servers, and Turborepo adoption criteria.

#### Scenario: Exception applied correctly
- **WHEN** a developer keeps a 15-line animation inside its only consumer component
- **THEN** `ARCHITECTURE.md` confirms this is a documented exception, not a violation
