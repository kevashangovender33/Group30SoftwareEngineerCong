# API Specification — Payment Dispute Triage System

Base URL: `/api`

All endpoints return JSON. All request bodies (where applicable) must be sent as `application/json`.

---

## GET /api/reference-data

Retrieve allowed payment types and issue categories (mock-driven).

**Purpose:** Provides the UI with the fixed list of selectable values for dispute capture forms. Ensures the frontend and backend stay in sync on allowed enumerations.

**Related Requirements:** REQ-002, REQ-005

### Request

No request body or query parameters.

### Success Response (200)

| Field | Type | Description |
|-------|------|-------------|
| paymentTypes | string[] | Allowed payment type values |
| issueCategories | string[] | Supported dispute issue categories |
| dataSource | string | Always `"MOCK"` — confirms no live integration |

### Error Responses

| Status | Condition |
|--------|-----------|
| 500 | Mock data failed to load |

### Example

**Request:**
```
GET /api/reference-data
```

**Response:**
```json
{
  "paymentTypes": ["Card Payment", "EFT", "Internal Transfer"],
  "issueCategories": [
    "Duplicate Debit",
    "Failed Transfer",
    "Missing Payment",
    "Unauthorised Transaction",
    "Incorrect Amount",
    "Card Dispute"
  ],
  "dataSource": "MOCK"
}
```

---

## GET /api/transactions

Retrieve mock transactions available for dispute capture.

**Purpose:** Allows the operations user to browse and select a transaction to dispute. Supports optional filtering by status.

**Related Requirements:** REQ-003, REQ-004

### Request

No request body.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by transaction status (`COMPLETED`, `PENDING`, `FAILED`, `ALREADY_REFUNDED`) |
| customerId | string | No | Filter transactions for a specific customer |

### Success Response (200)

| Field | Type | Description |
|-------|------|-------------|
| transactions | object[] | List of transaction records |
| transactions[].id | string | Unique transaction ID (UUID) |
| transactions[].customerId | string | Associated customer ID |
| transactions[].amount | number | Transaction value in ZAR |
| transactions[].paymentType | string | `"CARD"` \| `"EFT"` \| `"INTERNAL"` |
| transactions[].status | string | `"COMPLETED"` \| `"PENDING"` \| `"FAILED"` \| `"ALREADY_REFUNDED"` |
| transactions[].description | string | Transaction description |
| transactions[].transactionDate | string (ISO 8601) | When the transaction occurred |

### Error Responses

| Status | Condition |
|--------|-----------|
| 500 | Failed to retrieve mock transactions |

### Example

**Request:**
```
GET /api/transactions?customerId=cust-001
```

**Response:**
```json
{
  "transactions": [
    {
      "id": "txn-001",
      "customerId": "cust-001",
      "amount": 1250.00,
      "paymentType": "CARD",
      "status": "COMPLETED",
      "description": "POS purchase at Woolworths - duplicated",
      "transactionDate": "2026-06-20T10:00:00.000Z"
    },
    {
      "id": "txn-002",
      "customerId": "cust-001",
      "amount": 8000.00,
      "paymentType": "CARD",
      "status": "COMPLETED",
      "description": "Online purchase - not authorised by cardholder",
      "transactionDate": "2026-06-17T10:00:00.000Z"
    }
  ]
}
```

---

## GET /api/customers

Retrieve mock customers for dispute capture.

**Purpose:** Allows the operations user to search/select a customer before selecting a transaction.

**Related Requirements:** REQ-003, REQ-004

### Request

No request body.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search | string | No | Search by name, email, or account number (partial match) |

### Success Response (200)

| Field | Type | Description |
|-------|------|-------------|
| customers | object[] | List of customer records |
| customers[].id | string | Unique customer ID (UUID) |
| customers[].name | string | Customer full name |
| customers[].email | string | Customer email |
| customers[].accountNumber | string | Bank account number |

