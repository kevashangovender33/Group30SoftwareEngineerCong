# Test Cases — Payment Dispute Triage System

This document defines test cases derived from the requirements (REQ-001–REQ-021), API specification, and business rules decision matrix.

---

## Legend

| Field | Description |
|-------|-------------|
| **ID** | Unique test case identifier |
| **Requirement** | Traceability to REQ-xxx |
| **Category** | Unit / Integration / E2E |
| **Priority** | P1 (Critical) / P2 (High) / P3 (Medium) / P4 (Low) |
| **Preconditions** | State required before execution |
| **Steps** | Actions to perform |
| **Expected Result** | Observable outcome |

---

## 1. Mock Data & Constraints (REQ-001, REQ-002, REQ-003)

### TC-001: No External Network Calls
| Field | Value |
|-------|-------|
| Requirement | REQ-001 |
| Category | Integration |
| Priority | P1 |
| Preconditions | Application running |
| Steps | 1. Monitor outbound network traffic during full user flow |
| Expected Result | No HTTP requests to external banking/payment APIs. All calls target localhost. |

### TC-002: Payment Types Limited to Three Options
| Field | Value |
|-------|-------|
| Requirement | REQ-002 |
| Category | Unit |
| Priority | P1 |
| Preconditions | Server running |
| Steps | 1. GET /api/reference-data |
| Expected Result | `paymentTypes` array contains exactly: `["Card Payment", "EFT", "Internal Transfer"]` |

### TC-003: Issue Categories Complete
| Field | Value |
|-------|-------|
| Requirement | REQ-002, REQ-005 |
| Category | Unit |
| Priority | P1 |
| Preconditions | Server running |
| Steps | 1. GET /api/reference-data |
| Expected Result | `issueCategories` contains all 6 categories: Duplicate Debit, Failed Transfer, Missing Payment, Unauthorised Transaction, Incorrect Amount, Card Dispute |


### TC-004: Data Source Confirms Mock
| Field | Value |
|-------|-------|
| Requirement | REQ-001 |
| Category | Unit |
| Priority | P1 |
| Preconditions | Server running |
| Steps | 1. GET /api/reference-data |
| Expected Result | Response includes `"dataSource": "MOCK"` |

### TC-005: Database Seeded on Initialisation
| Field | Value |
|-------|-------|
| Requirement | REQ-003 |
| Category | Integration |
| Priority | P1 |
| Preconditions | Fresh database (after migration + seed) |
| Steps | 1. Query customer count 2. Query transaction count |
| Expected Result | At least 6 customers and 20 transactions exist |

### TC-006: Seed Data Covers All Payment Types
| Field | Value |
|-------|-------|
| Requirement | REQ-003 |
| Category | Integration |
| Priority | P1 |
| Preconditions | Seeded database |
| Steps | 1. Query distinct paymentType values from transactions |
| Expected Result | Returns CARD, EFT, and INTERNAL |

### TC-007: Seed Data Covers All Transaction Statuses
| Field | Value |
|-------|-------|
| Requirement | REQ-003 |
| Category | Integration |
| Priority | P1 |
| Preconditions | Seeded database |
| Steps | 1. Query distinct status values from transactions |
| Expected Result | Returns COMPLETED, PENDING, FAILED, and ALREADY_REFUNDED |

### TC-008: Seed Data Includes High-Value Transactions
| Field | Value |
|-------|-------|
| Requirement | REQ-003, REQ-013 |
| Category | Integration |
| Priority | P2 |
| Preconditions | Seeded database |
| Steps | 1. Query transactions where amount > 10000 |
| Expected Result | At least 2 transactions above the R10,000 threshold |

### TC-009: Seed Data Includes Aged Transactions
| Field | Value |
|-------|-------|
| Requirement | REQ-003, REQ-014 |
| Category | Integration |
| Priority | P2 |
| Preconditions | Seeded database |
| Steps | 1. Query transactions where transactionDate is > 14 days ago |
| Expected Result | At least 2 transactions older than 14 days (Overdue age) |


---

## 2. Customer & Transaction Retrieval (REQ-003, REQ-004)

### TC-010: Get All Customers
| Field | Value |
|-------|-------|
| Requirement | REQ-004 |
| Category | Integration |
| Priority | P2 |
| Preconditions | Seeded database |
| Steps | 1. GET /api/customers |
| Expected Result | Returns array of 6 customers with id, name, email, accountNumber fields |

