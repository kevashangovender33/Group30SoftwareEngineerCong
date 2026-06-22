# File Organisation

## Monorepo Layout

```
├── server/                  # Express backend (port 3001)
│   ├── src/
│   │   ├── index.ts         # App entry point, middleware setup, server start
│   │   ├── routes/          # Express Router modules (one per domain)
│   │   └── middleware/      # Express middleware (error handler, auth, etc.)
│   ├── prisma/
│   │   └── schema.prisma    # Database schema definition
│   ├── tests/               # Server unit/integration tests
│   ├── .env.example         # Environment variable template
│   ├── package.json         # Server dependencies and scripts
│   ├── tsconfig.json        # Server TypeScript config
│   └── vitest.config.ts     # Server test config
│
├── client/                  # React frontend (Vite dev server)
│   ├── src/
│   │   ├── main.tsx         # React entry point (renders App)
│   │   ├── App.tsx          # Root component
│   │   └── index.css        # Tailwind base imports
│   ├── tests/               # Component unit tests
│   ├── e2e/                 # Playwright e2e test specs
│   ├── index.html           # Vite HTML template
│   ├── package.json         # Client dependencies and scripts
│   ├── tsconfig.json        # Client TypeScript config
│   ├── vite.config.ts       # Vite build/dev config
│   ├── vitest.config.ts     # Client test config
│   ├── tailwind.config.js   # Tailwind configuration
│   ├── postcss.config.js    # PostCSS plugins
│   └── playwright.config.ts # Playwright e2e config
│
├── package.json             # Root workspace config, shared scripts
├── eslint.config.mjs        # ESLint flat config (shared)
├── tsconfig.json            # Root TypeScript config
├── .prettierrc.json         # Prettier config
├── .prettierignore          # Prettier ignore patterns
└── .nvmrc                   # Node version (22)
```

## Conventions

- New route domains go in `server/src/routes/<domain>.ts` and are mounted in `server/src/index.ts`.
- New middleware goes in `server/src/middleware/`.
- New React components go in `client/src/` (subdirectories as the app grows).
- Unit tests mirror source structure: `server/tests/`, `client/tests/`.
- E2e tests live in `client/e2e/`.
