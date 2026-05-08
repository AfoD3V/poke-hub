## ADDED Requirements

### Requirement: API service has a multi-stage Dockerfile
The repository SHALL include `server/Dockerfile` that produces a production-ready container image for the Bun + Hono API using a multi-stage build.

#### Scenario: API image builds without errors
- **WHEN** `docker build -t pokehub-api ./server` is run in the repository root
- **THEN** the build SHALL complete with exit code 0 and produce an image

#### Scenario: API container starts and serves requests
- **WHEN** the API image is run with required environment variables (`DATABASE_URL`, `JWT_SECRET`, `PORT`)
- **THEN** `GET /health` SHALL return HTTP 200

### Requirement: UI service has a multi-stage Dockerfile
The repository SHALL include `ui/Dockerfile` that produces a production-ready container image for the SvelteKit `adapter-node` output.

#### Scenario: UI image builds without errors
- **WHEN** `docker build -t pokehub-ui ./ui` is run in the repository root
- **THEN** the build SHALL complete with exit code 0 and produce an image

#### Scenario: UI container starts and serves the app
- **WHEN** the UI image is run with `PORT` and `ORIGIN` environment variables
- **THEN** `GET /` SHALL return HTTP 200 or 302

### Requirement: Images use minimal base images
Both Dockerfiles SHALL use Alpine-based or similarly minimal runtime base images to keep final image size below 300 MB.

#### Scenario: Image size is within limit
- **WHEN** `docker image ls pokehub-api` and `docker image ls pokehub-ui` are run after build
- **THEN** each image SIZE SHALL be less than 300 MB
