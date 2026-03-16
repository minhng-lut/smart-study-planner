# Contributing

## Commit Rules

Use Conventional Commits:

```text
<type>(<scope>): <subject>
```

Allowed types:

- `feat`
- `fix`
- `refactor`
- `chore`
- `docs`
- `build`
- `ci`
- `test`

Recommended scopes:

- `frontend`
- `backend`
- `python-service`
- `postgres`
- `traefik`
- `monitoring`
- `docker`
- `ci`
- `docs`
- `scripts`

Commit message rules:

- Use lowercase `type` and `scope`
- Write the subject in imperative mood
- Keep the subject concise
- Keep one logical change per commit
- Add a body when the reason is not obvious
- Add `BREAKING CHANGE:` in the footer when behavior or contracts change

Examples:

- `chore(docker): scaffold local and swarm deployment files`
- `fix(backend): return consistent health payload`
- `docs(readme): clarify swarm image publishing flow`

## Branch Workflow

Use these long-lived branches:

- `main`: development and integration branch
- `production`: release branch for deployable code

Recommended flow:

- Create feature branches from `main`
- Open pull requests into `main` while work is in progress
- Promote validated changes from `main` into `production`
- Treat `production` as release-ready only

Branch naming examples:

- `feature/frontend-shell`
- `fix/backend-healthcheck`
- `chore/docker-cleanup`

## Repository Conventions

- Keep service code inside `services/`
- Keep platform and runtime configuration inside `infrastructure/` and `docker/`
- Keep scripts idempotent where practical
- Keep `.env.example` in every service when runtime variables exist
- Do not commit secrets, tokens, or real credentials
- Keep health endpoints lightweight and dependency-free
- Update `README.md` and relevant docs when architecture or runtime behavior changes
- Prefer small, focused changes over large mixed commits

## Service Conventions

### Frontend

- Keep the frontend under `services/frontend`
- Use Vite as the build tool
- Serve production assets through Nginx

### Backend

- Keep the API under `services/backend`
- Use Express for HTTP concerns only
- Expose health endpoints under `/health`

### Python Service

- Keep the FastAPI service under `services/python-service`
- Expose health endpoints under `/health`
- Keep app entrypoints under `app/`

### Infrastructure

- Keep Traefik config under `infrastructure/traefik`
- Keep monitoring config under `infrastructure/monitoring`
- Keep local orchestration in `docker/docker-compose.dev.yml`
- Keep Swarm orchestration in `docker/docker-stack.yml`

## Pull Request Conventions

- Reference the main change in the title
- Describe deployment or operational impact when infrastructure changes
- Note configuration changes explicitly
- Include validation steps for runtime or container changes
