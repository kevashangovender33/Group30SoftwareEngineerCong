# Architecture — Payment Dispute Triage System

## 1. System Overview

A full-stack monorepo with a React SPA frontend communicating with an Express API backend. All data is persisted in a local SQLite database via Prisma ORM. No external integrations exist (REQ-001).

```mermaid
graph TB
    subgraph Client["Client (React + Vite)"]
        UI[React SPA]
        UI -->|fetch /api/*| API
    end

    subgraph Server["Server (Express + Node.js)"]
        API[Express API Router]
        API --> Routes[Route Handlers]
        Routes --> Engine[Rules Engine]
        Routes --> DB[(SQLite via Prisma)]
        Engine --> DB
    end

    subgraph Data["Data Layer"]
        DB
        Seed[Prisma Seed Script]
        Seed -->|initialise| DB
    end
```

---

## 2. Component Architecture

```mermaid
graph LR
    subgraph Frontend
        App[App.tsx]
        App --> CaptureForm[DisputeCaptureForm]
        App --> ResultScreen[TriageResultScreen]
        CaptureForm -->|POST /api/disputes| API
        ResultScreen -->|GET /api/disputes/:id| API
        CaptureForm -->|GET /api/customers| API
        CaptureForm -->|GET /api/transactions| API
        CaptureForm -->|GET /api/reference-data| API
        ResultScreen -->|POST /api/disputes/:id/acknowledge| API
    end

    subgraph Backend
        API[API Router]
        API --> CustomersRoute[/api/customers]
        API --> TransactionsRoute[/api/transactions]
        API --> ReferenceRoute[/api/reference-data]
        API --> DisputesRoute[/api/disputes]
        API --> TriageRoute[/api/triage/evaluate]
        DisputesRoute --> RulesEngine[Rules Engine]
        TriageRoute --> RulesEngine
        RulesEngine --> PriorityCalc[Priority Calculator]
        RulesEngine --> AgeCalc[Age Calculator]
    end
```

---

## 3. Data Model (Entity Relationship)

```mermaid
erDiagram
    Customer {
        string id PK "UUID"
        string name
        string email UK
        string accountNumber UK
        datetime createdAt
        datetime updatedAt
    }

    Transaction {
        string id PK "UUID"
        string customerId FK
        float amount
        string paymentType "CARD | EFT | INTERNAL"
        string status "COMPLETED | PENDING | FAILED | ALREADY_REFUNDED"
        string description
        datetime transactionDate
        datetime createdAt
        datetime updatedAt
    }

    Dispute {
        string id PK "UUID"
        string referenceNumber UK "DSP-001"
        string customerId FK
        string transactionId FK
        string paymentType "CARD | EFT | INTERNAL"
        string issueCategory "DUPLICATE_DEBIT | FAILED_TRANSFER | etc."
        string status "OPEN | TRIAGED | CLOSED"
        string priority "HIGH | MEDIUM | LOW"
        string ageIndicator "NEW | AGING | OVERDUE"
        string recommendedAction
        string triggeredRules "JSON array"
        datetime createdAt
        datetime resolvedAt
        datetime updatedAt
    }

    Customer ||--o{ Transaction : "has"
    Customer ||--o{ Dispute : "raises"
    Transaction ||--o{ Dispute : "disputed in"
```

---

## 4. User Flow (Sequence Diagram)

