# Copilot Instructions for FairShare

FairShare is an expense-splitting web app: a React 19 SPA (`web/`) talking to an Express 5 REST API (`api/v1/`) backed by SQLite, deployed behind Traefik in production (Docker Swarm) and via Docker Compose watch-mode in development.

## Build, lint, and test

Everything is driven from the repo root via `Makefile` → `scripts/*.sh`, which `pushd` into each service directory and run its npm scripts. There is no root-level npm/uv tooling — the JS packages in `web/` and `api/v1/` are entirely independent (no shared `node_modules`, no workspaces).

```bash
make dev      # ./scripts/dev-setup.sh   — docker compose up with watch mode
make prod     # docker stack deploy -c docker-stack.yml fairshare
make lint     # ./scripts/lint.sh        — yamllint, shellcheck, eslint (both services), hadolint
make test     # ./scripts/test.sh        — npm test in web/ then api/v1/
make ci       # ./scripts/ci.sh          — lint + test, mirrors the CI workflow
```

To work on a single service, `cd` into it directly — each has its own scripts:

```bash
cd web && npm run lint            # eslint .
cd web && npm test                # vitest run --coverage --exclude=e2e/**
cd web && npx vitest run src/pages/CostCalculator.test.jsx   # single file
cd web && npm run test:e2e        # playwright (needs docker-compose-dev.yml running)

cd api/v1 && npm run lint         # eslint .
cd api/v1 && npm test             # NODE_OPTIONS=--experimental-vm-modules jest
cd api/v1 && NODE_OPTIONS=--experimental-vm-modules npx jest src/routes/auth.test.js  # single file
```

`web/Makefile` also exposes `lint`/`test`/`ci` targets that just wrap the npm scripts above; `api/v1` has no per-service Makefile.

## Architecture

- **`web/`** — React 19 + Vite + React Router. Talks to the API through `/api/*`, proxied by Vite's dev server (`vite.config.js`) to `api_v1:3001` in dev, and by Traefik routing in production. Auth state lives in `AuthContext` (cookie-based, see below); no client-side router guards — pages render regardless of auth state and fetch calls fail with 401 if unauthenticated.
- **`api/v1/`** — Express 5, ESM (`"type": "module"`). Routes in `src/routes/` (`auth.js`, `incomes.js`, `expenses.js`, `health.js`) are mounted directly in `src/app.js`; there is no central auth middleware — each protected route handler independently reads `req.cookies.token` and calls `verifyToken` (see `src/utils/auth.js`). `src/db.js` wraps `sqlite`/`sqlite3`.
- **Data model**: users own their `incomes`/`expenses` as JSON blobs in SQLite columns (`src/routes/incomes.js`, `expenses.js`), not normalized tables.
- **Dev topology** (`docker-compose-dev.yml`): `web` (port 3000) and `api_v1` (port 3001) as separate Compose services, both built to the `dev` Dockerfile stage, with `develop.watch` syncing `./web/src`/`./api/v1/src` into the containers and rebuilding on `package.json` changes.
- **Prod topology** (`docker-stack.yml`): Docker Swarm stack pulling pre-built GHCR images, Traefik terminates TLS and routes `fairshare.fun` to the `web` service (which proxies `/api` itself) — see `web/nginx.conf`. SQLite file persists at `/cm/storage/fairshare/fairshare.db` on the Swarm host.
- Both Dockerfiles (`web/Dockerfile`, `api/v1/Dockerfile`) are multi-stage (`deps`/`dev`/`build`/`production` or similar), run as non-root, and expect `target: dev` to be selected explicitly for local development (see `docker-compose-dev.yml`) — the default/last stage is the hardened production image. The API production image starts as root only inside `api/v1/fairshare-entrypoint.sh`, which chowns the bind-mounted SQLite directory to `node` and then drops privileges with `su-exec`: host bind mounts ignore build-time `chown`, and a root-owned DB otherwise fails every write with `SQLITE_READONLY`. `src/db.js` refuses to start if the DB directory or file isn't writable.

## Key conventions

