## ADDED Requirements

### Requirement: GraphQL POST to TCGdex
The backend service SHALL query TCGdex card search via a single GraphQL POST request to `https://api.tcgdex.net/v2/graphql` using a static query parameterized by a `name` variable.

#### Scenario: Successful search returns card list
- **WHEN** a card search is requested with a name string (e.g. "Pikachu")
- **THEN** the service POSTs `{ query, variables: { name } }` to `https://api.tcgdex.net/v2/graphql` with `Content-Type: application/json`
- **THEN** the response `data.cards` array is mapped to the internal `Card` type and returned

#### Scenario: Empty result set
- **WHEN** TCGdex returns `data.cards: []` for the given name
- **THEN** the service returns an empty array without error

#### Scenario: TCGdex returns a top-level errors array
- **WHEN** the GraphQL response contains an `errors` field (alongside or instead of `data`)
- **THEN** the service throws a descriptive error that is surfaced as a 502 from `/api/cards/search`

### Requirement: Null-safe response mapping
The response mapper SHALL handle null values on attack sub-fields (`name`, `cost`, `damage`, `effect`) even though the TCGdex GraphQL schema marks them non-nullable.

#### Scenario: Attack with null name is filtered out
- **WHEN** a card's `attacks` array contains an item where `name` is null
- **THEN** that attack entry is excluded from the mapped `Card.attacks` array

#### Scenario: Attack with null cost or damage is mapped with defaults
- **WHEN** a card's attack has a null `cost` or `damage` field
- **THEN** the mapper substitutes an empty array for `cost` and an empty string for `damage`

#### Scenario: All non-attack fields present and valid
- **WHEN** TCGdex returns a fully populated card
- **THEN** all fields (`id`, `localId`, `name`, `image`, `rarity`, `hp`, `types`, `stage`, `evolveFrom`, `description`, `illustrator`, `retreat`, `regulationMark`, `category`, `set`, `variants`, `weaknesses`) are mapped to the corresponding fields on the internal `Card` type

### Requirement: Static parameterized GraphQL query
The GraphQL query string used for card search SHALL be a module-level constant using a `$name` variable, not string interpolation.

#### Scenario: Query uses variable syntax
- **WHEN** the service builds the request body for a card search
- **THEN** the `query` field contains `query($name: String)` syntax and the `variables` field carries `{ name: "<value>" }`
