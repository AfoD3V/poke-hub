# ARCHITECTURE.md

> **Prime Directive:** Does this structure serve the code, or does the code serve the structure?
>
> Before adding any file, apply the [Decision Checklist](#decision-checklist) at the bottom of this document.

This is the single authoritative reference for structural, naming, and organisational decisions across the PokéHub monorepo. It describes the *actual* current layout — not an idealised future state. When principles from a reference architecture apply, they are mapped explicitly to the real paths.

---

## Repo Layout

| Directory    | Role |
|--------------|------|
| `server/`    | Bun + Hono API server. Business logic, DB access, auth. |
| `ui/`        | Next.js 14 App Router frontend. Server Components + Client Components. |
| `shared/`    | TypeScript types shared across the client/server boundary. No logic. |
| `openspec/`  | OpenSpec change proposals, specs, tasks, and design documents. |
| `docs/`      | Architecture docs, Postman collections, and other reference materials. |
| `resources/` | Read-only local reference. Always gitignored, never committed. |
| `screenshots/` | Playwright debug screenshots. Images are gitignored; directory is tracked. |

### Mapping Note

Reference architectures often use an `apps/` monorepo layout (`apps/web/`, `apps/server/`, `packages/types/`). This project predates that structure:

| Reference pattern | This repo |
|-------------------|-----------|
| `apps/web/src/`   | `ui/src/` |
| `apps/server/src/` | `server/src/` |
| `packages/types/` | `shared/` |

Do not introduce `apps/` or `packages/` directories — the current flat layout is the convention.

---

## Frontend Structure (`ui/src/`)

```
ui/src/
├── app/                    # Next.js App Router — routes only
│   ├── (app)/              # Route group: authenticated shell (sidebar layout)
│   │   ├── home/           # /home page
│   │   ├── search/         # /search page
│   │   ├── collection/     # /collection page
│   │   └── admin/          # /admin page
│   ├── api/                # Next.js API Route Handlers (proxy to Hono backend)
│   └── auth/               # Auth pages (outside shell — no sidebar)
├── lib/
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Cross-feature composable hooks
│   └── apiProxy.ts         # Shared fetch helpers (proxyGet/proxyPost/proxyDelete)
├── middleware.ts            # Next.js middleware (auth guard)
└── tests/                  # Test setup and utilities
```

### `app/` — Route Entry Points

Pages and layouts live here. They are **thin**: no business logic, no data fetching beyond what is needed to pass props to components. Server Components fetch data; Client Components (`'use client'`) handle interactivity.

- Route groups (e.g., `(app)/`) isolate layouts without affecting the URL.
- Each page directory may contain `page.tsx`, `layout.tsx`, and `*.module.css` — nothing else.
- Do not add hooks, utility functions, or complex logic inside page files.

### `app/api/` — Proxy Route Handlers

All client-side `fetch('/api/...')` calls must have a corresponding `route.ts` in this directory. Use the shared `proxyGet/proxyPost/proxyDelete` helpers from `ui/src/lib/apiProxy.ts`. Never call the Hono backend directly from client code.

### `lib/components/` — Reusable UI Components

Shared, presentational components used across multiple pages. Examples: `Card.tsx`, `Sidebar.tsx`, `Toast.tsx`, `SeriesBrowser.tsx`.

**Scope rules:**
- A component belongs here if it is used in 2+ pages or is fundamentally reusable.
- Components must not contain business logic or data fetching.
- Each component may have a co-located `.module.css` and `.test.tsx`.

**Sub-layers (when the directory grows):**
- `components/ui/` — pure presentational atoms (buttons, inputs, badges)
- `components/cards/` — card-specific display components
- `components/layout/` — structural layout components (shells, grids)

If you are creating a component used by only one page, consider keeping it in that page's directory first. Move to `lib/components/` once it is shared.

### `lib/hooks/` — Cross-Feature Hooks

Custom React hooks that are shared across multiple features or components. Currently: `useSpring.ts`.

**Rules:**
- Hooks here must be composable and stateless with respect to application data.
- No data fetching, no API calls, no global state access.
- A hook used by only one component should live next to that component, not here.

### `lib/apiProxy.ts` — Infrastructure Config

Low-level infrastructure: the shared fetch proxy helpers. This is not a general utilities barrel — only infra-level concerns belong here.

### Future Layers (add when needed, not speculatively)

These layers are recognised patterns for this codebase. Create them when you have a concrete need, not before:

| Layer | Path | When to add |
|-------|------|-------------|
| Features | `ui/src/features/<name>/` | When a vertical slice (data + UI + logic) is self-contained and 3+ files |
| Animations | `ui/src/animations/` | When an animation hook is used by 3+ components |
| Store | `ui/src/store/` | When global client state is needed beyond component state |

A feature directory must expose a public API via `index.ts` and must not import from another feature directory (no cross-feature imports).

---

## Backend Structure (`server/src/`)

```
server/src/
├── routes/          # Hono route handlers — thin, delegate to services
├── services/        # Business logic — all non-trivial logic lives here
├── middleware/      # Hono middleware (auth guard, etc.)
├── db/
│   ├── schema.ts    # Drizzle schema definitions
│   └── client.ts    # Drizzle client initialisation
├── config/          # Environment and app config
├── app.ts           # Hono app setup, route registration
└── index.ts         # Entry point
```

The migration files live in `server/drizzle/` (generated by `drizzle-kit`). Never modify applied migration files — create a new migration instead.

### Layering: Routes → Services → Drizzle

```
Request → Route handler (routes/)
               ↓
          Service (services/)
               ↓
          Drizzle ORM (db/schema.ts + db/client.ts)
               ↓
          PostgreSQL
```

**Route handlers** (`routes/`) are thin: validate input, call a service, return a response. No SQL, no complex conditionals, no business logic.

**Services** (`services/`) own all business logic. They call Drizzle directly. A service function should be testable in isolation without spinning up an HTTP server.

> **Note on the reference architecture:** Some reference architectures separate a `controllers/` layer between routes and services. In this project, that layer is collapsed — route handlers *are* the controllers. The important boundary is between routes (HTTP concerns) and services (business logic).

**Middleware** (`middleware/`) handles cross-cutting concerns: authentication, CORS, logging. Do not put business logic in middleware.

**Database** access goes exclusively through Drizzle ORM. Raw SQL is forbidden. Schema changes require a new migration file (`bun run db:generate` in `server/`).

---

## Shared Package (`shared/`)

```
shared/
├── auth.ts        # Auth-related types (User, Session, etc.)
├── tcg.ts         # TCG card and collection types
└── collection.ts  # Collection types
```

**Rules:**
- Only types that cross the client/server boundary belong here.
- No `any` — ever. Use `unknown` with type guards.
- No logic, no functions, no constants. Types only.
- Shared types are imported by both `ui/` and `server/`. Changing them is a cross-cutting concern — verify both sides compile.

---

## Naming Conventions

### File and Folder Names

| What | Convention | Example |
|------|------------|---------|
| React components | PascalCase file, `.tsx` | `Card.tsx`, `SeriesBrowser.tsx` |
| React hooks | camelCase with `use` prefix, `.ts` | `useSpring.ts`, `useCollection.ts` |
| Folders / route segments | kebab-case | `series-browser/`, `card-modal/` |
| Route files (Next.js) | kebab-case | `route.ts`, `page.tsx`, `layout.tsx` |
| Type definition files | `.types.ts` suffix | `card.types.ts` |
| Query files | `.queries.ts` suffix | `collection.queries.ts` |
| Constant files | `.constants.ts` suffix | `rarity.constants.ts` |
| Test files | Co-located `.test.ts` / `.test.tsx` | `Card.test.tsx` |
| CSS Modules | Co-located `.module.css` | `Card.module.css` |

### Semantic Naming

- **Booleans:** prefix with `is`, `has`, `can`, or `should` — e.g., `isLoading`, `hasError`, `canDelete`, `shouldRetry`.
- **Animation hooks:** name after the *effect*, not the *target* — e.g., `useSpring` (not `useCardTilt`), `useFadeIn` (not `useToastAnimation`).
- **Event handlers:** prefix with `handle` — e.g., `handleSubmit`, `handleCardClick`.
- **Full words:** avoid abbreviations — `collection` not `coll`, `authentication` not `auth` in types (but `auth` is acceptable in file names for brevity).

---

## Anti-Patterns

These patterns are explicitly forbidden. If you find one in a code review or implementation, redirect to the correct layer.

| Anti-Pattern | Why It's Wrong | Correct Approach |
|---|---|---|
| Business logic in page files | Pages are entry points, not controllers | Extract to a service (backend) or hook (frontend) |
| Data fetching inside a shared component | Components should receive data as props | Fetch in Server Components (pages/layouts) or dedicated hooks |
| Animation logic inlined in JSX | Couples visual effects to component rendering | Extract to a composable hook in `lib/hooks/` |
| Raw API calls from client components | Bypasses the proxy layer; exposes internals | Use `fetch('/api/...')` via the `proxyGet/proxyPost` helpers |
| Inline named types (`type Foo = ...` in component files) | Breaks discoverability; pollutes component files | Move shared types to `shared/`; component-local types to `.types.ts` |
| Client-only data cache (e.g., module-level `Map`) | Lost on page reload; inconsistent between tabs | Use React state, SWR, or a proper store |
| `any` in TypeScript | Defeats type safety silently | Use `unknown` with type guards |
| Blanket barrel re-exports (`export * from './...'`) | Makes tree-shaking impossible; hides the public API | Export only the public surface explicitly in `index.ts` |

---

## When to Break the Rules

These are documented, named exceptions. Each exception requires a stated rationale in the code comment or PR description.

### Exception 1: Single-Use Animation

**Rule relaxed:** Animation hooks live in `lib/hooks/`.

**Exception:** If an animation is fewer than ~20 lines and is used by exactly one component, it may live inline in that component file. This avoids the overhead of a separate hook for trivial effects.

**Resolution:** If the animation is later reused by a second component, extract it to `lib/hooks/` at that point.

### Exception 2: Single-File Feature

**Rule relaxed:** Features live in `ui/src/features/<name>/`.

**Exception:** If a "feature" is a single file (one component, no associated hooks or queries), it does not need a feature directory. Place it in `lib/components/` instead.

**Resolution:** When a second file is added (a hook, a query, a type), create the feature directory and migrate.

### Exception 3: Circular Dependency Types

**Rule relaxed:** Types in `shared/` must not import from `server/` or `ui/`.

**Exception:** If two types in `shared/` reference each other and TypeScript would flag the import as circular, define both types in the same file.

**Resolution:** Restructure into a common base type if the circular reference grows beyond 2 files.

### Exception 4: Non-Node/Bun Servers

**Rule relaxed:** All backend logic runs in `server/` via Hono on Bun.

**Exception:** If a future integration requires a separate microservice (e.g., a Python ML service), it may live in a top-level `services/<name>/` directory with its own `Dockerfile` — not inside `server/`.

**Resolution:** Document the new service in this file and update the Repo Layout table.

### Exception 5: Turborepo Adoption

**Rule relaxed:** No `apps/` or `packages/` directories.

**Exception:** If the monorepo grows to 4+ deployable units, migrating to Turborepo's `apps/`/`packages/` structure is acceptable. This is a planned structural change, not a rule violation.

**Resolution:** Update this entire document when that migration happens.

---

## Decision Checklist

Apply this checklist before adding any new file to the codebase:

1. **Does this file belong to an existing layer?**
   Match the file's primary responsibility to a layer in the Frontend, Backend, or Shared sections above. If it doesn't fit any existing layer, ask why before creating a new one.

2. **Is there an existing file in the correct layer I should extend instead?**
   Prefer adding to an existing service, hook, or component over creating a new file. New files add navigation cost.

3. **Does this file's name follow the naming conventions?**
   Check the table above. PascalCase for components, `use` prefix for hooks, kebab-case for folders.

4. **Am I creating the right abstraction for the right stage?**
   Three similar lines of code is better than a premature abstraction. Only create a helper or utility if it will be used in 2+ places at the time of creation.

5. **Will this file need to be updated in `ARCHITECTURE.md`?**
   If you are introducing a new structural pattern (a new layer, a new convention, a new top-level directory), update this document in the same commit.
