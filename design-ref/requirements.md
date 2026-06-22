# Requirements Specification — Intelligent Triage of Customer Payment Disputes

## 1. Problem Statement

Bank customers expect payment issues to be resolved quickly and accurately, whether the problem relates to a duplicate debit, failed transfer, missing payment, or card transaction dispute. Frontline staff currently gather information manually from multiple sources, interpret the issue, and decide on the next action. This slows resolution, creates inconsistent handling, and frustrates customers and support teams alike.

This prototype helps a banking operations user triage and route customer payment disputes more effectively. The user captures a dispute, records the payment type and issue category, and receives a recommended next action based on transparent business rules (transaction status, amount, dispute age, issue type).

**Core question the system answers:** Given this payment dispute, what is the most appropriate next step right now?

---

## 2. Scope & Constraints

| Constraint | Detail |
|------------|--------|
| Data | Mock data only — no real customer, transaction, or banking system integration |
| Decision approach | Static rules-based decision matrix — no AI/ML |
| Payment types | Card Payments, EFTs, Internal Transfers only |
| Indicators | Simple priority (High/Medium/Low) and age (New/Aging/Overdue) indicators |
| Integration | No connections to core banking, card processing, case management, or customer platforms |
| Journey | Single focused flow: capture dispute → triage → display recommendation |

---

## 3. EARS Notation Key

| Pattern | Template | When to use |
|---------|----------|-------------|
| **Ubiquitous** | The system shall `<action>`. | Behaviour that is always active, unconditionally |
| **Event-driven** | **When** `<trigger>`, the system shall `<action>`. | Behaviour triggered by a specific event |
| **State-driven** | **While** `<state>`, the system shall `<action>`. | Behaviour that holds during a defined state |
| **Unwanted behaviour** | **If** `<condition>`, **then** the system shall `<action>`. | Handling of error conditions or edge cases |
| **Optional / Where** | **Where** `<feature/condition>`, the system shall `<action>`. | Behaviour conditional on a specific configuration or data state |

---

## 4. Requirements

### Priority 1 — Critical: Mock Data & Constraints

These requirements establish the foundational data structure and enforce the strict prototype constraints.

---

#### REQ-001: Mock Data Isolation (Ubiquitous)

**The system shall** restrict all integrations and exclusively use localized mock dispute, customer, and transaction data.

**Rationale:** The prototype must not connect to any real banking system. All data is self-contained for demonstration and development purposes.

**Acceptance Criteria:**
- No outbound network calls to external banking/payment APIs exist in the codebase.
- All customer, transaction, and dispute data is served from local mock data sources (in-memory or SQLite seed).
- The application functions fully offline after initial dependency installation.

---

#### REQ-002: Payment Type Constraint (Ubiquitous)

**The system shall** limit selectable payment types to exactly three options: Card Payments, EFTs, and Internal Transfers.

**Rationale:** The use case scopes the prototype to common retail banking payment channels only.

**Acceptance Criteria:**
- The payment type selector presents exactly three options.
- No additional payment types can be added through the UI.
- The rules engine only processes these three payment types.

**Data Definition:**

| Payment Type | Code | Description |
|--------------|------|-------------|
| Card Payment | `CARD` | Debit or credit card transaction |
| EFT | `EFT` | Electronic funds transfer (inter-bank) |
| Internal Transfer | `INTERNAL` | Transfer between accounts within the same bank |

---

#### REQ-003: Mock Data Initialisation (Event-Driven)

**When** the system initializes, **the system shall** load a predefined baseline set of mock customer and transaction records.

**Rationale:** The operations user needs existing transaction data to lodge disputes against. Seed data provides a realistic starting point.

**Acceptance Criteria:**
- On server start, the database is seeded with at least 10 mock customers and 20 mock transactions if not already present.
- Mock transactions span all three payment types.
- Mock transactions include varying statuses: Completed, Pending, Failed, Already Refunded.
- Mock transactions include varying amounts (below and above the high-value threshold).
- Mock transactions include varying dates (recent and aged beyond 14 days).

**Mock Customer Schema:**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique customer identifier |
| name | string | Full name |
| email | string | Email address |
| accountNumber | string | Bank account number |
| createdAt | datetime | Record creation timestamp |

**Mock Transaction Schema:**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique transaction identifier |
| customerId | string | FK to customer |
| amount | number | Transaction amount in ZAR |
| paymentType | enum | `CARD` / `EFT` / `INTERNAL` |
| status | enum | `COMPLETED` / `PENDING` / `FAILED` / `ALREADY_REFUNDED` |
| description | string | Transaction description |
| transactionDate | datetime | When the transaction occurred |
| createdAt | datetime | Record creation timestamp |

