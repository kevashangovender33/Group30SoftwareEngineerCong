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
