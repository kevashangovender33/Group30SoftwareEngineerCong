# Testing Requirements

## Mandatory Testing Policy

Every feature or flow implemented in this project **must** include both unit tests and end-to-end tests. No feature is considered complete without them.

## Unit Tests (Mandatory)

- Every new function, service module, route handler, or React component must have corresponding unit tests.
- Server unit tests go in `server/tests/` using Vitest.
- Client component tests go in `client/tests/` using Vitest + @testing-library/react.
- Test file naming: `<module>.test.ts` or `<Component>.test.tsx`.
- Run with: `npm run test`

### What to test:
- Route handlers: validate request/response for success and error cases.
- Service logic (e.g., rules engine): test every branch and edge case.
- React components: test rendering, user interactions, and state changes.
- Utility functions: test inputs/outputs and boundary conditions.

## End-to-End Tests (Mandatory Per Feature Flow)

- Every user-facing feature flow must have at least one Playwright e2e test covering the happy path.
- E2e tests go in `client/e2e/` with naming: `<feature>.spec.ts`.
- Run with: `npm run test:e2e`

### What constitutes a feature flow:
- Dispute capture → triage result → acknowledge (full journey)
- Customer search and selection
- Transaction browsing and filtering
- Validation error display
- Any new user-facing workflow added to the app

### E2E test expectations:
- Test the complete user journey from start to finish.
- Use realistic mock data (the seeded database).
- Assert on visible UI outcomes, not implementation details.
- Include assertions for loading states, error states, and success states.

## Completion Checklist

Before marking any feature as done, confirm:

1. ✅ Unit tests written and passing (`npm run test`)
2. ✅ E2E test(s) written for the feature flow (`npm run test:e2e`)
3. ✅ Tests cover both happy path and key error/edge cases
4. ✅ No skipped or commented-out tests