---

### Priority 1 — High: Dispute Capture & Triage Engine

These requirements dictate the primary functionality: capturing the dispute and running the rules-based triage engine.

---

#### REQ-004: Dispute Capture (Ubiquitous)

**The system shall** allow an operations user to capture a new customer payment dispute against an existing mock transaction.

**Rationale:** This is the entry point to the triage journey — the user selects a transaction and lodges a formal dispute record.

**Acceptance Criteria:**
- The user can search/select a customer from the mock dataset.
- The user can select a transaction belonging to that customer.
- A dispute record is created and persisted linking the customer, transaction, and dispute details.
- Each dispute receives a unique reference number.

**Dispute Schema:**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique dispute identifier |
| referenceNumber | string | Human-readable reference (e.g., `DSP-001`) |
| customerId | string | FK to customer |
| transactionId | string | FK to transaction |
| paymentType | enum | `CARD` / `EFT` / `INTERNAL` |
| issueCategory | enum | See REQ-005 |
| status | enum | `OPEN` / `TRIAGED` / `CLOSED` |
| priority | enum | `HIGH` / `MEDIUM` / `LOW` |
| ageIndicator | enum | `NEW` / `AGING` / `OVERDUE` |
| recommendedAction | string | Output of triage engine |
| triggeredRules | string[] | Rules that fired during evaluation |
| createdAt | datetime | When the dispute was captured |
| resolvedAt | datetime | When/if the dispute was closed |

---

#### REQ-005: Mandatory Dispute Fields (Event-Driven)

**When** the user initiates a new dispute, **the system shall** require the user to record the payment type and the issue category.

**Rationale:** These two fields are the primary inputs to the rules-based decision matrix.

**Acceptance Criteria:**
- Both fields are mandatory and must be selected before submission.
- The payment type is pre-populated from the selected transaction but can be confirmed.
- The issue category is selected from a fixed list.

**Issue Categories:**

| Issue Category | Code | Description |
|----------------|------|-------------|
| Duplicate Debit | `DUPLICATE_DEBIT` | Customer was charged twice for the same transaction |
| Failed Transfer | `FAILED_TRANSFER` | Funds were debited but not received by the beneficiary |
| Missing Payment | `MISSING_PAYMENT` | Expected incoming payment was not received |
| Unauthorised Transaction | `UNAUTHORISED` | Customer did not authorise the transaction (potential fraud) |
| Incorrect Amount | `INCORRECT_AMOUNT` | Transaction amount differs from what was expected |
| Card Dispute | `CARD_DISPUTE` | General card transaction dispute (goods not received, service not rendered) |

---

#### REQ-006: Rules Engine Evaluation (Event-Driven)

**When** the dispute form is submitted, **the system shall** evaluate the case using a static, rules-based decision matrix.

**Rationale:** The triage engine applies deterministic business rules to recommend a consistent next action without human judgment variance.

**Acceptance Criteria:**
- The engine evaluates all applicable rules in priority order.
- The first matching rule (highest priority) determines the recommendation.
- At least one rule always matches (a fallback/default rule exists).
- The engine records which rules were evaluated and which triggered.

**Evaluation Inputs:**

| Input | Source |
|-------|--------|
| Payment Type | Dispute form / transaction record |
| Issue Category | Dispute form |
| Transaction Status | Transaction record |
| Transaction Amount | Transaction record |
| Dispute Age | Calculated from transaction date to current date |

---

#### REQ-007: Card Payment + Duplicate Debit Rule (Where)

**Where** the payment type is "Card Payment" **and** the issue is "Duplicate Debit", **the system shall** recommend "Immediate Reversal" as the next action.

**Rationale:** Duplicate card debits are clear-cut cases where the bank can reverse immediately without further investigation.

**Acceptance Criteria:**
- A Card Payment dispute with Duplicate Debit issue receives "Immediate Reversal" recommendation.
- The triggered rule is recorded as: "Rule: Card Payment + Duplicate Debit → Immediate Reversal".
- This rule takes precedence over lower-priority rules (e.g., amount threshold).

---

#### REQ-008: EFT + Pending Status Rule (Where)

**Where** the payment type is "EFT" **and** the transaction status is "Pending", **the system shall** recommend "Monitor for 24 Hours" as the next action.

