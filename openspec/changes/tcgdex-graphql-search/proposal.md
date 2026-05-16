## Why

The TCGdex REST API returns partial data for card searches, requiring multiple round-trips for related fields (set info, variants, attacks, weaknesses). TCGdex exposes a GraphQL endpoint (`POST https://api.tcgdex.net/v2/graphql`) that returns all required card data in a single request, reducing latency and simplifying the data-fetching layer.

## What Changes

- Replace the REST-based card search call in `server/src/services/tcgdex.ts` (or equivalent) with a GraphQL POST to `https://api.tcgdex.net/v2/graphql`
- The GraphQL query fetches the full card shape: `id`, `localId`, `name`, `image`, `rarity`, `hp`, `types`, `stage`, `evolveFrom`, `description`, `illustrator`, `retreat`, `regulationMark`, `category`, `set { id name logo symbol }`, `variants { normal holo reverse firstEdition }`, `attacks { name cost damage effect }`, `weaknesses { type value }`
- The response mapper must handle nullable attack fields (`name`, `cost`, `damage`, `effect` may be null despite TCGdex schema marking them non-nullable)
- No changes to the public `/api/cards/search` endpoint contract — consumers are unaffected

## Capabilities

### New Capabilities

- `tcgdex-graphql-client`: GraphQL client logic for querying TCGdex — POST body construction, response parsing, and null-safe mapping to the internal `Card` type

### Modified Capabilities

- `tcg-api-proxy`: The card search implementation switches from REST to GraphQL; the outward-facing proxy contract (request/response shape) is unchanged, but the internal fetch mechanism and mapper are updated

## Impact

- **`server/src/services/`** — TCGdex service file(s) that perform card search
- **`shared/tcg.ts`** — shared Card type may need nullable fields added (e.g. `attacks[].name`)
- **Dependencies** — no new npm packages required (native `fetch` handles GraphQL POST)
- **Tests** — existing unit/integration tests for card search must be updated to mock the GraphQL endpoint instead of REST
- **Postman collection** — `docs/postman/pokehub.postman_collection.json` does not need changes (collection tests the PokeHub API, not TCGdex directly)
