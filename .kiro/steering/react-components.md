---
inclusion: fileMatch
fileMatchPattern: "client/src/**"
---

# React Component Guidelines

These guidelines apply when working on React components in the client.

## Component Structure

- Use functional components with TypeScript.
- Define props as an interface above the component.
- Export components as the default export for page-level components, named exports for shared/utility components.

## Styling

- Use Tailwind CSS utility classes exclusively.
- Prefer responsive design with Tailwind breakpoints (`sm:`, `md:`, `lg:`).
- Use semantic HTML elements for accessibility (`<main>`, `<nav>`, `<section>`, `<button>`, etc.).

## Colour Conventions (REQ-011, REQ-015, REQ-016)

Recommendation banners:
- Red (`bg-red-*`, `text-red-*`) — Escalate actions (ESCALATE_FRAUD, ESCALATE_SENIOR)
- Amber (`bg-amber-*`, `text-amber-*`) — Monitor/Investigate actions (MONITOR_24H, INVESTIGATE, REFER_PAYMENTS)
- Green (`bg-green-*`, `text-green-*`) — Resolve/Close actions (IMMEDIATE_REVERSAL, CLOSE_RESOLVED)

Priority badges:
- High — Red (`bg-red-100 text-red-800`)
- Medium — Amber (`bg-amber-100 text-amber-800`)
- Low — Green (`bg-green-100 text-green-800`)

Age badges:
- New — Grey (`bg-gray-100 text-gray-800`)
- Aging — Amber (`bg-amber-100 text-amber-800`)
- Overdue — Red (`bg-red-100 text-red-800`)

## State Management

- Use `useState` for local component state.
- Use `useEffect` for side effects (API calls, subscriptions).
- Lift state up when multiple sibling components need access to the same data.

## API Communication

- The Vite dev server proxies `/api` requests to the Express backend.
- Use `fetch('/api/...')` for API calls — no need to include the full backend URL in development.
- Handle loading and error states for all async operations.

## Testing

- Add `data-testid` attributes to key interactive and display elements.
- Write component tests in `client/tests/` using `@testing-library/react`.
- Test user interactions and rendered output, not implementation details.
