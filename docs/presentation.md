# Group 30 — SWE Conference Presentation

## Payment Dispute Triage System: Building with Kiro

---

## 1. Specifications — How Roles Contributed

Our team followed a structured spec-driven process where each role produced artefacts that directly fed into Kiro's build pipeline.

### Feature Analyst → EARS Requirements

The Feature Analyst produced **21 EARS-format requirements** (REQ-001 through REQ-021) covering:

- **Mock data constraints** (REQ-001–003): Isolated data, 3 payment types, seed initialisation
- **Dispute capture & triage engine** (REQ-004–010): Rules engine, decision matrix, guaranteed output
- **Transparency & indicators** (REQ-011–016): Priority badges, age flags, rule display
- **Error handling & UX** (REQ-017–021): Validation, loading states, single-screen results

Each requirement uses the EARS notation patterns (Ubiquitous, Event-Driven, State-Driven, Unwanted Behaviour, Where) giving Kiro unambiguous acceptance criteria to implement against.

**Example:**
> **REQ-009 (Where):** Where the issue category indicates potential fraud (i.e., "Unauthorised Transaction"), the system shall recommend "Escalate to Fraud Team" as the next action.

### Test Architect → 76 Structured Test Cases

The Test Architect produced **76 test cases** in Given/When/Then format across:

| Category | Count |
|----------|-------|
| Unit Tests | 28 |
| Integration Tests | 26 |
| E2E Tests | 22 |

