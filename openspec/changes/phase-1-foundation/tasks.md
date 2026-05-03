## 1. Core Infrastructure & Database Scaffold

- [ ] 1.1 Scaffold Bun + Hono backend structure and base configuration (Verification Step: run `bun test` or basic server boot and confirm no runtime errors)
- [ ] 1.2 Configure Postgres connection and Drizzle ORM setup (Verification Step: run migration command and verify Drizzle connects)
- [ ] 1.3 Define Drizzle schema for `users`, `cards_cache`, `user_collection` (Verification Step: inspect generated schema types and migration output)
- [ ] 1.4 Implement `GET /api/health` with DB connectivity check (Verification Step: call endpoint and confirm 200 with DB success)

## 2. Security & Authentication System

- [ ] 2.1 Choose auth approach (session or JWT via HttpOnly cookies) and implement auth middleware (Verification Step: call protected route without cookie and confirm 401)
- [ ] 2.2 Implement registration endpoint and user creation flow (Verification Step: register user and confirm DB record exists)
- [ ] 2.3 Implement login endpoint and session validation endpoint (Verification Step: login and call session endpoint with cookie)
- [ ] 2.4 Scaffold SvelteKit auth pages for login and registration (Verification Step: open auth pages and confirm forms render)
- [ ] 2.5 Protect `/api/collection` routes with auth middleware (Verification Step: request `/api/collection` without auth returns 401)

## 3. TCG API Proxy & Holographic Search UI

- [ ] 3.1 Implement Hono proxy endpoint for pokemontcg.io (Verification Step: request proxy endpoint and confirm upstream data returned)
- [ ] 3.2 Add error handling and timeouts for proxy requests (Verification Step: simulate upstream error and confirm controlled error payload)
- [ ] 3.3 Build SvelteKit search page wired to proxy (Verification Step: search by Pokemon name and confirm results render)
- [ ] 3.4 Integrate pokemon-cards-css holographic effects on result cards (Verification Step: hover card and confirm cursor-tracking effect)
- [ ] 3.5 Add loading and error states to search UI (Verification Step: trigger loading and error states and confirm UI feedback)

## 4. Core Collection Management

- [ ] 4.1 Implement `POST /api/collection/add` to save cards (Verification Step: add card and confirm DB insert)
- [ ] 4.2 Implement `DELETE /api/collection/remove` to remove cards (Verification Step: remove card and confirm DB delete)
- [ ] 4.3 Build My Collection dashboard page in SvelteKit (Verification Step: navigate to page and confirm layout)
- [ ] 4.4 Wire dashboard to fetch and render user collection with holographic cards (Verification Step: refresh page and confirm saved cards render)

## 5. Real-Time Event Architecture

- [ ] 5.1 Configure Postgres LISTEN/NOTIFY for collection inserts (Verification Step: insert card and confirm notification received server-side)
- [ ] 5.2 Implement WebSocket server in Hono to broadcast events (Verification Step: connect client and observe server broadcast)
- [ ] 5.3 Implement SvelteKit WebSocket client and toast display (Verification Step: add card and confirm toast appears)

## 6. Kubernetes (k3s) Deployment Pipelines

- [ ] 6.1 Create Dockerfiles for UI and API services (Verification Step: build images locally without errors)
- [ ] 6.2 Create Helm umbrella chart for UI, API, and DB (Verification Step: run `helm install` and confirm workloads created)
- [ ] 6.3 Configure Traefik ingress for UI and API routing (Verification Step: access routes via defined domains)
