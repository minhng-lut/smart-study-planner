# Cloud Microservices Skeleton

This repository provides an initial cloud microservices scaffold with a React frontend, an Express API, a FastAPI microservice, PostgreSQL, and supporting infrastructure for reverse proxying, monitoring, and container orchestration.

## Architecture

- `services/frontend`: React + Vite + TypeScript application built into static assets and served by Nginx
- `services/backend`: Node.js + Express + TypeScript API with a single health endpoint
- `services/python-service`: FastAPI service with a single health endpoint
- `infrastructure/traefik`: Traefik static configuration
- `infrastructure/monitoring`: Prometheus, Loki, and Grafana provisioning
- `docker/docker-compose.dev.yml`: local development stack
- `docker/docker-stack.yml`: Docker Swarm stack
- `scripts/`: helper scripts for deployment
- `docs/`: supporting documentation

## Services

### Frontend

- Runtime: Nginx
- Route: `/`
- Page: `Frontend running`

### Backend

- Runtime: Node.js + Express + TypeScript
- ORM: Prisma ORM 7
- Route: `/api/health`
- Response: `{ "status": "ok" }`

### Python Service

- Runtime: FastAPI
- Route: `/python/health`
- Response: `{ "status": "ok" }`

### PostgreSQL

- Internal database container with persistent volume

### Traefik

- Reverse proxy and ingress for service routing
- Dashboard exposed in the Swarm stack at `/dashboard/`

### Monitoring

- Prometheus for metrics collection
- Loki for log aggregation
- Grafana for visualization

### Portainer

- Swarm management UI

## Local Development

Run the development stack:

```bash
docker compose -f docker/docker-compose.dev.yml up --build
```

Accessible endpoints:

- Frontend: `http://localhost/`
- Backend health: `http://localhost/api/health`
- Backend docs: `http://localhost/api/docs`
- Backend OpenAPI JSON: `http://localhost/api/docs.json`
- Python health: `http://localhost/python/health`
- PostgreSQL: `localhost:5433`

### Prisma Local Setup

Backend Prisma files live in `services/backend/prisma`, and Prisma CLI configuration lives in `services/backend/prisma.config.ts`.

Prepare local backend environment:

```bash
cp services/backend/.env.example services/backend/.env
```

Start PostgreSQL and the application stack:

```bash
docker compose -f docker/docker-compose.dev.yml up --build
```

Generate the Prisma client from the backend workspace:

```bash
npm run prisma:generate --workspace backend
```

Apply the current Prisma schema to the local PostgreSQL instance:

```bash
npm run prisma:db:push --workspace backend
```

You could also use prisma studio instead of this: 

Inspect data in PostgreSQL:

```bash
docker compose -f docker/docker-compose.dev.yml exec postgres psql -U app -d app
```

After opening `psql`, query any table:

```sql
SELECT * FROM "table_name";
```

Example:

```sql
SELECT * FROM "courses";
```

Prisma 7 uses `prisma.config.ts` for the CLI datasource URL, while runtime database access is configured through the PostgreSQL driver adapter in `services/backend/src/lib/prisma.js`. The backend stays JavaScript-only, so it uses Prisma 7 with the `prisma-client-js` generator and a driver adapter instead of the new TypeScript-only generated client layout.

## Authentication

The backend includes JWT authentication with role-based access control:

- roles: `user`, `admin`
- access token: short-lived JWT
- refresh token: JWT with server-side rotation and revocation tracking

Backend auth endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /auth/admin`

`GET /auth/admin` requires an authenticated user with the `admin` role.

Public registration creates `user` accounts. Promote a user to `admin` directly in the database or add a protected admin-management flow later.

## Docker Swarm

Initialize Swarm and deploy the full stack:

```bash
./scripts/bootstrap-swarm.sh
./scripts/deploy-stack.sh
```

Build and publish the application images referenced by `docker/docker-stack.yml` before deploying the Swarm stack.

The Swarm stack includes:

- frontend
- backend
- python-service
- postgres
- traefik
- prometheus
- grafana
- loki
- portainer

## Branches

The repository uses a two-branch promotion flow:

- `main`: active development branch
- `production`: release branch

Typical flow:

1. Branch from `main` for feature work
2. Merge feature branches into `main`
3. Promote validated changes from `main` to `production`

The CI workflow is configured to run on pushes and pull requests targeting `main` and `production`.

## CI

GitHub Actions installs service dependencies and builds Docker images for the application services.

## Workspaces

The repository uses npm workspaces for the Node services:

- `services/frontend`
- `services/backend`

The workspace root owns the main `package-lock.json`. A root `node_modules/` directory is expected because npm hoists shared packages there.

## Conventions

Repository commit rules and working conventions are defined in `CONTRIBUTING.md`.

Formatting and linting are configured at the repository root with Prettier, ESLint, TypeScript-aware linting, and workspace VS Code settings for auto-format on save.

## Notes

- Authentication, analytics, and business logic are intentionally excluded.
- Prisma ORM 7 is configured for PostgreSQL without domain models yet.
- Monitoring is provisioned with minimal defaults to keep the scaffold clean.

# Members