### TC-011: Search Customers by Name
| Field | Value |
|-------|-------|
| Requirement | REQ-004 |
| Category | Integration |
| Priority | P2 |
| Preconditions | Seeded database |
| Steps | 1. GET /api/customers?search=thabo |
| Expected Result | Returns only "Thabo Molefe" in results |

### TC-012: Search Customers — No Match
| Field | Value |
|-------|-------|
| Requirement | REQ-004 |
| Category | Integration |
| Priority | P3 |
| Preconditions | Seeded database |
| Steps | 1. GET /api/customers?search=nonexistent |
| Expected Result | Returns empty array |

### TC-013: Get Transactions for a Customer
| Field | Value |
|-------|-------|
| Requirement | REQ-004 |
| Category | Integration |
| Priority | P2 |
| Preconditions | Seeded database |
| Steps | 1. GET /api/transactions?customerId=cust-001 |
| Expected Result | Returns 3 transactions belonging to customer cust-001 |

### TC-014: Filter Transactions by Status
| Field | Value |
|-------|-------|
| Requirement | REQ-003 |
| Category | Integration |
| Priority | P3 |
| Preconditions | Seeded database |
| Steps | 1. GET /api/transactions?status=PENDING |
| Expected Result | Returns only transactions with PENDING status |

### TC-015: Get All Transactions
| Field | Value |
|-------|-------|
| Requirement | REQ-003 |
| Category | Integration |
| Priority | P3 |
| Preconditions | Seeded database |
| Steps | 1. GET /api/transactions |
| Expected Result | Returns all 20 transactions with correct schema fields |


---

## 3. Dispute Capture (REQ-004, REQ-005)

### TC-016: Create Dispute Successfully
| Field | Value |
|-------|-------|
| Requirement | REQ-004, REQ-005, REQ-006 |
| Category | Integration |
| Priority | P1 |
| Preconditions | Seeded database, txn-001 exists |
| Steps | 1. POST /api/disputes with `{ transactionId: "txn-001", paymentType: "CARD", issueCategory: "DUPLICATE_DEBIT" }` |
| Expected Result | 201 response with disputeId, referenceNumber, status "TRIAGED", and triage object containing recommendation |

### TC-017: Dispute Gets Unique Reference Number
| Field | Value |
|-------|-------|
| Requirement | REQ-004 |
| Category | Integration |
| Priority | P2 |
| Preconditions | Seeded database |
| Steps | 1. Create two disputes sequentially |
| Expected Result | Each dispute has a different referenceNumber (e.g., DSP-001, DSP-002) |

### TC-018: Dispute Persisted in Database
| Field | Value |
|-------|-------|
| Requirement | REQ-004 |
| Category | Integration |
| Priority | P2 |
| Preconditions | Dispute created via POST /api/disputes |
| Steps | 1. GET /api/disputes/:id using the returned disputeId |
| Expected Result | Full dispute record returned with all fields populated |

### TC-019: Missing transactionId — Validation Error
| Field | Value |
|-------|-------|
| Requirement | REQ-017 |
| Category | Unit |
| Priority | P2 |
| Preconditions | Server running |
| Steps | 1. POST /api/disputes with `{ paymentType: "CARD", issueCategory: "DUPLICATE_DEBIT" }` (no transactionId) |
| Expected Result | 400 response with validation error message |

### TC-020: Missing paymentType — Validation Error
| Field | Value |
|-------|-------|
| Requirement | REQ-005, REQ-017 |
| Category | Unit |
| Priority | P2 |
| Preconditions | Server running |
| Steps | 1. POST /api/disputes with `{ transactionId: "txn-001", issueCategory: "DUPLICATE_DEBIT" }` |
| Expected Result | 400 response indicating payment type is required |

### TC-021: Missing issueCategory — Validation Error
| Field | Value |
|-------|-------|
| Requirement | REQ-005, REQ-017 |
| Category | Unit |
| Priority | P2 |
| Preconditions | Server running |
| Steps | 1. POST /api/disputes with `{ transactionId: "txn-001", paymentType: "CARD" }` |
| Expected Result | 400 response indicating issue category is required |

