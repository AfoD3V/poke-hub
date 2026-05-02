1. Technology Stack
•	Frontend: SvelteKit + Tailwind CSS (Server-Side Rendering, native support for the pokemon-cards-css library without rewriting code).
•	Backend: Hono + Bun (Extremely fast API, WebSockets, secure proxy for the Pokémon TCG API).
•	Database: PostgreSQL + Drizzle ORM (Relational data management with full TypeScript type safety).
•	Real-time Communication: Postgres LISTEN/NOTIFY + WebSockets (Database triggers events directly to Hono, which pushes them to the frontend).
•	Infrastructure: k3s + Helm Charts + Traefik Ingress (Lightweight Kubernetes on a VPS for full control, scalability, and Infrastructure as Code).

2. System Architecture in k3s
The system consists of three main components managed via an Umbrella Helm Chart:
	1.	pokehub-ui (Deployment): Serves the SvelteKit application and is exposed via Traefik Ingress (e.g., pokehub.com).
	2.	pokehub-api (Deployment): Handles business logic, authentication, and WebSocket connections. Accessible internally or via a subdomain (e.g., api.pokehub.com).
	3.	pokehub-db (StatefulSet): PostgreSQL instance attached to a Persistent Volume Claim (PVC) to guarantee data persistence across pod restarts.