```mermaid
sequenceDiagram
    participant User as Operations User
    participant UI as React Frontend
    participant API as Express API
    participant Engine as Rules Engine
    participant DB as SQLite (Prisma)

    User->>UI: Open dispute capture form
    UI->>API: GET /api/reference-data
    API-->>UI: Payment types + issue categories

    User->>UI: Search/select customer
    UI->>API: GET /api/customers?search=...
    API->>DB: Query customers
    DB-->>API: Customer list
    API-->>UI: Customers

    User->>UI: Select customer
    UI->>API: GET /api/transactions?customerId=...
    API->>DB: Query transactions
    DB-->>API: Transaction list
    API-->>UI: Transactions

    User->>UI: Select transaction, confirm payment type, choose issue category
    User->>UI: Submit dispute

    UI->>API: POST /api/disputes
    API->>DB: Validate transaction exists
    DB-->>API: Transaction record
    API->>Engine: Evaluate(paymentType, issueCategory, transaction)
    Engine->>Engine: Check pre-conditions (Already Refunded?)
    Engine->>Engine: Evaluate decision matrix (priority order)
    Engine->>Engine: Calculate priority
    Engine->>Engine: Calculate age indicator
    Engine-->>API: TriageResult {recommendation, rules, priority, age}
    API->>DB: Create dispute record
    DB-->>API: Dispute persisted
    API-->>UI: 201 {disputeId, triage result}

    UI->>UI: Display triage result screen
    Note over UI: Recommendation + rules + priority + age badges

    User->>UI: Click "Log New Dispute"
    UI->>API: POST /api/disputes/:id/acknowledge
    API->>DB: Update dispute status
    API-->>UI: {acknowledged: true, nextAction: RETURN_TO_CAPTURE}
    UI->>UI: Reset form, return to capture screen
```

---

## 5. Rules Engine Flow

```mermaid
flowchart TD
    Start([Dispute Submitted]) --> PreCheck{Transaction status =<br/>ALREADY_REFUNDED?}

    PreCheck -->|Yes| CloseResolved[/"RULE-PRE-01<br/>Close Dispute — Resolved"/]
    PreCheck -->|No| FraudCheck{Issue category =<br/>UNAUTHORISED?}

    FraudCheck -->|Yes| EscalateFraud[/"RULE-001<br/>Escalate to Fraud Team"/]
    FraudCheck -->|No| CardDuplicate{Payment = CARD AND<br/>Issue = DUPLICATE_DEBIT?}

    CardDuplicate -->|Yes| ImmediateReversal[/"RULE-002<br/>Immediate Reversal"/]
    CardDuplicate -->|No| EftPending{Payment = EFT AND<br/>Status = PENDING?}

    EftPending -->|Yes| Monitor24h[/"RULE-003<br/>Monitor for 24 Hours"/]
    EftPending -->|No| HighValue{Amount > R10,000?}

    HighValue -->|Yes| EscalateSenior[/"RULE-004<br/>Escalate to Senior Ops"/]
    HighValue -->|No| InternalFailed{Payment = INTERNAL AND<br/>Issue = FAILED_TRANSFER?}

    InternalFailed -->|Yes| ReferPayments[/"RULE-005<br/>Refer to Payments Team"/]
    InternalFailed -->|No| EftMissing{Payment = EFT AND<br/>Issue = MISSING_PAYMENT?}

    EftMissing -->|Yes| Investigate1[/"RULE-006<br/>Investigate Further"/]
    EftMissing -->|No| CardDispute{Payment = CARD AND<br/>Issue = CARD_DISPUTE?}

    CardDispute -->|Yes| Investigate2[/"RULE-007<br/>Investigate Further"/]
    CardDispute -->|No| IncorrectAmt{Issue = INCORRECT_AMOUNT?}

    IncorrectAmt -->|Yes| Investigate3[/"RULE-008<br/>Investigate Further"/]
    IncorrectAmt -->|No| Default[/"RULE-DEFAULT<br/>Investigate — Manual Review"/]

    CloseResolved --> AssignPriority
    EscalateFraud --> AssignPriority
    ImmediateReversal --> AssignPriority
    Monitor24h --> AssignPriority
    EscalateSenior --> AssignPriority
    ReferPayments --> AssignPriority
    Investigate1 --> AssignPriority
    Investigate2 --> AssignPriority
    Investigate3 --> AssignPriority
    Default --> AssignPriority

    AssignPriority[Assign Priority & Age Indicator] --> Done([Return Triage Result])
```

---

## 6. Priority & Age Assignment