### TC-022: Invalid Payment Type — 422 Error
| Field | Value |
|-------|-------|
| Requirement | REQ-002 |
| Category | Unit |
| Priority | P2 |
| Preconditions | Server running |
| Steps | 1. POST /api/disputes with `{ transactionId: "txn-001", paymentType: "CRYPTO", issueCategory: "DUPLICATE_DEBIT" }` |
| Expected Result | 422 response indicating invalid payment type |

### TC-023: Invalid Issue Category — 422 Error
| Field | Value |
|-------|-------|
| Requirement | REQ-005 |
| Category | Unit |
| Priority | P2 |
| Preconditions | Server running |
| Steps | 1. POST /api/disputes with `{ transactionId: "txn-001", paymentType: "CARD", issueCategory: "INVALID_CATEGORY" }` |
| Expected Result | 422 response indicating invalid issue category |

### TC-024: Transaction Not Found — 404 Error
| Field | Value |
|-------|-------|
| Requirement | REQ-004 |
| Category | Unit |
| Priority | P2 |
| Preconditions | Server running |
| Steps | 1. POST /api/disputes with `{ transactionId: "txn-nonexistent", paymentType: "CARD", issueCategory: "DUPLICATE_DEBIT" }` |
| Expected Result | 404 response indicating transaction not found |


---

## 4. Rules Engine — Decision Matrix (REQ-006–REQ-010)

### TC-025: RULE-PRE-01 — Already Refunded → Close Dispute
| Field | Value |
|-------|-------|
| Requirement | REQ-018 |
| Category | Unit |
| Priority | P1 |
| Preconditions | txn-009 exists (status: ALREADY_REFUNDED) |
| Steps | 1. POST /api/triage/evaluate with `{ transactionId: "txn-009", paymentType: "CARD", issueCategory: "DUPLICATE_DEBIT" }` |
| Expected Result | recommendation: "Close Dispute — Resolved", code: CLOSE_RESOLVED, ruleId: RULE-PRE-01. No other rules evaluated. |

### TC-026: RULE-001 — Unauthorised → Escalate to Fraud Team
| Field | Value |
|-------|-------|
| Requirement | REQ-009 |
| Category | Unit |
| Priority | P1 |
| Preconditions | txn-002 exists (CARD, COMPLETED, R8,000) |
| Steps | 1. POST /api/triage/evaluate with `{ transactionId: "txn-002", paymentType: "CARD", issueCategory: "UNAUTHORISED" }` |
| Expected Result | recommendation: "Escalate to Fraud Team", code: ESCALATE_FRAUD, ruleId: RULE-001 |

### TC-027: RULE-001 Overrides Other Rules (Fraud Priority)
| Field | Value |
|-------|-------|
| Requirement | REQ-009 |
| Category | Unit |
| Priority | P1 |
| Preconditions | txn-018 exists (CARD, COMPLETED, R18,000 — also high value) |
| Steps | 1. POST /api/triage/evaluate with `{ transactionId: "txn-018", paymentType: "CARD", issueCategory: "UNAUTHORISED" }` |
| Expected Result | recommendation: "Escalate to Fraud Team" (not "Escalate to Senior Ops"), confirming fraud rule has higher priority than high-value rule |

### TC-028: RULE-002 — Card + Duplicate Debit → Immediate Reversal
| Field | Value |
|-------|-------|
| Requirement | REQ-007 |
| Category | Unit |
| Priority | P1 |
| Preconditions | txn-001 exists (CARD, COMPLETED, R1,250) |
| Steps | 1. POST /api/triage/evaluate with `{ transactionId: "txn-001", paymentType: "CARD", issueCategory: "DUPLICATE_DEBIT" }` |
| Expected Result | recommendation: "Immediate Reversal", code: IMMEDIATE_REVERSAL, ruleId: RULE-002 |

### TC-029: RULE-003 — EFT + Pending → Monitor 24 Hours
| Field | Value |
|-------|-------|
| Requirement | REQ-008 |
| Category | Unit |
| Priority | P1 |
| Preconditions | txn-004 exists (EFT, PENDING, R3,500) |
| Steps | 1. POST /api/triage/evaluate with `{ transactionId: "txn-004", paymentType: "EFT", issueCategory: "FAILED_TRANSFER" }` |
| Expected Result | recommendation: "Monitor for 24 Hours", code: MONITOR_24H, ruleId: RULE-003 |

