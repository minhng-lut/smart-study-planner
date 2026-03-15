# Architecture Notes

## Routing

Traefik handles ingress for the application services:

- `/` -> frontend
- `/api` -> backend
- `/python` -> python-service

The backend and python service use strip-prefix middleware so that each service can keep its native `/health` endpoint internally.

## Deployment Modes

### Development

`docker/docker-compose.dev.yml` starts the application tier and PostgreSQL for local iteration.

### Swarm

`docker/docker-stack.yml` adds monitoring and management services:

- Prometheus
- Loki
- Grafana
- Portainer

## Networks

- `public`: ingress-facing network for Traefik and routed services
- `internal`: private service-to-service network