**Rationale:** Pending EFTs may still resolve naturally within the standard processing window. Premature intervention could cause duplicate processing.

**Acceptance Criteria:**
- An EFT dispute where the underlying transaction is still Pending receives "Monitor for 24 Hours".
- The triggered rule is recorded as: "Rule: EFT + Pending Status → Monitor for 24 Hours".
- If the EFT is no longer Pending (Completed/Failed), this rule does not fire.

---

#### REQ-009: Fraud Indicator Rule (Where)

**Where** the issue category indicates potential fraud (i.e., "Unauthorised Transaction"), **the system shall** recommend "Escalate to Fraud Team" as the next action.

**Rationale:** Potential fraud cases require specialist handling and must be escalated immediately regardless of payment type or amount.

**Acceptance Criteria:**
- Any dispute with issue category `UNAUTHORISED` receives "Escalate to Fraud Team".
- This rule has the highest priority — it overrides all other rules.
- The triggered rule is recorded as: "Rule: Unauthorised Transaction (Fraud Indicator) → Escalate to Fraud Team".

---

#### REQ-010: Guaranteed Recommendation Output (Ubiquitous)

**The system shall** generate one primary recommended route or action for every captured dispute.

**Rationale:** The operations user must never be left without guidance. Every dispute must exit triage with exactly one clear next step.

**Acceptance Criteria:**
- Every submitted dispute results in exactly one recommendation.
- A fallback rule ("Investigate Further — Manual Review Required") fires if no specific rule matches.
- The recommendation is persisted on the dispute record.

**Recommended Actions (Complete List):**

| Action | Code | When It Applies |
|--------|------|-----------------|
| Immediate Reversal | `IMMEDIATE_REVERSAL` | Clear-cut reversal cases (duplicate debits on cards) |
| Monitor for 24 Hours | `MONITOR_24H` | Pending transactions that may still resolve |
| Escalate to Fraud Team | `ESCALATE_FRAUD` | Unauthorised/suspicious transactions |
| Escalate to Senior Ops | `ESCALATE_SENIOR` | High-value disputes requiring senior review |
| Investigate Further | `INVESTIGATE` | Complex cases needing manual evidence gathering |
| Close Dispute — Resolved | `CLOSE_RESOLVED` | Already-refunded transactions |
| Refer to Payments Team | `REFER_PAYMENTS` | Payment-specific issues needing specialist input |

---

### Priority 2 — Medium: Transparency & Case Indicators

These requirements ensure the user understands the triage decision and can assess case urgency at a glance.

---

#### REQ-011: Prominent Recommendation Display (Event-Driven)

**When** the rules engine completes its evaluation, **the system shall** display the recommended next action prominently on the user's screen.

**Rationale:** The recommendation is the primary output of the system and must be immediately visible without scrolling or navigation.

**Acceptance Criteria:**
- The recommendation is displayed in a visually distinct card/banner (large text, colour-coded).
- The recommendation appears within the same viewport as the dispute summary.
- Colour coding: Red = Escalate, Amber = Monitor/Investigate, Green = Resolve/Close.

---

#### REQ-012: Rule Transparency (State-Driven)

**While** displaying the recommended action, **the system shall** display the specific business rules that triggered the recommendation to ensure transparency.

**Rationale:** Operations users need to understand and trust the system's logic. Showing the "why" reduces second-guessing and builds confidence.

**Acceptance Criteria:**
- Each triggered rule is displayed as a human-readable sentence below the recommendation.
- The input values that matched each rule are shown (e.g., "Payment Type: Card Payment", "Issue: Duplicate Debit").
- If multiple rules were evaluated, all evaluated rules are listed with a clear indication of which one(s) fired.

**Example Display:**

```
┌─────────────────────────────────────────────────────┐
│ RECOMMENDED ACTION: Immediate Reversal              │
├─────────────────────────────────────────────────────┤
│ Rules Applied:                                      │
│ ✓ Card Payment + Duplicate Debit → Immediate Rev.   │
│                                                     │
│ Decision Factors:                                   │
│ • Payment Type: Card Payment                        │
│ • Issue Category: Duplicate Debit                   │
│ • Transaction Amount: R1,250.00                     │
│ • Transaction Status: Completed                     │
│ • Dispute Age: 2 days (New)                         │
└─────────────────────────────────────────────────────┘
```

---

#### REQ-013: High-Value Threshold Priority (Where)

**Where** the disputed transaction amount exceeds a predefined high-value threshold, **the system shall** assign a "High Priority" status to the dispute.