### TC-030: RULE-003 Does Not Fire When EFT is Completed
| Field | Value |
|-------|-------|
| Requirement | REQ-008 |
| Category | Unit |
| Priority | P2 |
| Preconditions | txn-005 exists (EFT, COMPLETED, R25,000) |
| Steps | 1. POST /api/triage/evaluate with `{ transactionId: "txn-005", paymentType: "EFT", issueCategory: "MISSING_PAYMENT" }` |
| Expected Result | Does NOT return "Monitor for 24 Hours". Returns "Escalate to Senior Ops" (RULE-004 fires due to high value) |


### TC-031: RULE-004 — High Value (>R10k) → Escalate to Senior Ops
| Field | Value |
|-------|-------|
| Requirement | REQ-013 |
| Category | Unit |
| Priority | P1 |
| Preconditions | txn-005 exists (EFT, COMPLETED, R25,000) |
| Steps | 1. POST /api/triage/evaluate with `{ transactionId: "txn-005", paymentType: "EFT", issueCategory: "DUPLICATE_DEBIT" }` |
| Expected Result | recommendation: "Escalate to Senior Ops", code: ESCALATE_SENIOR, ruleId: RULE-004 |

### TC-032: RULE-005 — Internal + Failed Transfer → Refer to Payments Team
| Field | Value |
|-------|-------|
| Requirement | REQ-006 |
| Category | Unit |
| Priority | P1 |
| Preconditions | txn-007 exists (INTERNAL, FAILED, R2,000) |
| Steps | 1. POST /api/triage/evaluate with `{ transactionId: "txn-007", paymentType: "INTERNAL", issueCategory: "FAILED_TRANSFER" }` |
| Expected Result | recommendation: "Refer to Payments Team", code: REFER_PAYMENTS, ruleId: RULE-005 |

### TC-033: RULE-006 — EFT + Missing Payment → Investigate Further
| Field | Value |
|-------|-------|
| Requirement | REQ-006 |
| Category | Unit |
| Priority | P2 |
| Preconditions | txn-006 exists (EFT, COMPLETED, R4,500) |
| Steps | 1. POST /api/triage/evaluate with `{ transactionId: "txn-006", paymentType: "EFT", issueCategory: "MISSING_PAYMENT" }` |
| Expected Result | recommendation: "Investigate Further", code: INVESTIGATE, ruleId: RULE-006 |

### TC-034: RULE-007 — Card + Card Dispute → Investigate Further
| Field | Value |
|-------|-------|
| Requirement | REQ-006 |
| Category | Unit |
| Priority | P2 |
| Preconditions | txn-008 exists (CARD, COMPLETED, R6,500) |
| Steps | 1. POST /api/triage/evaluate with `{ transactionId: "txn-008", paymentType: "CARD", issueCategory: "CARD_DISPUTE" }` |
| Expected Result | recommendation: "Investigate Further", code: INVESTIGATE, ruleId: RULE-007 |

### TC-035: RULE-008 — Incorrect Amount → Investigate Further
| Field | Value |
|-------|-------|
| Requirement | REQ-006 |
| Category | Unit |
| Priority | P2 |
| Preconditions | txn-010 exists (INTERNAL, COMPLETED, R900) |
| Steps | 1. POST /api/triage/evaluate with `{ transactionId: "txn-010", paymentType: "INTERNAL", issueCategory: "INCORRECT_AMOUNT" }` |
| Expected Result | recommendation: "Investigate Further", code: INVESTIGATE, ruleId: RULE-008 |

### TC-036: RULE-DEFAULT — Fallback → Investigate (Manual Review)
| Field | Value |
|-------|-------|
| Requirement | REQ-010 |
| Category | Unit |
| Priority | P1 |
| Preconditions | txn-011 exists (INTERNAL, COMPLETED, R500, 1 day old) |
| Steps | 1. POST /api/triage/evaluate with `{ transactionId: "txn-011", paymentType: "INTERNAL", issueCategory: "MISSING_PAYMENT" }` |
| Expected Result | recommendation: "Investigate Further — Manual Review Required", code: INVESTIGATE, ruleId: RULE-DEFAULT |

