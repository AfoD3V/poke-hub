## 1. Service Layer — GraphQL Client

- [x] 1.1 Locate the existing TCGdex card search REST call in `server/src/services/` and identify all callers
  - Verification: Confirm the function signature and return type before any edits
- [x] 1.2 Define the static GraphQL query constant with `query($name: String)` variable syntax, selecting all required fields (`id`, `localId`, `name`, `image`, `rarity`, `hp`, `types`, `stage`, `evolveFrom`, `description`, `illustrator`, `retreat`, `regulationMark`, `category`, `set { id name logo symbol }`, `variants { normal holo reverse firstEdition }`, `attacks { name cost damage effect }`, `weaknesses { type value }`)
  - Verification: Query string compiles without syntax errors (copy-paste into Postman GraphQL tab and verify schema fetch)
- [x] 1.3 Replace the REST fetch with a `fetch('https://api.tcgdex.net/v2/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables: { name } }) })`
  - Verification: `curl` the endpoint manually and confirm a 200 response with `data.cards`
- [x] 1.4 Add top-level GraphQL error handling: if response body contains `errors`, throw a descriptive error
  - Verification: Mock a response with `{ errors: [{ message: "..." }] }` in a test and confirm a thrown error

## 2. Response Mapper — Null Safety

- [x] 2.1 Define a local TypeScript type for the raw TCGdex GraphQL card response (all fields typed as they actually come back, with nullable attack sub-fields as `string | null`)
  - Verification: `tsc --noEmit` in `server/` passes with no type errors
- [x] 2.2 Update (or create) the mapper function to handle null `attacks[].name` — filter out entries where `name` is null
  - Verification: Unit test with fixture containing a null-name attack confirms the attack is excluded from output
- [x] 2.3 Handle null `attacks[].cost` (default `[]`) and `attacks[].damage` (default `""`) in the mapper
  - Verification: Unit test with fixture containing null cost/damage confirms defaults are applied
- [x] 2.4 Confirm all other mapped fields (`hp`, `retreat`, `types`, etc.) use `?? null` / `?? undefined` patterns and do not throw on null values
  - Verification: Unit test with a minimally populated card fixture (most optional fields null) maps without error

## 3. Tests

- [x] 3.1 Update existing card search Vitest tests — replace REST `fetch` mock with a GraphQL POST mock returning a valid `{ data: { cards: [...] } }` shape
  - Verification: `bun run test` in `server/` — all card search tests pass
- [x] 3.2 Add a test for the GraphQL error case (response contains `errors`) — confirms the service throws and the route returns 502
  - Verification: Test passes; confirmed in `bun run test` output
- [x] 3.3 Add a test for empty `data.cards: []` — confirms the service returns `[]` without error
  - Verification: Test passes

## 4. Integration Verification

- [x] 4.1 Run `docker compose up -d --build` and confirm the `api` service starts without errors
  - Verification: `docker compose logs api` shows no startup errors
- [x] 4.2 Search for "Pikachu" via the UI and confirm results render correctly with holo effects intact
  - Verification: `playwright-cli screenshot` shows Pikachu cards in the search results
- [x] 4.3 Search for a term with no results and confirm the UI shows an empty state (not an error)
  - Verification: `playwright-cli snapshot` confirms empty state component is visible
- [x] 4.4 Run full lint and type-check: `bun run lint` (root) + `bun run check` (ui/)
  - Verification: Zero errors in both commands

## 5. Cleanup & Docs

- [x] 5.1 Remove any dead REST-related code, types, or imports left over from the old TCGdex REST search path
  - Verification: `bun run lint` passes; no unused variable warnings
- [x] 5.2 Document the null-attack-field gotcha in `AGENTS.md` > Project Learnings and mirror it in `CLAUDE.md` > Key Gotchas
  - Verification: Both files updated in the same commit