- **Auth**: JWT stored in an HttpOnly, `sameSite=strict` cookie (`utils/auth.js` `generateToken`/`verifyToken`); the frontend never touches the token directly and always sends `credentials: 'include'`. Client-side "is the user logged in" state is established by calling `GET /api/auth/me` and checking response status — this exact check is duplicated in both `AuthContext.jsx` (source of truth for the rest of the app via `useAuth()`) and `App.jsx` (a leftover local `useEffect`, not further wired up). Prefer `AuthContext`/`useAuth()` for any new auth-dependent code.
- **Rate limiting**: `src/middlewares/rateLimit.js` exports limiter *factories* (not instances, so each test gets a fresh store), mounted per-endpoint in `app.js` — exactly one limiter per route, so the `RateLimit` response header always describes the limit that really applies. Auth endpoints are keyed by `req.ip` (login 10/15min with `skipSuccessfulRequests`, register 5/hour); `/auth/me`, `/auth/logout`, `/incomes` and `/expenses` are keyed by the JWT's user id with an IP fallback, so one household member can't exhaust another's quota. `/incomes` and `/expenses` are deliberately generous (300/5min) because `CostCalculator` POSTs on every keystroke. `/health` is intentionally unlimited — it backs the container healthcheck. `trust proxy` is enabled only when `NODE_ENV=production` (overridable with `TRUST_PROXY`), because in production the socket peer is always nginx and Traefik replaces any client-supplied `X-Forwarded-For`; the dev stack publishes port 3001 directly, where trusting the header would let anyone spoof their IP.
- **localStorage-first, backend-sync-when-authenticated**: `CostCalculator.jsx` is the reference implementation of this app's core data-persistence pattern — incomes and expenses are always read from/written to `localStorage` first (works for anonymous users), and additionally synced to `/api/incomes` / `/api/expenses` when a `user` is present from `useAuth()`, with `localStorage` as the fallback if a network request fails. Follow this pattern for any new user-data feature rather than making the backend the sole source of truth.
- **ESM + Jest mocking**: `api/v1` tests are ESM and run with `NODE_OPTIONS=--experimental-vm-modules`. Since `jest.mock` doesn't work on ESM, dependencies are mocked with `jest.unstable_mockModule(...)` *before* dynamically `import()`-ing both the mocked modules and the module under test inside `beforeAll` (see `src/routes/auth.test.js`). Follow this pattern, not `jest.mock`.
- **ESLint**: both services use flat config (`eslint.config.js`, ESM, `@eslint/js` + `@eslint/markdown` + `@eslint/css`; `web` additionally uses `eslint-plugin-react`). Markdown and CSS files are linted too, not just JS/JSX.
- **Vitest + Node's experimental webstorage**: `web/vite.config.js` sets `test.execArgv: ['--no-experimental-webstorage']`. This is required because Node 24+'s built-in `localStorage` global shadows jsdom's when running under Vitest; removing this flag will silently break every localStorage-dependent test on newer Node versions.
- **UI kit (`web/src/ui/`)**: new UI should use the dependency-free component kit (`Button`, `LinkButton`, `IconButton`, `TextField`, `Switch`, `Card`, `Sheet`, `AsyncContent`, `Alert`, `EmptyState`, `Skeleton`, `Spinner`), imported from `src/ui` (the barrel also loads the design tokens). Controls use `fs-`-prefixed classes; `index.scss` only styles the document/app shell. Gesture-driven motion uses the springs in `src/ui/motion/`, not CSS transitions. See `web/src/ui/README.md`.
- **Budget exception**: monthly budgets in `web/src/pages/budgetStorage.js` are deliberately device-local, not API-synced. New unsaved months derive category limits (not transactions) from the most recent earlier saved month; logout clears the budget storage key. Do not silently mix budget transactions with split-cost expenses.
- **Dockerfile pinning**: base images are pinned by tag (not digest) intentionally, to stay Dependabot-updatable — see `.github/dependabot.yml` for the `docker` ecosystem entries covering `/web` and `/api/v1`.
