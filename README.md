# Payment Dispute Triage System

A full-stack **Node.js + React** prototype that helps banking operations staff triage and route customer payment disputes using transparent, rules-based decisions.

## Tech Stack

**Backend** (`server/`)
- Node.js + Express (TypeScript, ES modules)
- SQLite + Prisma ORM
- Vitest for unit tests

**Frontend** (`client/`)
- React 18 + Vite (TypeScript)
- Tailwind CSS
- Chart.js for analytics
- Vitest + Testing Library for component tests
- Playwright for end-to-end tests

The repo is an **npm workspaces monorepo**: one `npm install` at the root sets up both apps.

---

## Prerequisites

1. **Node.js 22** (or at minimum v20+)
   - Install via [nvm](https://github.com/nvm-sh/nvm) (recommended) or direct download from [nodejs.org](https://nodejs.org)
   - If using nvm:
     ```bash
     nvm install 22
     nvm use
     ```
   - Verify: `node -v` should show v22.x

2. **npm 10+** (ships with Node 20/22 — no separate install needed)
   - Verify: `npm -v`

---

## Setup Steps

### 1. Clone the repo

### 2. Install all dependencies

One command installs both server and client workspaces:

```bash
npm install
```

### 3. Set up the database

```bash
# Create the server environment file
cp server/.env.example server/.env

# Generate the Prisma client (creates the typed DB access layer)
npm run db:generate --workspace=server

# Run migrations (creates the SQLite database and tables)
npm run db:migrate --workspace=server

# Seed mock data (customers, transactions)
npm run db:seed --workspace=server
```

The database is a local SQLite file at `server/prisma/dev.db` — no external database server needed.

### 4. Start the application

```bash
npm run dev
```

This starts both:
- **Backend** → http://localhost:3001 (Express API)
- **Frontend** → http://localhost:5173 (Vite dev server)

The Vite dev server proxies `/api/*` requests to port 3001, so the frontend talks to the backend seamlessly.

---

## Running Tests

### Unit tests (both workspaces)

```bash
npm run test
```

### End-to-end tests (Playwright)

First time only — install browser binaries:

```bash
npx playwright install
```

Then run:

```bash
npm run test:e2e
```

> E2E tests expect the dev servers to be running. If tests fail on missing servers, run `npm run dev` in a separate terminal first.

---

## Other Useful Commands

| Command | Purpose |
|---------|---------|
| `npm run lint` | Lint all code (ESLint) |
| `npm run format` | Auto-format with Prettier |
| `npm run build` | Production build (server → `server/dist/`, client → `client/dist/`) |
| `npm run db:studio --workspace=server` | Open Prisma Studio (visual DB browser) |

---

## TL;DR (copy-paste block)

```bash
nvm use
npm install
cp server/.env.example server/.env
npm run db:generate --workspace=server
npm run db:migrate --workspace=server
npm run db:seed --workspace=server
npm run dev
```

After that, open http://localhost:5173 and you're in.

---

## Project Structure

```
Group30SoftwareEngineerCong/
├── server/                 # Express backend (TypeScript, ESM)
│   ├── src/
│   │   ├── index.ts        # Server entry point
│   │   ├── routes/         # API routes (/api/*)
│   │   ├── services/       # Business logic (triage engine)
│   │   └── middleware/     # Error handling
│   ├── prisma/             # Schema, migrations, seed script
│   ├── tests/              # Vitest unit tests
│   └── tsconfig.json
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # Shared TypeScript interfaces
│   │   └── utils/          # Formatters and helpers
│   ├── tests/              # Vitest + Testing Library component tests
│   ├── e2e/                # Playwright end-to-end tests
│   └── tsconfig.json
├── docs/                   # Project documentation
├── .nvmrc                  # Pinned Node version (22)
└── package.json            # npm workspaces + root scripts
```

## License

MIT
