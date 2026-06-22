# Coding Conventions

## General

- Use TypeScript for all source files.
- Use ES module syntax (`import`/`export`). The project uses `"type": "module"`.
- Prefix intentionally unused variables with an underscore (`_req`, `_unused`).
- Follow Prettier formatting (config in `.prettierrc.json`).
- Follow ESLint rules (config in `eslint.config.mjs`).

## Server (Express)

- Place route handlers in `server/src/routes/` as separate Router modules.
- Mount routers under `/api` in `server/src/index.ts`.
- Place business logic (rules engine, calculators) in `server/src/services/`.
- Use `server/src/middleware/` for Express middleware (error handlers, auth, validation).
- Use Prisma for all database access. Never write raw SQL unless absolutely necessary.
- Keep controller logic thin — route handlers validate input and call services, services contain the logic.
- Import paths must include the `.js` extension (Node ESM resolution): `import { foo } from './bar.js'`.
- Define configurable thresholds (e.g., HIGH_VALUE_THRESHOLD = 10000) as constants in a shared config module.

## Client (React)

- Use functional components with hooks.
- Use Tailwind CSS utility classes for styling — avoid custom CSS unless needed.
- Add `data-testid` attributes to elements that tests interact with.
- Keep components small and focused; extract reusable pieces into separate files.
- Place component tests in `client/tests/` using Testing Library and Vitest.

## Testing

- Unit tests use Vitest (`*.test.ts` or `*.test.tsx`).
- E2e tests use Playwright (`client/e2e/*.spec.ts`).
- Run tests with `npm run test` (unit) or `npm run test:e2e` (e2e).
- Use `vitest run` (not watch mode) when executing from the command line in CI or tooling.

## Database

- Define models in `server/prisma/schema.prisma`.
- After schema changes, run `npm run db:migrate --workspace=server` to create a migration.
- Run `npm run db:generate --workspace=server` to regenerate the Prisma client.
