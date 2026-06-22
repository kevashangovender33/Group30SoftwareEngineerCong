# File Organisation

## Monorepo Layout

```
├── server/                  # Express backend (port 3001)
│   ├── src/
│   │   ├── index.ts         # App entry point, middleware setup, server start
│   │   ├── routes/          # Express Router modules (one per domain)
│   │   │   ├── customers.ts
│   │   │   ├── transactions.ts
│   │   │   ├── disputes.ts
│   │   │   ├── triage.ts
│   │   │   └── reference-data.ts
│   │   ├── services/        # Business logic (rules engine, priority/age calculators)
│   │   │   └── triageEngine.ts
│   │   └── middleware/      # Express middleware (error handler, validation)
│   │       └── errorHandler.ts
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema (Customer, Transaction, Dispute)
│   │   ├── seed.ts          # Mock data seed script
│   │   └── migrations/      # Auto-generated migration files
│   ├── tests/               # Server unit/integration tests
│   ├── .env                 # Local environment variables
│   ├── .env.example         # Environment variable template
│   ├── package.json         # Server dependencies and scripts
│   ├── tsconfig.json        # Server TypeScript config
│   └── vitest.config.ts     # Server test config
│
├── client/                  # React frontend (Vite dev server, proxied to :3001)
│   ├── src/
│   │   ├── main.tsx         # React entry point (renders App)
│   │   ├── App.tsx          # Root component (manages screen state)
│   │   ├── components/      # Reusable UI components
│   │   │   ├── DisputeCaptureForm.tsx
│   │   │   ├── TriageResultScreen.tsx
│   │   │   ├── CustomerSelect.tsx
│   │   │   ├── TransactionSelect.tsx
│   │   │   ├── PriorityBadge.tsx
│   │   │   └── AgeBadge.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   │   └── useApi.ts
│   │   ├── types/           # Shared TypeScript interfaces
│   │   │   └── index.ts
│   │   └── index.css        # Tailwind base imports
│   ├── tests/               # Component unit tests
│   ├── e2e/                 # Playwright e2e test specs
│   ├── index.html           # Vite HTML template
│   ├── package.json         # Client dependencies and scripts
│   ├── tsconfig.json        # Client TypeScript config
│   ├── vite.config.ts       # Vite build/dev config (includes API proxy)
│   ├── vitest.config.ts     # Client test config
│   ├── tailwind.config.js   # Tailwind configuration
│   ├── postcss.config.js    # PostCSS plugins
│   └── playwright.config.ts # Playwright e2e config
│
├── docs/                    # Project documentation
│   ├── requirements.md      # EARS requirements specification
│   ├── api-spec.md          # API endpoint documentation
│   ├── architecture.md      # System architecture with Mermaid diagrams
│   └── test-cases.md        # Test case definitions
│
├── package.json             # Root workspace config, shared scripts
├── eslint.config.mjs        # ESLint flat config (shared)
├── tsconfig.json            # Root TypeScript config
├── .prettierrc.json         # Prettier config
├── .prettierignore          # Prettier ignore patterns
└── .nvmrc                   # Node version (22)
```

## Conventions

- New API route domains go in `server/src/routes/<domain>.ts` and are mounted in `server/src/index.ts`.
- Business logic (rules engine, calculators) goes in `server/src/services/`.
- Express middleware goes in `server/src/middleware/`.
- New React components go in `client/src/components/`.
- Custom hooks go in `client/src/hooks/`.
- Shared TypeScript types/interfaces go in `client/src/types/`.
- Unit tests mirror source structure: `server/tests/`, `client/tests/`.
- E2e tests live in `client/e2e/`.
- Documentation lives in `docs/`.