### TC-037: Every Dispute Gets Exactly One Recommendation
| Field | Value |
|-------|-------|
| Requirement | REQ-010 |
| Category | Integration |
| Priority | P1 |
| Preconditions | Seeded database |
| Steps | 1. Create disputes against each of the 20 mock transactions with various issue categories 2. Check each response |
| Expected Result | Every single response has exactly one `recommendation` field (never null, never multiple) |


---

## 5. Priority Assignment (REQ-013, REQ-015)

### TC-038: High Priority — Amount > R10,000
| Field | Value |
|-------|-------|
| Requirement | REQ-013, REQ-015 |
| Category | Unit |
| Priority | P2 |
| Preconditions | txn-005 exists (R25,000) |
| Steps | 1. Evaluate triage for txn-005 |
| Expected Result | priority: "HIGH" |

### TC-039: High Priority — Unauthorised Transaction
| Field | Value |
|-------|-------|
| Requirement | REQ-015 |
| Category | Unit |
| Priority | P2 |
| Preconditions | txn-002 exists (R8,000, below threshold) |
| Steps | 1. Evaluate triage with issueCategory: UNAUTHORISED |
| Expected Result | priority: "HIGH" (triggered by fraud indicator, not amount) |

### TC-040: Medium Priority — Amount R5,000–R10,000
| Field | Value |
|-------|-------|
| Requirement | REQ-015 |
| Category | Unit |
| Priority | P2 |
| Preconditions | txn-008 exists (R6,500) |
| Steps | 1. Evaluate triage for txn-008 with issueCategory: CARD_DISPUTE |
| Expected Result | priority: "MEDIUM" |

### TC-041: Medium Priority — Age > 7 Days
| Field | Value |
|-------|-------|
| Requirement | REQ-015 |
| Category | Unit |
| Priority | P2 |
| Preconditions | txn-013 exists (R7,500, 8 days old) |
| Steps | 1. Evaluate triage for txn-013 |
| Expected Result | priority: "MEDIUM" (amount in R5k–R10k range AND age > 7 days) |

### TC-042: Low Priority — Default Case
| Field | Value |
|-------|-------|
| Requirement | REQ-015 |
| Category | Unit |
| Priority | P2 |
| Preconditions | txn-001 exists (R1,250, 2 days old) |
| Steps | 1. Evaluate triage for txn-001 with issueCategory: DUPLICATE_DEBIT |
| Expected Result | priority: "LOW" |

### TC-043: Highest Priority Wins When Multiple Conditions Match
| Field | Value |
|-------|-------|
| Requirement | REQ-013, REQ-015 |
| Category | Unit |
| Priority | P2 |
| Preconditions | txn-018 exists (R18,000 + UNAUTHORISED = both HIGH triggers) |
| Steps | 1. Evaluate with issueCategory: UNAUTHORISED |
| Expected Result | priority: "HIGH" (not duplicated, just highest wins) |


---

## 6. Age Indicator Assignment (REQ-014, REQ-016)

### TC-044: Age Indicator — New (0–7 days)
| Field | Value |
|-------|-------|
| Requirement | REQ-014, REQ-016 |
| Category | Unit |
| Priority | P2 |
| Preconditions | txn-001 exists (2 days old) |
| Steps | 1. Evaluate triage for txn-001 |
| Expected Result | ageIndicator: "NEW" |

### TC-045: Age Indicator — Aging (8–14 days)
| Field | Value |
|-------|-------|
| Requirement | REQ-014, REQ-016 |
| Category | Unit |
| Priority | P2 |
| Preconditions | txn-007 exists (10 days old) |
| Steps | 1. Evaluate triage for txn-007 |
| Expected Result | ageIndicator: "AGING" |

### TC-046: Age Indicator — Overdue (> 14 days)
| Field | Value |
|-------|-------|
| Requirement | REQ-014, REQ-016 |
| Category | Unit |
| Priority | P2 |
| Preconditions | txn-006 exists (16 days old) |
| Steps | 1. Evaluate triage for txn-006 |
| Expected Result | ageIndicator: "OVERDUE" |

### TC-047: Age Indicator Boundary — Exactly 7 Days
| Field | Value |
|-------|-------|
| Requirement | REQ-014 |
| Category | Unit |
| Priority | P3 |
| Preconditions | txn-016 exists (7 days old) |
| Steps | 1. Evaluate triage for txn-016 |
| Expected Result | ageIndicator: "NEW" (0–7 inclusive) |