### Error Responses

| Status | Condition |
|--------|-----------|
| 500 | Failed to retrieve mock customers |

### Example

**Request:**
```
GET /api/customers?search=thabo
```

**Response:**
```json
{
  "customers": [
    {
      "id": "cust-001",
      "name": "Thabo Molefe",
      "email": "thabo.molefe@example.com",
      "accountNumber": "1001-0001-001"
    }
  ]
}
```

---

## POST /api/disputes

Capture a new dispute and trigger triage evaluation.

**Purpose:** The primary action endpoint. Creates a dispute record, runs the rules engine, and returns the triage result in a single call.

**Related Requirements:** REQ-004, REQ-005, REQ-006, REQ-010, REQ-011

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| transactionId | string | Yes | Must exist in mock data |
| paymentType | string | Yes | Must be an allowed type (`CARD`, `EFT`, `INTERNAL`) |
| issueCategory | string | Yes | Must be a supported issue category |
| description | string | No | Additional context from the operations user |

### Success Response (201)

| Field | Type | Description |
|-------|------|-------------|
| disputeId | string | Unique dispute ID (UUID) |
| referenceNumber | string | Human-readable reference (e.g., `DSP-001`) |
| status | string | `"TRIAGED"` |
| triage | object | Triage evaluation result |
| triage.recommendation | string | Single recommended action |
| triage.recommendationCode | string | Machine-readable action code |
| triage.priority | string | `"HIGH"` \| `"MEDIUM"` \| `"LOW"` |
| triage.ageIndicator | string | `"NEW"` \| `"AGING"` \| `"OVERDUE"` |
| triage.rulesTriggered | object[] | Rules that fired during evaluation |
| triage.rulesTriggered[].ruleId | string | Rule identifier (e.g., `RULE-002`) |
| triage.rulesTriggered[].ruleName | string | Human-readable rule name |
| triage.rulesTriggered[].conditions | object | Input values that matched |

### Error Responses

| Status | Condition |
|--------|-----------|
| 400 | Validation error — missing required fields or invalid values |
| 404 | Transaction not found in mock data |
| 422 | Invalid payment type or issue category (not in allowed list) |
| 500 | Rules engine failure |

### Example

**Request:**
```
POST /api/disputes
Content-Type: application/json

{
  "transactionId": "txn-001",
  "paymentType": "CARD",
  "issueCategory": "DUPLICATE_DEBIT"
}
```

**Response (201):**
```json
{
  "disputeId": "d1a2b3c4-5678-90ab-cdef-1234567890ab",
  "referenceNumber": "DSP-001",
  "status": "TRIAGED",
  "triage": {
    "recommendation": "Immediate Reversal",
    "recommendationCode": "IMMEDIATE_REVERSAL",
    "priority": "LOW",
    "ageIndicator": "NEW",
    "rulesTriggered": [
      {
        "ruleId": "RULE-002",
        "ruleName": "Card Payment + Duplicate Debit",
        "conditions": {
          "paymentType": "CARD",
          "issueCategory": "DUPLICATE_DEBIT"
        }
      }
    ]
  }
}
```

---

## GET /api/disputes/:id

Retrieve dispute details including recommendation and transparency rules.

**Purpose:** Allows the frontend to fetch full dispute details for the result screen, including all decision factors.

**Related Requirements:** REQ-011, REQ-012, REQ-015, REQ-016, REQ-021

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Dispute UUID |

### Success Response (200)