**Rationale:** Large-value disputes carry greater financial risk and regulatory exposure. They require faster handling and senior visibility.

**Acceptance Criteria:**
- The high-value threshold is set to R10,000 (configurable via environment/constants).
- Disputes above this threshold are automatically marked as `HIGH` priority.
- If the dispute also triggers a specific rule (e.g., fraud), both the priority and the rule recommendation apply independently.
- The threshold value is defined in a single location for easy adjustment.

---

#### REQ-014: Dispute Age Flagging (Where)

**Where** the dispute age exceeds a predefined threshold, **the system shall** flag the dispute with the appropriate age indicator.

**Rationale:** Aging disputes risk breaching service-level agreements (SLAs) and regulatory timelines. Early visibility prevents escalation.

**Acceptance Criteria:**
- Age is calculated as: `currentDate - transactionDate` (in days).
- Age thresholds:
  - **New:** 0–7 days
  - **Aging:** 8–14 days
  - **Overdue:** > 14 days
- The age indicator is persisted on the dispute record and displayed in the UI.
- Overdue disputes are visually emphasised (e.g., red badge).

---

#### REQ-015: Priority Indicators (Ubiquitous)

**The system shall** visually represent case priority using simple colour-coded indicators: High (red), Medium (amber), Low (green).

**Rationale:** Provides immediate visual cue for operations users to identify urgent cases.

**Acceptance Criteria:**
- Priority badges are displayed on the dispute result screen.
- Colour mapping: High = red/danger, Medium = amber/warning, Low = green/success.
- Priority logic:
  - **High:** Amount > R10,000 OR issue = Unauthorised Transaction
  - **Medium:** Amount R5,000–R10,000 OR age > 7 days
  - **Low:** All other cases

---

#### REQ-016: Age Indicators (Ubiquitous)

**The system shall** visually represent the age of the dispute using simple indicators: New, Aging, Overdue.

**Rationale:** Enables the operations user to quickly assess SLA risk without calculating dates manually.

**Acceptance Criteria:**
- Age badges are displayed alongside priority badges.
- Visual treatment: New = neutral/grey, Aging = amber, Overdue = red.
- Calculation matches thresholds defined in REQ-014.

---

### Priority 3 — Low: Error Handling & User Experience

These requirements handle edge cases, validation, and UI polish.

---

#### REQ-017: Mandatory Field Validation (Unwanted Behaviour)

**If** the user attempts to submit a dispute without selecting a mandatory field (payment type or issue category), **then the system shall** prompt the user with a clear validation error indicating which field(s) are missing.

**Rationale:** Prevents incomplete data from reaching the rules engine and ensures data quality.

**Acceptance Criteria:**
- Inline validation messages appear next to the offending field(s).
- The form does not submit until all mandatory fields are completed.
- Error messages are specific: "Payment type is required", "Issue category is required".
- The submit button is not disabled — validation fires on submit attempt for discoverability.

---

#### REQ-018: Already Refunded Short-Circuit (Unwanted Behaviour)

**If** the selected mock transaction has a status of "Already Refunded", **then the system shall** immediately recommend "Close Dispute — Resolved" without evaluating further rules.

**Rationale:** There is no action to take on an already-refunded transaction. The system short-circuits to prevent unnecessary processing and conflicting recommendations.

**Acceptance Criteria:**
- This check executes before the main decision matrix.
- The recommendation is "Close Dispute — Resolved" with code `CLOSE_RESOLVED`.
- The triggered rule is recorded as: "Rule: Transaction Already Refunded → Close Dispute".
- No other rules are evaluated for this dispute.

---

#### REQ-019: Processing Indicator (State-Driven)

**While** the rules engine is processing a submitted dispute, **the system shall** display a visual loading indicator to the user.

**Rationale:** Provides feedback that the system is working, preventing duplicate submissions and user confusion.

**Acceptance Criteria:**
- A spinner or progress indicator is shown immediately after form submission.
- The submit button is disabled during processing to prevent double-submission.
- The indicator is replaced by the triage result once processing completes.
- If processing fails, an error message replaces the indicator.

---

#### REQ-020: Return to Capture (Event-Driven)

**When** the user acknowledges the triage recommendation, **the system shall** allow the user to return to the capture screen to log a new dispute.

**Rationale:** Operations users handle multiple disputes in a session. The flow must support efficient sequential processing.

