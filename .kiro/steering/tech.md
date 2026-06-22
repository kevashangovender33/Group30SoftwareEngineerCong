# Tech Stack

## Runtime

- Node.js >=20 (`.nvmrc` targets 22)
- npm workspaces monorepo

## Server

- Express 4 — HTTP framework
- TypeScript — type-safe server code
- Prisma ORM — database access layer
- SQLite — local file-based database (via `DATABASE_URL=file:./dev.db`)
- dotenv — environment variable loading
- cors — cross-origin request handling

## Client

- React 18 — UI library
- Vite 5 — build tool and dev server
- Tailwind CSS 3 — utility-first styling
- TypeScript — type-safe components

## Testing

- Vitest — unit and integration tests (server + client)
- @testing-library/react — React component testing
- Playwright — end-to-end browser tests

## Linting & Formatting

- ESLint 9 (flat config) with TypeScript and React plugins
- Prettier — code formatting
- eslint-config-prettier — disables ESLint rules that conflict with Prettier

## Dev Tooling

- concurrently — runs server and client dev processes in parallel
- tsx — TypeScript execution for development (no build step needed)