| Field | Type | Description |
|-------|------|-------------|
| disputeId | string | Unique dispute ID |
| referenceNumber | string | Human-readable reference |
| status | string | Current dispute status |
| paymentType | string | Payment type of the dispute |
| issueCategory | string | Issue category selected |
| priority | string | `"HIGH"` \| `"MEDIUM"` \| `"LOW"` |
| ageIndicator | string | `"NEW"` \| `"AGING"` \| `"OVERDUE"` |
| recommendation | string | Recommended next action |
| recommendationCode | string | Machine-readable action code |
| rulesTriggered | object[] | Array of rule explanations |
| rulesTriggered[].ruleId | string | Rule identifier |
| rulesTriggered[].ruleName | string | Human-readable rule name |
| rulesTriggered[].conditions | object | Conditions that matched |
| transaction | object | Snapshot of the disputed transaction |
| transaction.id | string | Transaction ID |
| transaction.amount | number | Transaction amount |
| transaction.paymentType | string | Payment type |
| transaction.status | string | Transaction status |
| transaction.description | string | Transaction description |
| transaction.transactionDate | string (ISO 8601) | Transaction date |
| customer | object | Customer summary |
| customer.id | string | Customer ID |
| customer.name | string | Customer name |
| customer.accountNumber | string | Account number |
| createdAt | string (ISO 8601) | When the dispute was captured |

### Error Responses

| Status | Condition |
|--------|-----------|
| 404 | Dispute not found |
| 500 | Retrieval failure |

### Example

**Request:**
```
GET /api/disputes/d1a2b3c4-5678-90ab-cdef-1234567890ab
```

**Response:**
```json
{
  "disputeId": "d1a2b3c4-5678-90ab-cdef-1234567890ab",
  "referenceNumber": "DSP-001",
  "status": "TRIAGED",
  "paymentType": "CARD",
  "issueCategory": "DUPLICATE_DEBIT",
  "priority": "LOW",
  "ageIndicator": "NEW",
  "recommendation": "Immediate Reversal",
  "recommendationCode": "IMMEDIATE_REVERSAL",
  "rulesTriggered": [
    {
      "ruleId": "RULE-002",
      "ruleName": "Card Payment + Duplicate Debit",
      "conditions": {
        "paymentType": "CARD",
        "issueCategory": "DUPLICATE_DEBIT"
      }
    }
  ],
  "transaction": {
    "id": "txn-001",
    "amount": 1250.00,
    "paymentType": "CARD",
    "status": "COMPLETED",
    "description": "POS purchase at Woolworths - duplicated",
    "transactionDate": "2026-06-20T10:00:00.000Z"
  },
  "customer": {
    "id": "cust-001",
    "name": "Thabo Molefe",
    "accountNumber": "1001-0001-001"
  },
  "createdAt": "2026-06-22T14:30:00.000Z"
}
```

---

## POST /api/triage/evaluate

Evaluate dispute using the rules engine (standalone evaluation without creating a dispute record).

**Purpose:** Used for dry-run evaluation or re-evaluation. Useful for testing the rules engine independently of dispute creation.

**Related Requirements:** REQ-006, REQ-007, REQ-008, REQ-009, REQ-010

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| transactionId | string | Yes | Transaction to evaluate against |
| paymentType | string | Yes | Payment type |
| issueCategory | string | Yes | Issue category |

### Success Response (200)

| Field | Type | Description |
|-------|------|-------------|
| recommendation | string | Recommended action (human-readable) |
| recommendationCode | string | Machine-readable action code |
| priority | string | `"HIGH"` \| `"MEDIUM"` \| `"LOW"` |
| ageIndicator | string | `"NEW"` \| `"AGING"` \| `"OVERDUE"` |
| rulesTriggered | object[] | Rules that fired |
| rulesTriggered[].ruleId | string | Rule identifier |
| rulesTriggered[].ruleName | string | Human-readable name |
| rulesTriggered[].conditions | object | Matched conditions |

### Error Responses

| Status | Condition |
|--------|-----------|
| 400 | Invalid input (missing fields, bad values) |
| 404 | Transaction not found |
| 500 | Evaluation failure |

### Example

**Request:**
```
POST /api/triage/evaluate
Content-Type: application/json

{
  "transactionId": "txn-002",
  "paymentType": "CARD",
  "issueCategory": "UNAUTHORISED"
}
```

