# Architecture Principles

## Layered Service Architecture

This project follows a layered architecture with strict separation of concerns. Dependencies flow in one direction: outer layers depend on inner layers, never the reverse.

### Backend Layers (Express)

```
Routes (Controllers) → Services → Repository (Data Access)
```

**Routes/Controllers** (`server/src/routes/`)
- HTTP-only concerns: parse request params/body, call service, format and send response.
- No business logic. No direct database calls.
- Handles HTTP status codes and error responses.
- One router file per domain (customers, transactions, disputes, triage).

**Services** (`server/src/services/`)
- All business logic lives here: rules engine, priority calculation, age calculation, validation.
- Framework-agnostic — no Express `req`/`res` objects. Accept plain data, return plain data.
- Testable in isolation without HTTP or database.
- May call repository functions for data access.

**Repository / Data Access** (`server/src/repositories/` or inline Prisma in services)
- Database queries via Prisma client.
- Returns typed data objects.
- No business logic — just CRUD operations and query composition.

### Frontend Layers (React)

```
Pages/Screens → Components → Hooks (API + State)
```

**Pages/Screens** (`client/src/pages/` or top-level in `client/src/`)
- Full-page views composing multiple components.
- Manage screen-level state and transitions.
- Examples: DisputeCapturePage, TriageResultPage.

**Components** (`client/src/components/`)
- Reusable, presentational UI pieces.
- Accept data via props, emit events via callbacks.
- No direct API calls — receive data from parent or hooks.
- Examples: PriorityBadge, AgeBadge, RuleCard, CustomerSelect.

**Custom Hooks** (`client/src/hooks/`)
- Encapsulate API communication and state logic.
- Return data, loading state, and error state.
- Examples: `useCustomers()`, `useTransactions(customerId)`, `useCreateDispute()`.

---

## SOLID Principles

### Single Responsibility (SRP)
- Each module/file has one reason to change.
- Route handlers don't contain business logic.
- Services don't know about HTTP.
- Components don't fetch data directly.

### Open/Closed (OCP)
- The rules engine is open for extension (add new rules) without modifying existing rule evaluation logic.
- Rules are defined as a data structure (array of rule objects) iterated by the engine — adding a rule means adding to the array, not changing the loop.

### Liskov Substitution (LSP)
- Interfaces/types for services allow mocking in tests.
- Any service implementing the same interface can be swapped without breaking callers.

### Interface Segregation (ISP)
- Keep interfaces small and focused.
- A triage service exposes `evaluate()`, not a god-object with unrelated methods.
- React hooks return only what the consumer needs.

### Dependency Inversion (DIP)
- High-level modules (routes) depend on abstractions (service interfaces), not concrete implementations.
- Services receive their dependencies (Prisma client) via injection or module import — easily swappable for testing.
- In practice: services import a shared Prisma instance; tests can mock it.

---

## Rules for Implementation

1. **Never put business logic in route handlers.** If you're writing an `if` statement about dispute rules in a route file, move it to a service.

2. **Never import Express types in services.** Services accept and return plain TypeScript objects.

3. **Never call `fetch()` directly in React components.** Use a custom hook that handles loading/error/data states.

4. **One export per concern.** Don't bundle unrelated functions in a single file. Split by responsibility.

5. **Dependencies flow inward.** Routes → Services → Repository. Never the reverse. A service must never import from a route.

6. **Make it testable.** If you can't unit test a function without starting Express or a database, it's in the wrong layer.

7. **Favour composition over inheritance.** Use functions, hooks, and plain objects. Avoid class hierarchies.

8. **Constants in one place.** Thresholds (R10,000), age boundaries (7/14 days), and enum lists are defined in a shared constants/config module, imported where needed.
