# FairShare

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Configuration](#configuration)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Overview

FairShare is a web application for tracking and splitting shared expenses. It supports proportional splitting based on income shares and equal splitting, maintains a running expense history, and calculates the current balance between users.

The production deployment is available at [https://fairshare.fun](https://fairshare.fun).

## Architecture

| Component | Technology | Default Port |
|-----------|-----------|-------------|
| Frontend  | React 19, Vite, React Router | 3000 |
| Backend   | Node.js, Express 5, JWT authentication (bcrypt password hashing) | 3001 |
| Database  | SQLite (persisted via Docker volume) | — |

The production stack additionally includes Traefik (reverse proxy, TLS termination via Let's Encrypt) and Watchtower (automated container updates).

## Features

- Expense splitting with two methods: proportional (by income share) and equal
- Expense history with per-entry records
- Balance calculation showing the net amount owed between users
- JWT-based authentication with bcrypt password hashing
- Hot-reload development environment via Docker Compose watch mode

## Prerequisites

- Docker 20.10.0 or higher
- Docker Compose 2.0.0 or higher
- Node.js 18 or higher (development only, for running linters and tests outside Docker)

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/elidholm/fair-share.git
   cd fair-share
   ```

2. Start the development environment:
   ```bash
   make dev
   ```

   Alternatively, run the script directly:
   ```bash
   ./scripts/dev-setup.sh
   ```

   This command:
   - Builds and starts the frontend container (http://localhost:3000)
   - Builds and starts the backend container (http://localhost:3001)
   - Enables Docker Compose watch mode: source file changes under `./backend/src` and `./frontend/src` sync into the running containers automatically; changes to `package.json` trigger a container rebuild
   - Stores the SQLite database in `./local_db/fairshare.db`

3. Access the application at `http://localhost:3000`.

## Production Deployment

The production configuration uses pre-built images from GitHub Container Registry and is intended to run on a host with ports 80 and 443 accessible.

1. Start the services:
   ```bash
   make prod
   ```

   Alternatively:
   ```bash
   ./scripts/prod-setup.sh
   ```

   This command stops any running containers, pulls the latest images, and starts the stack in detached mode.

2. The frontend is served at `https://fairshare.fun`. TLS certificates are provisioned automatically via Let's Encrypt. Watchtower checks for updated images every 30 seconds.

The production database is stored on the host at `/cm/storage/fairshare/fairshare.db` and mounted into the backend container.

## Configuration

### Backend Environment Variables

| Variable   | Description                                      | Default (dev)                     |
|-----------|--------------------------------------------------|-----------------------------------|
| `DB_TYPE`  | Database backend. Currently only `sqlite` is supported. | `sqlite`                 |
| `DB_PATH`  | Absolute path to the SQLite database file.       | `/app/database/fairshare.db`      |
| `NODE_ENV` | Runtime environment (`development`/`production`). | `development`                    |

### Frontend Environment Variables

| Variable   | Description                                   | Default (dev)              |
|-----------|-----------------------------------------------|----------------------------|
| `NODE_ENV` | Runtime environment (`development`/`production`). | `development`          |

The frontend communicates with the backend at `http://localhost:3001` in development. In production this is handled by the Traefik network routing.

## Testing

The project uses Jest (backend) and Vitest + Playwright (frontend).

Run all tests:
```bash
make test
```

Run linters (YAML, shell scripts, ESLint for frontend and backend, Hadolint for Dockerfiles):
```bash
make lint
```

Run linting and tests together (as in CI):
```bash
make ci
```

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes. Source files are under `./backend/src` and `./frontend/src`.
4. Run `make lint` and `make test` to verify your changes.
5. Commit and push: `git push origin feature/your-feature`
6. Open a Pull Request against `master`.

## License

This project is licensed under the Apache-2.0 License. See the [LICENSE](LICENSE) file for details.

---

For bug reports or questions, open an issue in the GitHub repository.
