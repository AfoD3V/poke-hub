## Context

The PokeHub backend currently queries TCGdex via REST (`GET /v2/en/cards?name=...`) to power card search. TCGdex also exposes a GraphQL endpoint at `POST https://api.tcgdex.net/v2/graphql` that returns a richer card shape in a single request — including nested `set`, `variants`, `attacks`, and `weaknesses` — eliminating the need for supplemental REST calls or data gaps.

The change is contained to the server-side TCGdex service. The `/api/cards/search` endpoint contract exposed to the SvelteKit frontend remains unchanged.

## Goals / Non-Goals

**Goals:**
- Replace REST card search with a single GraphQL POST to TCGdex
- Return the same internal `Card` type shape to callers (no breaking change to `/api/cards/search`)
- Handle nulls from TCGdex gracefully (GraphQL schema marks some fields non-nullable, but the API returns null in practice)
- Update tests to mock the GraphQL endpoint

**Non-Goals:**
- Introducing a GraphQL server or schema into PokeHub itself
- Replacing other TCGdex REST calls (set listing, card-by-id, etc.) — only card search is in scope
- Adding a GraphQL client library (native `fetch` is sufficient)

## Decisions

### 1. Use native `fetch` for GraphQL POST — no client library

**Decision:** Send a plain `POST` with `Content-Type: application/json` and `{ query, variables }` body. No `graphql-request`, Apollo, or urql.

**Rationale:** The query is a single static string with one variable (`name`). Adding a library adds bundle weight and a new dependency for trivial gain. The query text can live as a `const` in the service file.

**Alternative considered:** `graphql-request` (lightweight). Rejected — unnecessary abstraction for one query.

---

### 2. Keep the GraphQL query static, parameterized by variables

**Decision:** Define the query once as a module-level constant. Pass `name` as a GraphQL variable (`$name: String`) rather than interpolating into the query string.

**Rationale:** Variables are safe against injection; string interpolation is not. Static query text is also easier to read and test.

---

### 3. Null-safe mapping in the response mapper

**Decision:** Treat all attack sub-fields (`name`, `cost`, `damage`, `effect`) as `string | null` in the mapper, even though TCGdex marks them non-nullable. Filter out attacks where `name` is null (they are unusable display-wise).

**Rationale:** The TCGdex GraphQL API has been observed returning `null` for `AttacksListItem.name` (see Postman screenshot). If we trust the schema and pass nulls through, downstream code (UI, type-checker) breaks. Defensive mapping is the safest approach.

**Alternative considered:** Return attacks with `name: null` and let the UI handle it. Rejected — leaks an upstream API bug into our internal type contract.

---

### 4. No changes to `shared/tcg.ts` Card type

**Decision:** The existing `Card` type in `shared/tcg.ts` is preserved as-is. Nullable handling is internal to the mapper.

**Rationale:** The Card type already uses optional fields where needed. Widening types to `string | null` for attack fields would ripple into UI code unnecessarily.

## Risks / Trade-offs

- **TCGdex GraphQL schema drift** → The static query will break if TCGdex renames or removes fields. Mitigation: the mapper has a type assertion layer; TypeScript will surface type mismatches at compile time if we keep a local type for the raw response.
- **TCGdex GraphQL availability** → If the GraphQL endpoint goes down while REST remains up, search breaks entirely. Mitigation: out of scope for this change; a future fallback strategy can be added.
- **Null fields beyond attacks** → Other fields (e.g. `hp`, `retreat`) may also be null in practice. Mitigation: mapper uses `?? null` / `?? undefined` patterns throughout; add test fixtures with null values.

## Migration Plan

1. Update `server/src/services/tcgdex.ts` — swap REST fetch for GraphQL POST
2. Update response mapper — null-safe attack field handling
3. Update Vitest mocks — mock `fetch` to return GraphQL response shape
4. Run `bun run test` in `server/` — confirm all tests pass
5. `docker compose up -d --build` — smoke test via Playwright or curl

Rollback: revert the service file commit; no DB migrations or config changes involved.

## Open Questions

- Are there other search filters (by type, set, rarity) planned? If so, the static query string may need to be extended. For now, `name` only.