Test cases trace directly to requirements (e.g., TC-025 validates REQ-018's "Already Refunded" short-circuit). This gave Kiro a clear verification target for every feature.

### API Designer → 6 Endpoint Specifications

The API Designer defined a complete REST contract:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/reference-data` | Payment types & issue categories |
| `GET /api/customers` | Customer search |
| `GET /api/transactions` | Transaction retrieval with filters |
| `POST /api/disputes` | Dispute creation + triage |
| `GET /api/disputes/:id` | Full dispute detail |
| `POST /api/triage/evaluate` | Standalone rules engine evaluation |

Each endpoint specifies request/response shapes, HTTP status codes, and error conditions — precision Kiro could implement directly.

### UI/UX Designer → Design System & Screen Specs

The UI/UX Designer produced a comprehensive **design system** (codified into `design-system.md` steering) including:

- Typography tokens (Inter font, 7 size/weight variants)
- Colour palette (14 colour tokens + 4 functional triage colours)
- Component specifications for all 4 screens
- Responsive layout rules (desktop side nav, mobile bottom nav)
- Recommendation banner colour mapping per action code

### Architect → Layered Architecture + Data Model

The Architect defined:

- **Layered architecture**: Routes → Services → Repository (backend), Pages → Components → Hooks (frontend)
- **Data model**: Customer, Transaction, Dispute, TriggeredRule entities with relationships
- **SOLID principles** applied to the rules engine (Open/Closed for rule extension)
- **Technology decisions** with rationale (Express, Prisma, SQLite, Vite, Tailwind)
- **Mermaid diagrams** for system overview, sequence flows, and rules engine flowchart

### Facilitator (Delivery Manager)

Kept the team on track across Day 1 (specification) and Day 2 (build). Ensured:
- API spec matched requirements
- UI spec referenced correct endpoints
- Test cases mapped to requirements
- Artefacts were consistent and Kiro-readable

### Harness Engineer → The Bridge

Translated all team artefacts into Kiro-consumable formats:
- Converted requirements into Kiro specs (requirements.md → design.md → tasks.md)
- Created 12 steering files to guide agent behaviour
- Set up hooks for automated quality enforcement
- Fed specs to Kiro and monitored output quality during the build phase

---

## 2. Harness — Steering Files, Hooks, and Specs

The Harness Engineer set up the complete "agent harness" — the persistent context, quality gates, and structured build plans that shaped Kiro's behaviour throughout development.

### Steering Files (12 files in `.kiro/steering/`)

Steering files provide persistent context included in every Kiro interaction. They act as the team's collective knowledge, encoded for the AI.

| File | Purpose | Inclusion Mode |
|------|---------|---------------|
| `product.md` | What the system does, core question, constraints | Always |
| `tech.md` | Runtime, frameworks, testing tools | Always |
| `structure.md` | Monorepo layout, file naming conventions | Always |
| `conventions.md` | TypeScript, ESM, Prisma, testing patterns | Always |
| `architecture-principles.md` | Layered architecture, SOLID, dependency rules | Always |
| `testing.md` | Mandatory unit + E2E test policy | Always |
| `debugging.md` | Server restart rules, diagnostic order for failures | Always |
| `requirements-guard.md` | Cross-reference requirements before implementing | Always |
| `api-conventions.md` | Express route handler patterns | File-match: `server/src/routes/**` |
| `react-components.md` | React component guidelines, colour conventions | File-match: `client/src/**` |
| `design-system.md` | Full design system with tokens and component specs | File-match: `client/src/**` |
| `prisma-guide.md` | Database conventions and Prisma workflow | File-match: `server/prisma/**` |

**How steering guided Kiro:**

1. **`requirements-guard.md`** — Before implementing anything, Kiro cross-references against REQ-001–021. If a request doesn't map to a documented requirement, it asks for clarification rather than assuming.

2. **`architecture-principles.md`** — Enforces "never put business logic in route handlers" and "never call fetch() in React components." Kiro follows SOLID principles automatically.

3. **`design-system.md`** — Ensures every component uses the correct colour tokens, typography, and layout patterns. No guessing about styles.

4. **`debugging.md`** — When E2E tests fail, Kiro follows a diagnostic order: check stale server processes → check backend routes → check Vite proxy → only then investigate code. Prevents wasted debugging cycles.

5. **`testing.md`** — Makes unit + E2E tests mandatory for every feature. No feature is considered complete without both.

### Hooks (2 automated triggers in `.kiro/hooks/`)

Hooks are event-driven triggers that enforce quality without manual intervention.

#### `lint-on-save.kiro.hook`
```json
{
  "name": "Lint on Save",
  "when": { "type": "fileEdited", "patterns": ["**/*.ts", "**/*.tsx"] },
  "then": { "type": "runCommand", "command": "npx eslint --no-warn-ignored \"$KIRO_FILE_PATH\"" }
}
```
**Effect:** Every time Kiro edits a TypeScript file, ESLint runs automatically. Lint errors are caught immediately, not at the end.

#### `test-on-create.kiro.hook`
```json
{
  "name": "Test on Create",
  "when": { "type": "fileCreated", "patterns": ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts"] },
  "then": { "type": "runCommand", "command": "npm run test" }
}
```
**Effect:** When a new test file is created, the full test suite runs. New tests must pass immediately — no broken tests accumulate.

### Specs (4 features, each with 3-phase workflow)

Kiro Specs are the primary build mechanism. Each feature follows: **Requirements → Design → Tasks**.

| Spec | Scope | Tasks |
|------|-------|-------|
| `payment-dispute-triage` | Core capture → triage → result flow | 12 task groups, all ✅ |
| `dispute-persistence` | Normalised TriggeredRule table, status lifecycle, Prisma transactions | 10 task groups, all ✅ |
| `dispute-history-view` | Paginated, filterable, sortable dispute list with navigation | 10 task groups, all ✅ |
| `dispute-analytics-dashboard` | Chart.js visualizations with animated bar/doughnut charts | 15 task groups, all ✅ |

**How specs guided Kiro:**

Each spec's `design.md` includes:
- Architecture diagrams (Mermaid)
- Component interfaces with TypeScript signatures
- Data model definitions
- **Correctness Properties** — formal statements Kiro validates with property-based tests (fast-check)
- Error handling matrices
- Testing strategy with specific test descriptions

Each spec's `tasks.md` includes:
- Ordered implementation tasks with dependency graphs
- Requirement traceability (each task cites specific requirements)
- Checkpoints for incremental validation
- Parallel execution waves for efficiency

**Example correctness property (from dispute-persistence):**
> *For any* valid dispute where the triage engine produces a recommendationCode other than CLOSE_RESOLVED, the persisted dispute SHALL have status = TRIAGED and resolvedAt = null.

This becomes a property-based test with fast-check generating 100+ random inputs to verify the invariant holds universally.

---

## 3. Demo — The Working Prototype

### What We Built

A **Payment Dispute Triage System** — an internal banking operations tool where staff:

1. **Search and select a customer** from the mock dataset
2. **Select a transaction** belonging to that customer
3. **Capture a dispute** (confirm payment type, select issue category)
4. **Receive an automated triage recommendation** from a deterministic rules engine
5. **View full transparency** — which rules fired, why, priority/age indicators
6. **Browse dispute history** — paginated, filterable, sortable
7. **View analytics dashboard** — animated charts showing dispute distributions

### Live Demo Flow

```
Customer Selection → Transaction Selection → Dispute Capture → Triage Result
         ↓                                                          ↓
   View History ←──────────────── Log New Dispute ──────────────────┘
         ↓
  Analytics Dashboard (Charts)
```

### Key Technical Highlights

| Feature | Implementation |
|---------|---------------|
| Rules engine | 10 priority-ordered rules, first-match-wins, deterministic |
| Priority calculator | HIGH/MEDIUM/LOW based on amount, fraud, age |
| Age indicator | NEW/AGING/OVERDUE from transaction date |
| Persistence | Prisma interactive transactions, normalised TriggeredRule table |
| History view | Server-side pagination, filtering, sorting with query validation |
| Analytics | Chart.js bar + doughnut charts, Prisma groupBy aggregations |
| Navigation | State-based screen routing, desktop side nav + mobile bottom nav |
| Design system | Institutional design language, colour-coded recommendations |

### Tech Stack in Action

- **Backend:** Express 4 + TypeScript + Prisma ORM + SQLite
- **Frontend:** React 18 + Vite 5 + Tailwind CSS 3 + Chart.js
- **Testing:** Vitest (unit) + fast-check (property-based) + Playwright (E2E)
- **Quality:** ESLint 9 + Prettier + automated hooks

### Running the Demo

```bash
npm install          # Install all dependencies
npm run db:migrate --workspace=server   # Create database
npm run db:seed --workspace=server      # Seed mock data
npm run dev          # Start both server (:3001) and client (:5173)
```

---

## 4. What We Learnt — How Our Thinking Changed

### Shift 1: From Writing Code to Writing Specifications

The biggest mindset shift: **the code is the output, not the input**. Our primary job became producing precise, unambiguous specifications. The quality of the specifications directly determined the quality of the code Kiro produced.

- Bad spec → Kiro guesses → rework
- Precise spec → Kiro implements correctly → first-time quality

We spent Day 1 entirely on specifications (requirements, API contracts, test cases, architecture, UI specs). Day 2's build phase was remarkably fast because the specs were clear.

### Shift 2: The Harness Engineer is the New Software Engineer

The Harness Engineer role is genuinely new. They don't write application code — they:

- Configure the agent's persistent context (steering files)
- Set up automated quality gates (hooks)
- Structure the build plan (specs with task dependency graphs)
- Monitor output quality and refine constraints when Kiro produces inconsistent results
- Debug by providing terminal context, not by reading code line-by-line

This is "agent wrangling" — understanding how to shape AI behaviour through context, constraints, and feedback loops rather than explicit instructions.

### Shift 3: Correctness Properties Replace Manual Code Review

Traditional code review asks "does this look right?" Property-based testing asks "does this hold for ALL valid inputs?" We defined formal correctness properties in our design documents:

> *For any* valid TriageInput where multiple rules' conditions are satisfied, evaluate() SHALL return the recommendation of the rule with the lowest priority number.

These became automated tests generating hundreds of random inputs. The rules engine was verified not by human inspection but by mathematical properties.

### Shift 4: Steering Files Are Living Documentation

Steering files aren't just documentation — they're **executable context** that shapes every interaction. When we added `debugging.md`, Kiro immediately started checking for stale server processes before investigating code bugs. When we added `requirements-guard.md`, Kiro started asking "which requirement does this map to?" before implementing anything.

The implication: documentation is no longer just for humans. It's for the agent too. And the agent actually reads it every time.

### Shift 5: Hooks Make Quality Automatic, Not Aspirational

In traditional development, "run lint before committing" is a team agreement that gets ignored under pressure. With hooks, lint runs on every save. Tests run when test files are created. Quality enforcement becomes **structural**, not **cultural**.

### Shift 6: Parallel Task Execution Changes Planning

Kiro's spec system supports parallel task execution via dependency graphs. We learned to think about implementation as **waves** of independent tasks rather than sequential steps:

```
Wave 0: [Schema, Types, Dependencies]     — foundation, no dependencies
Wave 1: [Route handler, Service logic]     — depends on Wave 0
Wave 2: [Components, Hooks]                — depends on Wave 1
Wave 3: [Screen integration]               — depends on Wave 2
Wave 4: [Tests]                            — depends on Wave 3
```

This dramatically reduced build time for complex features.

### Shift 7: The Agent is Opinionated — And That's Good

Through steering files, we made Kiro opinionated about our codebase. It knows:
- Business logic goes in services, not routes
- Components don't fetch data directly — they use hooks
- Every feature needs unit + E2E tests
- The design system colours are specific hex values

An opinionated agent produces consistent code. An unopinionated agent produces code that varies with every prompt.

### Summary

Building with Kiro changed our model from **"developers write code"** to **"teams produce specifications, engineers shape agent behaviour, and the agent produces verified code."** The new workflow is:

```
Specify → Steer → Structure → Build → Verify
  (team)   (harness eng)  (specs)  (Kiro)  (automated)
```

The human contribution shifted upstream: we design systems, define constraints, and verify correctness. The AI handles the mechanical translation of specifications into working code.