### TC-048: Age Indicator Boundary — Exactly 14 Days
| Field | Value |
|-------|-------|
| Requirement | REQ-014 |
| Category | Unit |
| Priority | P3 |
| Preconditions | Transaction that is exactly 14 days old |
| Steps | 1. Evaluate triage |
| Expected Result | ageIndicator: "AGING" (8–14 inclusive) |


---

## 7. Transparency & Rule Display (REQ-011, REQ-012)

### TC-049: Recommendation Displayed Prominently
| Field | Value |
|-------|-------|
| Requirement | REQ-011 |
| Category | E2E |
| Priority | P2 |
| Preconditions | Application running, seeded data |
| Steps | 1. Navigate to capture form 2. Select customer cust-001 3. Select txn-001 4. Set issue: Duplicate Debit 5. Submit |
| Expected Result | Triage result screen shows "Immediate Reversal" in a visually prominent banner/card |

### TC-050: Triggered Rules Shown with Conditions
| Field | Value |
|-------|-------|
| Requirement | REQ-012 |
| Category | E2E |
| Priority | P2 |
| Preconditions | Dispute created for txn-001 + DUPLICATE_DEBIT |
| Steps | 1. View triage result screen |
| Expected Result | Shows rule name "Card Payment + Duplicate Debit" and conditions: paymentType=CARD, issueCategory=DUPLICATE_DEBIT |

### TC-051: Decision Factors Displayed
| Field | Value |
|-------|-------|
| Requirement | REQ-012 |
| Category | E2E |
| Priority | P2 |
| Preconditions | Dispute created |
| Steps | 1. View triage result screen |
| Expected Result | Screen shows: payment type, issue category, transaction amount, transaction status, and dispute age |

### TC-052: GET /api/disputes/:id Returns Full Transparency Data
| Field | Value |
|-------|-------|
| Requirement | REQ-012 |
| Category | Integration |
| Priority | P2 |
| Preconditions | Dispute exists |
| Steps | 1. GET /api/disputes/:id |
| Expected Result | Response includes rulesTriggered array with ruleId, ruleName, and conditions object |


---

## 8. Acknowledge & Return Flow (REQ-020)

### TC-053: Acknowledge Dispute Successfully
| Field | Value |
|-------|-------|
| Requirement | REQ-020 |
| Category | Integration |
| Priority | P2 |
| Preconditions | Dispute exists with status TRIAGED |
| Steps | 1. POST /api/disputes/:id/acknowledge |
| Expected Result | 200 response with `{ acknowledged: true, nextAction: "RETURN_TO_CAPTURE" }` |

### TC-054: Acknowledge Non-Existent Dispute — 404
| Field | Value |
|-------|-------|
| Requirement | REQ-020 |
| Category | Unit |
| Priority | P3 |
| Preconditions | Server running |
| Steps | 1. POST /api/disputes/nonexistent-id/acknowledge |
| Expected Result | 404 response |

### TC-055: Double Acknowledge — 409 Conflict
| Field | Value |
|-------|-------|
| Requirement | REQ-020 |
| Category | Integration |
| Priority | P3 |
| Preconditions | Dispute already acknowledged |
| Steps | 1. POST /api/disputes/:id/acknowledge (second time) |
| Expected Result | 409 response indicating already acknowledged |

### TC-056: Return to Capture After Acknowledge (E2E)
| Field | Value |
|-------|-------|
| Requirement | REQ-020 |
| Category | E2E |
| Priority | P2 |
| Preconditions | Triage result screen displayed |
| Steps | 1. Click "Log New Dispute" button |
| Expected Result | User navigates back to empty capture form. Previous data cleared. |


---

## 9. UI Validation & Error Handling (REQ-017, REQ-019)

### TC-057: Form Validation — No Payment Type Selected
| Field | Value |
|-------|-------|
| Requirement | REQ-017 |
| Category | E2E |
| Priority | P2 |
| Preconditions | Capture form open, transaction selected |
| Steps | 1. Leave payment type unselected 2. Select issue category 3. Click submit |
| Expected Result | Inline validation error: "Payment type is required". Form does not submit. |

