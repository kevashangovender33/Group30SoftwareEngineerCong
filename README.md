# Node Conf Starter

A full-stack **Node.js + React** starter template with modern tooling and sensible defaults. Clone it, install, and you're running in two commands — no database or config required to start.

## Tech Stack

**Backend** (`server/`)
- Node.js + Express (TypeScript, ES modules)
- SQLite + Prisma ORM (optional — not required to run)
- Vitest for unit tests

**Frontend** (`client/`)
- React 18 + Vite (TypeScript)
- Tailwind CSS
- Vitest + Testing Library for component tests
- Playwright for end-to-end tests

The repo is an **npm workspaces monorepo**: one `npm install` at the root sets up both apps.

## Prerequisites

- **Node.js 20+** (the repo pins **Node 22 LTS** via `.nvmrc`)
- **npm 10+** (ships with Node 20/22)

If you use a Node version manager, select the pinned version first:

```bash
nvm use      # or: fnm use
```

> No version manager? Just make sure `node -v` reports v20 or newer.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/thandog/node-conf-starter.git
cd node-conf-starter

# 2. Install everything (both workspaces) from the committed lockfile
npm install        # or `npm ci` for an exact, reproducible install

# 3. Run both apps
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:3001
- The Vite dev server proxies `/api/*` to the backend, so the app works out of the box.

That's it — no environment file or database needed to get started.

> The backend listens on port **3001** by default. Port 5000 is intentionally avoided because macOS uses it for AirPlay Receiver. Override with `PORT` in `server/.env` if needed.

## Common Scripts

Run from the repo root:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start backend + frontend together (hot reload) |
| `npm run build` | Type-check and build both apps for production |
| `npm start` | Run the built backend (`server/dist`) |
| `npm test` | Run all unit/component tests once (backend + frontend) |
| `npm run test:e2e` | Run Playwright end-to-end tests (see note below) |
| `npm run lint` | Lint all code with ESLint |
| `npm run format` | Format all code with Prettier (`format:check` to verify) |

Per-workspace scripts (append `--workspace=server` or `--workspace=client`):

| Command | Workspace | What it does |
| --- | --- | --- |
| `npm run dev` | both | Start that app's dev server |
| `npm run build` | both | Build that app |
| `npm test` | both | Run tests once |
| `npm run test:watch` | both | Run tests in watch mode |
| `npm run test:coverage` | both | Run tests with a coverage report |
| `npm run preview` | client | Preview the production build |

## Building for Production

```bash
npm run build
```

- Backend compiles to `server/dist/` (run with `npm start`).
- Frontend builds static assets to `client/dist/` (serve with any static host, or `npm run preview --workspace=client`).

## Testing

Unit and component tests run once and exit (CI-friendly):

```bash
npm test                              # both workspaces
npm run test:watch --workspace=client # watch mode while developing
```

### End-to-end (Playwright)

Playwright needs its browsers installed once per machine before the first run:

```bash
npx playwright install
npm run test:e2e
```

E2E tests live in `client/e2e/`. Playwright starts the client dev server automatically.

## Database (optional)

SQLite + Prisma is preconfigured but **not required to run the app**. To use it:

```bash
# 1. Create the server env file
cp server/.env.example server/.env

# 2. Generate the Prisma client and create the database
npm run db:generate --workspace=server
npm run db:migrate --workspace=server
```

Other database scripts (run with `--workspace=server`):

| Command | What it does |
| --- | --- |
| `npm run db:studio` | Open Prisma Studio to view/edit data |
| `npm run db:migrate:deploy` | Apply migrations in production |

The Prisma schema lives in `server/prisma/schema.prisma`. The SQLite file and generated client are git-ignored.

## Project Structure

```
node-conf-starter/
├── server/                 # Express backend (TypeScript, ESM)
│   ├── src/
│   │   ├── index.ts        # Server entry point
│   │   ├── routes/         # API routes (/api/*)
│   │   └── middleware/     # Error handling, etc.
│   ├── prisma/             # Prisma schema (optional DB)
│   ├── tests/              # Vitest unit tests
│   └── tsconfig.json       # Emits runnable JS to dist/ (NodeNext)
├── client/                 # React + Vite frontend
│   ├── src/                # App source
│   ├── tests/              # Vitest + Testing Library component tests
│   ├── e2e/                # Playwright end-to-end tests
│   └── tsconfig.json       # Type-check only (Vite handles bundling)
├── tsconfig.json           # Shared, strict compiler base
├── .nvmrc                  # Pinned Node version
└── package.json            # npm workspaces + root scripts
```

## API

The backend exposes a few sample endpoints:

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Server liveness check |
| GET | `/api/health` | API health + uptime |
| GET | `/api/info` | API name/version/environment |
| POST | `/api/echo` | Echoes the JSON body back |

## License

MIT

## Contributing

Issues and enhancement requests welcome.
