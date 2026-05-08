## ADDED Requirements

### Requirement: Health check endpoint
The backend SHALL expose `GET /api/health` and return HTTP 200 when the service is running and the database connection is healthy.

#### Scenario: Healthy service and database
- **WHEN** a client requests `GET /api/health`
- **THEN** the response status is 200 and indicates database connectivity success

### Requirement: Initial database schema
The system SHALL define and migrate an initial schema that includes `users`, `cards_cache`, and `user_collection` tables managed by Drizzle ORM.

#### Scenario: Successful migration
- **WHEN** migrations are executed via the project migration command
- **THEN** the three tables exist in the PostgreSQL database

### Requirement: Drizzle-only data access
All database reads and writes MUST use Drizzle ORM and SHALL NOT use raw SQL.

#### Scenario: Service-level data access
- **WHEN** a backend service queries or mutates the database
- **THEN** the operation is performed through Drizzle ORM APIs