```mermaid
flowchart TD
    subgraph Priority["Priority Assignment"]
        P1{Amount > R10,000<br/>OR Issue = UNAUTHORISED?}
        P1 -->|Yes| HIGH[HIGH]
        P1 -->|No| P2{Amount R5k–R10k<br/>OR Age > 7 days?}
        P2 -->|Yes| MEDIUM[MEDIUM]
        P2 -->|No| LOW[LOW]
    end

    subgraph Age["Age Indicator Assignment"]
        A1{Days since transaction}
        A1 -->|0–7| NEW[NEW]
        A1 -->|8–14| AGING[AGING]
        A1 -->|>14| OVERDUE[OVERDUE]
    end
```

---

## 7. Folder Structure

```mermaid
graph TD
    Root["/"] --> Server["server/"]
    Root --> Client["client/"]
    Root --> Docs["docs/"]

    Server --> ServerSrc["src/"]
    ServerSrc --> Index["index.ts<br/>(entry point)"]
    ServerSrc --> Routes["routes/<br/>(API handlers)"]
    ServerSrc --> Middleware["middleware/<br/>(error handler)"]
    ServerSrc --> Services["services/<br/>(rules engine, triage logic)"]
    Server --> Prisma["prisma/"]
    Prisma --> Schema["schema.prisma"]
    Prisma --> SeedFile["seed.ts"]
    Prisma --> Migrations["migrations/"]
    Server --> ServerTests["tests/"]

    Client --> ClientSrc["src/"]
    ClientSrc --> AppFile["App.tsx"]
    ClientSrc --> Components["components/<br/>(form, result, badges)"]
    ClientSrc --> Hooks["hooks/<br/>(useApi, useDispute)"]
    Client --> ClientTests["tests/"]
    Client --> E2E["e2e/"]

    Docs --> Requirements["requirements.md"]
    Docs --> ApiSpec["api-spec.md"]
    Docs --> Architecture["architecture.md"]
```

---

## 8. Technology Decisions

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend framework | React 18 | Component-based, widely understood, supports rapid prototyping |
| Build tool | Vite 5 | Fast HMR, minimal config, proxies API requests to backend |
| Styling | Tailwind CSS 3 | Utility-first, rapid UI development, consistent design |
| Backend framework | Express 4 | Lightweight, flexible, well-documented |
| Language | TypeScript | Type safety across full stack, better IDE support |
| ORM | Prisma 5 | Type-safe database access, auto-generated client, easy migrations |
| Database | SQLite | Zero-config, file-based, perfect for local prototype (REQ-001) |
| Testing | Vitest + Playwright | Fast unit tests + reliable e2e browser tests |
| Runtime | Node.js >=20 | LTS stability, native ES module support |

---

## 9. API Route Mapping

```mermaid
graph LR
    subgraph "Express Router (/api)"
        GET_REF["GET /reference-data"]
        GET_CUST["GET /customers"]
        GET_TXN["GET /transactions"]
        POST_DISP["POST /disputes"]
        GET_DISP["GET /disputes/:id"]
        POST_ACK["POST /disputes/:id/acknowledge"]
        POST_EVAL["POST /triage/evaluate"]
    end

    GET_REF -->|REQ-002, REQ-005| RefData[(Static constants)]
    GET_CUST -->|REQ-003, REQ-004| DB[(SQLite)]
    GET_TXN -->|REQ-003, REQ-004| DB
    POST_DISP -->|REQ-004–010| RulesEngine[Rules Engine]
    POST_DISP --> DB
    GET_DISP -->|REQ-011, REQ-012| DB
    POST_ACK -->|REQ-020| DB
    POST_EVAL -->|REQ-006–010| RulesEngine
    RulesEngine --> DB
```

---

## 10. Deployment Model (Local Prototype)

```mermaid
graph TB
    subgraph "Developer Machine"
        subgraph "npm run dev"
            ViteDev["Vite Dev Server<br/>:5173"]
            ExpressDev["Express Server<br/>:3001"]
        end
        ViteDev -->|proxy /api| ExpressDev
        ExpressDev --> SQLite["SQLite<br/>server/prisma/dev.db"]
    end

    Browser["Browser"] --> ViteDev
```

No cloud deployment, no containers, no external services. The entire system runs locally via `npm run dev`.