**Acceptance Criteria:**
- A clearly labelled "Log New Dispute" or "Back to Capture" button is visible on the result screen.
- Clicking it resets the form and navigates back to the capture screen.
- Previous dispute data is cleared from the form (no stale data).
- The previously triaged dispute remains persisted in the system.

---

#### REQ-021: Single-Screen Results (Ubiquitous)

**The system shall** present the triage results and the justification rules on a single screen without requiring the user to navigate to a secondary view.

**Rationale:** Minimises cognitive load and context-switching. The user sees everything they need in one place to take action.

**Acceptance Criteria:**
- The result screen contains: recommendation, triggered rules, decision factors, priority badge, age badge, dispute summary, and transaction details.
- No tabs, modals, or secondary pages are required to view the full triage output.
- The screen is scrollable if content exceeds viewport height, but primary information (recommendation + rules) is above the fold.

---

## 5. Business Rules Decision Matrix

The rules engine evaluates in priority order (highest first). The first matching rule wins.

| Priority | Rule ID | Conditions | Recommended Action | Code |
|----------|---------|------------|-------------------|------|
| 0 (Pre-check) | RULE-PRE-01 | Transaction status = `ALREADY_REFUNDED` | Close Dispute — Resolved | `CLOSE_RESOLVED` |
| 1 | RULE-001 | Issue category = `UNAUTHORISED` | Escalate to Fraud Team | `ESCALATE_FRAUD` |
| 2 | RULE-002 | Payment type = `CARD` AND issue = `DUPLICATE_DEBIT` | Immediate Reversal | `IMMEDIATE_REVERSAL` |
| 3 | RULE-003 | Payment type = `EFT` AND transaction status = `PENDING` | Monitor for 24 Hours | `MONITOR_24H` |
| 4 | RULE-004 | Transaction amount > R10,000 | Escalate to Senior Ops | `ESCALATE_SENIOR` |
| 5 | RULE-005 | Payment type = `INTERNAL` AND issue = `FAILED_TRANSFER` | Refer to Payments Team | `REFER_PAYMENTS` |
| 6 | RULE-006 | Payment type = `EFT` AND issue = `MISSING_PAYMENT` | Investigate Further | `INVESTIGATE` |
| 7 | RULE-007 | Payment type = `CARD` AND issue = `CARD_DISPUTE` | Investigate Further | `INVESTIGATE` |
| 8 | RULE-008 | Issue = `INCORRECT_AMOUNT` | Investigate Further | `INVESTIGATE` |
| 99 (Fallback) | RULE-DEFAULT | No other rule matched | Investigate Further — Manual Review Required | `INVESTIGATE` |

---

## 6. Priority Assignment Rules

Priority is assigned independently of the triage recommendation:

| Condition | Priority |
|-----------|----------|
| Transaction amount > R10,000 | HIGH |
| Issue category = `UNAUTHORISED` | HIGH |
| Transaction amount R5,000–R10,000 | MEDIUM |
| Dispute age > 7 days | MEDIUM |
| All other cases | LOW |

If multiple conditions match, the highest priority wins.

---

## 7. Age Indicator Rules

| Days Since Transaction | Indicator | Visual |
|------------------------|-----------|--------|
| 0–7 days | New | Grey/neutral badge |
| 8–14 days | Aging | Amber/warning badge |
| > 14 days | Overdue | Red/danger badge |

---

## 8. User Flow Summary

```
┌──────────────────┐
│  Select Customer │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Select Transaction│
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Capture Dispute                 │
│  • Confirm Payment Type          │
│  • Select Issue Category         │
│  • (Optional) Add notes          │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Rules Engine Evaluation         │
│  • Check pre-conditions          │
│  • Evaluate decision matrix      │
│  • Assign priority & age         │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Triage Result (Single Screen)   │
│  • Recommended Action (prominent)│
│  • Triggered Rules (transparent) │
│  • Decision Factors              │
│  • Priority & Age Badges         │
│  • [Log New Dispute] button      │
└──────────────────────────────────┘
```

---

## 9. Glossary

| Term | Definition |
|------|------------|
| Triage | The process of assessing a dispute and determining the most appropriate next action |
| Decision Matrix | An ordered set of business rules evaluated top-to-bottom; first match wins |
| Operations User | Internal bank staff responsible for handling customer payment disputes |
| SLA | Service Level Agreement — the timeframe within which a dispute must be resolved |
| EFT | Electronic Funds Transfer — money transfer between banks |
| Dispute Age | Number of days between the original transaction date and the current date |
| High-Value Threshold | R10,000 — configurable amount above which disputes are escalated |