**Response:**
```json
{
  "recommendation": "Escalate to Fraud Team",
  "recommendationCode": "ESCALATE_FRAUD",
  "priority": "HIGH",
  "ageIndicator": "NEW",
  "rulesTriggered": [
    {
      "ruleId": "RULE-001",
      "ruleName": "Unauthorised Transaction (Fraud Indicator)",
      "conditions": {
        "issueCategory": "UNAUTHORISED"
      }
    }
  ]
}
```

---

## POST /api/disputes/:id/acknowledge

Acknowledge triage outcome and allow user to proceed to a new dispute.

**Purpose:** Marks that the operations user has reviewed the triage result. Supports REQ-020's requirement to return to the capture screen.

**Related Requirements:** REQ-020

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Dispute UUID |

### Request Body

No request body required.

### Success Response (200)

| Field | Type | Description |
|-------|------|-------------|
| disputeId | string | Dispute ID |
| acknowledged | boolean | Always `true` on success |
| nextAction | string | `"RETURN_TO_CAPTURE"` |

### Error Responses

| Status | Condition |
|--------|-----------|
| 404 | Dispute not found |
| 409 | Dispute already acknowledged |
| 500 | Processing failure |

### Example

**Request:**
```
POST /api/disputes/d1a2b3c4-5678-90ab-cdef-1234567890ab/acknowledge
```

**Response:**
```json
{
  "disputeId": "d1a2b3c4-5678-90ab-cdef-1234567890ab",
  "acknowledged": true,
  "nextAction": "RETURN_TO_CAPTURE"
}
```

---

## Decision Matrix Reference

The rules engine evaluates in priority order. First matching rule wins.

| Priority | Rule ID | Conditions | Recommendation | Code |
|----------|---------|-----------|----------------|------|
| 0 | RULE-PRE-01 | status = `ALREADY_REFUNDED` | Close Dispute — Resolved | `CLOSE_RESOLVED` |
| 1 | RULE-001 | issueCategory = `UNAUTHORISED` | Escalate to Fraud Team | `ESCALATE_FRAUD` |
| 2 | RULE-002 | paymentType = `CARD` AND issue = `DUPLICATE_DEBIT` | Immediate Reversal | `IMMEDIATE_REVERSAL` |
| 3 | RULE-003 | paymentType = `EFT` AND status = `PENDING` | Monitor for 24 Hours | `MONITOR_24H` |
| 4 | RULE-004 | amount > R10,000 | Escalate to Senior Ops | `ESCALATE_SENIOR` |
| 5 | RULE-005 | paymentType = `INTERNAL` AND issue = `FAILED_TRANSFER` | Refer to Payments Team | `REFER_PAYMENTS` |
| 6 | RULE-006 | paymentType = `EFT` AND issue = `MISSING_PAYMENT` | Investigate Further | `INVESTIGATE` |
| 7 | RULE-007 | paymentType = `CARD` AND issue = `CARD_DISPUTE` | Investigate Further | `INVESTIGATE` |
| 8 | RULE-008 | issue = `INCORRECT_AMOUNT` | Investigate Further | `INVESTIGATE` |
| 99 | RULE-DEFAULT | No other rule matched | Investigate Further — Manual Review | `INVESTIGATE` |

---

## Priority Assignment

Assigned independently of triage recommendation:

| Condition | Priority |
|-----------|----------|
| amount > R10,000 | HIGH |
| issueCategory = `UNAUTHORISED` | HIGH |
| amount R5,000–R10,000 | MEDIUM |
| dispute age > 7 days | MEDIUM |
| All other cases | LOW |

Highest matching priority wins.

---

## Age Indicator Assignment

| Days Since Transaction | Indicator |
|------------------------|-----------|
| 0–7 days | NEW |
| 8–14 days | AGING |
| > 14 days | OVERDUE |