### TC-058: Form Validation — No Issue Category Selected
| Field | Value |
|-------|-------|
| Requirement | REQ-017 |
| Category | E2E |
| Priority | P2 |
| Preconditions | Capture form open, transaction selected |
| Steps | 1. Select payment type 2. Leave issue category empty 3. Click submit |
| Expected Result | Inline validation error: "Issue category is required". Form does not submit. |

### TC-059: Form Validation — Both Fields Missing
| Field | Value |
|-------|-------|
| Requirement | REQ-017 |
| Category | E2E |
| Priority | P3 |
| Preconditions | Capture form open, transaction selected |
| Steps | 1. Leave both fields empty 2. Click submit |
| Expected Result | Both validation errors displayed simultaneously |

### TC-060: Loading Indicator During Processing
| Field | Value |
|-------|-------|
| Requirement | REQ-019 |
| Category | E2E |
| Priority | P3 |
| Preconditions | Capture form filled |
| Steps | 1. Submit dispute form |
| Expected Result | Loading spinner/indicator visible while request is in flight. Submit button disabled. |

### TC-061: Submit Button Disabled During Processing
| Field | Value |
|-------|-------|
| Requirement | REQ-019 |
| Category | E2E |
| Priority | P3 |
| Preconditions | Capture form filled |
| Steps | 1. Submit form 2. Immediately try to click submit again |
| Expected Result | Second click has no effect (button disabled) |


---

## 10. Single-Screen Results (REQ-021)

### TC-062: All Triage Information on One Screen
| Field | Value |
|-------|-------|
| Requirement | REQ-021 |
| Category | E2E |
| Priority | P2 |
| Preconditions | Dispute triaged |
| Steps | 1. View triage result screen |
| Expected Result | Single page contains: recommendation banner, triggered rules, decision factors, priority badge, age badge, dispute summary, transaction details, and "Log New Dispute" button. No tabs, modals, or secondary navigation required. |

### TC-063: Recommendation Above the Fold
| Field | Value |
|-------|-------|
| Requirement | REQ-011, REQ-021 |
| Category | E2E |
| Priority | P3 |
| Preconditions | Dispute triaged, standard desktop viewport |
| Steps | 1. View result screen without scrolling |
| Expected Result | Recommendation and priority/age badges visible without scrolling |

---

## 11. Visual Indicators (REQ-015, REQ-016)

### TC-064: Priority Badge — High (Red)
| Field | Value |
|-------|-------|
| Requirement | REQ-015 |
| Category | E2E |
| Priority | P3 |
| Preconditions | Dispute with HIGH priority |
| Steps | 1. Create dispute for txn-018 (R18k, UNAUTHORISED) 2. View result |
| Expected Result | Red "High" priority badge displayed |

### TC-065: Priority Badge — Medium (Amber)
| Field | Value |
|-------|-------|
| Requirement | REQ-015 |
| Category | E2E |
| Priority | P3 |
| Preconditions | Dispute with MEDIUM priority |
| Steps | 1. Create dispute for txn-008 (R6,500) 2. View result |
| Expected Result | Amber/yellow "Medium" priority badge displayed |

### TC-066: Priority Badge — Low (Green)
| Field | Value |
|-------|-------|
| Requirement | REQ-015 |
| Category | E2E |
| Priority | P3 |
| Preconditions | Dispute with LOW priority |
| Steps | 1. Create dispute for txn-001 (R1,250, 2 days) 2. View result |
| Expected Result | Green "Low" priority badge displayed |

### TC-067: Age Badge — New (Grey)
| Field | Value |
|-------|-------|
| Requirement | REQ-016 |
| Category | E2E |
| Priority | P3 |
| Preconditions | Dispute for recent transaction |
| Steps | 1. Create dispute for txn-001 (2 days old) 2. View result |
| Expected Result | Grey/neutral "New" age badge displayed |

### TC-068: Age Badge — Aging (Amber)
| Field | Value |
|-------|-------|
| Requirement | REQ-016 |
| Category | E2E |
| Priority | P3 |
| Preconditions | Dispute for 8–14 day old transaction |
| Steps | 1. Create dispute for txn-007 (10 days old) 2. View result |
| Expected Result | Amber "Aging" age badge displayed |

