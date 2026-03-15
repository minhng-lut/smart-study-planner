# Cloud Microservices Skeleton

This repository provides an initial cloud microservices scaffold with a React frontend, an Express API, a FastAPI microservice, PostgreSQL, and supporting infrastructure for reverse proxying, monitoring, and container orchestration.

## Architecture

- `services/frontend`: React + Vite application built into static assets and served by Nginx
- `services/backend`: Node.js + Express API with a single health endpoint
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

- Runtime: Node.js + Express
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
- Python health: `http://localhost/python/health`

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

## CI

GitHub Actions installs service dependencies and builds Docker images for the application services.

## Conventions

Repository commit rules and working conventions are defined in `CONTRIBUTING.md`.

## Notes

- Authentication, analytics, and business logic are intentionally excluded.
- Monitoring is provisioned with minimal defaults to keep the scaffold clean.


# Members