### TC-069: Age Badge — Overdue (Red)
| Field | Value |
|-------|-------|
| Requirement | REQ-016 |
| Category | E2E |
| Priority | P3 |
| Preconditions | Dispute for >14 day old transaction |
| Steps | 1. Create dispute for txn-006 (16 days old) 2. View result |
| Expected Result | Red "Overdue" age badge displayed |


---

## 12. Standalone Triage Evaluation (POST /api/triage/evaluate)

### TC-070: Evaluate Without Creating Dispute
| Field | Value |
|-------|-------|
| Requirement | REQ-006 |
| Category | Integration |
| Priority | P2 |
| Preconditions | Seeded database |
| Steps | 1. POST /api/triage/evaluate with valid payload 2. Check dispute count |
| Expected Result | Returns triage result (recommendation, priority, age, rules). No new dispute record created in DB. |

### TC-071: Evaluate — Missing Fields Returns 400
| Field | Value |
|-------|-------|
| Requirement | REQ-006 |
| Category | Unit |
| Priority | P3 |
| Preconditions | Server running |
| Steps | 1. POST /api/triage/evaluate with empty body |
| Expected Result | 400 response with validation errors |

### TC-072: Evaluate — Invalid Transaction Returns 404
| Field | Value |
|-------|-------|
| Requirement | REQ-006 |
| Category | Unit |
| Priority | P3 |
| Preconditions | Server running |
| Steps | 1. POST /api/triage/evaluate with transactionId: "nonexistent" |
| Expected Result | 404 response |

---

## 13. End-to-End User Journey

### TC-073: Full Happy Path — Capture to Result to New Dispute
| Field | Value |
|-------|-------|
| Requirement | REQ-004, REQ-005, REQ-006, REQ-010, REQ-011, REQ-012, REQ-020, REQ-021 |
| Category | E2E |
| Priority | P1 |
| Preconditions | Application running with seeded data |
| Steps | 1. Open app 2. Select customer "Thabo Molefe" 3. Select transaction txn-001 (R1,250 Card) 4. Confirm payment type: Card Payment 5. Select issue: Duplicate Debit 6. Submit dispute 7. Verify triage result shows "Immediate Reversal" 8. Verify rules and decision factors displayed 9. Click "Log New Dispute" 10. Verify capture form is reset and empty |
| Expected Result | Complete flow works end-to-end. Result screen shows recommendation, rules, priority (Low), age (New), all on one screen. Return to capture resets form. |

### TC-074: Full Path — Fraud Escalation
| Field | Value |
|-------|-------|
| Requirement | REQ-009, REQ-011, REQ-015 |
| Category | E2E |
| Priority | P1 |
| Preconditions | Application running with seeded data |
| Steps | 1. Select customer "Fatima Ismail" 2. Select txn-018 (R18k Card) 3. Set issue: Unauthorised Transaction 4. Submit |
| Expected Result | Result: "Escalate to Fraud Team", priority: HIGH (red badge), age: NEW. Fraud rule shown in transparency section. |

### TC-075: Full Path — Already Refunded Short-Circuit
| Field | Value |
|-------|-------|
| Requirement | REQ-018 |
| Category | E2E |
| Priority | P2 |
| Preconditions | Application running with seeded data |
| Steps | 1. Select customer "James van der Merwe" 2. Select txn-009 (Already Refunded) 3. Select any issue category 4. Submit |
| Expected Result | Result: "Close Dispute — Resolved". Rule shown: "Transaction Already Refunded". No other rules evaluated. |

### TC-076: Full Path — EFT Pending Monitor
| Field | Value |
|-------|-------|
| Requirement | REQ-008 |
| Category | E2E |
| Priority | P2 |
| Preconditions | Application running with seeded data |
| Steps | 1. Select customer "Naledi Khumalo" 2. Select txn-004 (EFT, Pending, R3,500) 3. Set issue: Failed Transfer 4. Submit |
| Expected Result | Result: "Monitor for 24 Hours". Rule: "EFT + Pending Status". Priority: LOW. Age: NEW. |

---

## Summary

| Category | Count |
|----------|-------|
| Unit Tests | 28 |
| Integration Tests | 26 |
| E2E Tests | 22 |
| **Total** | **76** |

| Priority | Count |
|----------|-------|
| P1 (Critical) | 16 |
| P2 (High) | 36 |
| P3 (Medium) | 20 |
| P4 (Low) | 4 |
