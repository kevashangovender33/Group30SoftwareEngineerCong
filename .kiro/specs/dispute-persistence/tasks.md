# Implementation Plan: Dispute Persistence

## Overview

This plan implements full dispute persistence by normalising triggered rules into a dedicated table, adding a status lifecycle service, introducing a repository layer with Prisma interactive transactions, updating route handlers, enhancing the seed script, and adding comprehensive tests. Each task builds incrementally so the system remains functional at every checkpoint.

## Tasks

- [x] 1. Update Prisma schema and run migration
  - [x] 1.1 Add TriggeredRule model and update Dispute model in schema.prisma
    - Add `TriggeredRule` model with fields: id (UUID), disputeId (FK), ruleId, ruleName, conditions (String), createdAt, updatedAt
    - Add `dispute Dispute @relation(fields: [disputeId], references: [id], onDelete: Cascade)` on TriggeredRule
    - Replace `triggeredRules String?` field on Dispute with `triggeredRules TriggeredRule[]` relation
    - Run `npm run db:migrate --workspace=server` to create the migration
    - Run `npm run db:generate --workspace=server` to regenerate Prisma client
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2. Implement status lifecycle service
  - [x] 2.1 Create server/src/services/statusLifecycle.ts
    - Export `DisputeStatus` type: `'OPEN' | 'TRIAGED' | 'CLOSED'`
    - Implement `determineInitialStatus(recommendationCode: string): { status: DisputeStatus; resolvedAt: Date | null }` — returns CLOSED + now for CLOSE_RESOLVED, TRIAGED + null otherwise
    - Implement `validateStatusTransition(current: DisputeStatus, next: DisputeStatus): boolean` — allows OPEN→TRIAGED, OPEN→CLOSED, TRIAGED→CLOSED only
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.2 Write property test for status lifecycle (Property 2)
    - **Property 2: Status lifecycle is determined by recommendation code**
    - Use fast-check to generate random recommendationCode strings
    - Assert: CLOSE_RESOLVED → status=CLOSED, resolvedAt≠null; all others → status=TRIAGED, resolvedAt=null
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 2.3 Write property test for status transitions (Property 3)
    - **Property 3: Status field is restricted to valid values and transitions**
    - Use fast-check to generate arbitrary string pairs and valid status pairs
    - Assert: invalid status values rejected; only OPEN→TRIAGED, OPEN→CLOSED, TRIAGED→CLOSED accepted
    - **Validates: Requirements 3.4, 3.5**

  - [x] 2.4 Write unit tests for statusLifecycle service
    - Test determineInitialStatus for each recommendation code (CLOSE_RESOLVED, ESCALATE_FRAUD, IMMEDIATE_REVERSAL, MONITOR_24H, ESCALATE_SENIOR, INVESTIGATE, REFER_PAYMENTS)
    - Test validateStatusTransition for all 9 (current, next) pairs
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Implement dispute repository
  - [x] 3.1 Create server/src/repositories/disputeRepository.ts
    - Define `CreateDisputeInput` interface matching the design (referenceNumber, customerId, transactionId, paymentType, issueCategory, status, priority, ageIndicator, recommendedAction, resolvedAt, triggeredRules array)
    - Define `DisputeListFilter` interface with optional status field
    - Implement `create(input: CreateDisputeInput)` using `prisma.$transaction()` to atomically create Dispute + TriggeredRule records
    - Implement `findById(id: string)` with `include: { triggeredRules: true, customer: true, transaction: true }`
    - Implement `findAll(filter?: DisputeListFilter)` ordered by createdAt descending, including customer name, transaction amount, and triggeredRule count
    - Use JSON.stringify for conditions on write, JSON.parse on read
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.5_

  - [x] 3.2 Write property test for conditions serialization (Property 6)
    - **Property 6: Conditions serialization round-trip**
    - Use fast-check to generate random `Record<string, string | number>` objects
    - Assert: JSON.parse(JSON.stringify(conditions)) deep-equals original conditions
    - **Validates: Requirements 6.2, 6.5**

  - [x] 3.3 Write unit tests for disputeRepository
    - Test create method with mocked Prisma client, verify transaction usage
    - Test findById returns dispute with parsed triggeredRules
    - Test findAll with and without status filter
    - Test findAll returns results ordered by createdAt descending
    - _Requirements: 1.1, 2.2, 2.3, 7.1, 7.2_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update route handlers to use repository and lifecycle service
  - [x] 5.1 Refactor POST /api/disputes handler
    - Import and use `determineInitialStatus` from statusLifecycle service
    - Import and use `disputeRepository.create()` instead of direct Prisma calls
    - Remove the old `triggeredRules: JSON.stringify(...)` field write
    - Pass triggered rules as array of objects to repository
    - Maintain existing validation logic and reference number generation with retry
    - Return response with triggeredRules as array of objects (ruleId, ruleName, conditions)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.3, 6.4_

  - [x] 5.2 Add GET /api/disputes endpoint for listing
    - Add route handler for `GET /` on disputes router
    - Accept optional `status` query parameter
    - Validate status query param — return 400 if not OPEN/TRIAGED/CLOSED
    - Call `disputeRepository.findAll(filter)` with optional status filter
    - Return `{ disputes: [...] }` with each item containing: id, referenceNumber, status, priority, ageIndicator, paymentType, issueCategory, recommendedAction, createdAt, customerName, transactionAmount, triggeredRuleCount
    - Return empty array with 200 if no results
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 5.3 Update GET /api/disputes/:id to use repository
    - Replace direct Prisma query with `disputeRepository.findById(id)`
    - Return triggeredRules as array of objects from relation (no more JSON.parse of string field)
    - Include ruleId, ruleName, and conditions (parsed object) for each triggered rule
    - _Requirements: 6.2, 2.3_

  - [x] 5.4 Write property test for dispute creation round-trip (Property 1)
    - **Property 1: Dispute creation round-trip preserves all fields**
    - Use fast-check to generate valid (paymentType, issueCategory) tuples from allowed sets
    - Create dispute via POST, then retrieve via GET by ID
    - Assert: all fields match triage engine output (status, priority, ageIndicator, recommendedAction, triggeredRules)
    - **Validates: Requirements 1.1, 6.1, 6.4**

  - [x] 5.5 Write property test for triggered rule count (Property 4)
    - **Property 4: Triggered rule count matches triage engine output**
    - Use fast-check to generate valid dispute inputs
    - Assert: number of TriggeredRule records equals rulesTriggered.length from triage engine (≥1)
    - **Validates: Requirements 2.2, 2.3**

  - [x] 5.6 Write property test for list ordering (Property 7)
    - **Property 7: Dispute list is ordered by createdAt descending**
    - Create N disputes, retrieve via GET /api/disputes
    - Assert: createdAt values are in strictly non-increasing order
    - **Validates: Requirements 7.1**

  - [x] 5.7 Write property test for status filter (Property 8)
    - **Property 8: Status filter returns only matching disputes**
    - Create disputes with mixed statuses, query with each status filter
    - Assert: all returned disputes have matching status; each includes customerName, transactionAmount, triggeredRuleCount
    - **Validates: Requirements 7.2, 7.3**

  - [x] 5.8 Write property test for invalid status parameter (Property 9)
    - **Property 9: Invalid status query parameter returns 400**
    - Use fast-check to generate arbitrary strings excluding OPEN/TRIAGED/CLOSED
    - Assert: GET /api/disputes?status={invalid} returns HTTP 400
    - **Validates: Requirements 7.5**

  - [x] 5.9 Write unit tests for route handlers
    - Test POST /api/disputes success response shape with triggeredRules as objects
    - Test POST /api/disputes validation errors (missing fields, invalid paymentType, invalid issueCategory)
    - Test GET /api/disputes returns list with customerName and transactionAmount
    - Test GET /api/disputes?status=OPEN filters correctly
    - Test GET /api/disputes?status=INVALID returns 400
    - Test GET /api/disputes/:id returns full dispute with triggeredRules array
    - Test GET /api/disputes/:id returns 404 for unknown ID
    - _Requirements: 1.1, 6.1, 6.2, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Enhance seed script with dispute and triggered rule records
  - [x] 7.1 Update server/prisma/seed.ts with dispute and TriggeredRule seed data
    - Add deletion of TriggeredRule records before Dispute records (FK order) in the clear step
    - Add at least 6 dispute records: 2 OPEN, 2 TRIAGED, 2 CLOSED
    - Include varying priorities (HIGH, MEDIUM, LOW) and age indicators (NEW, AGING, OVERDUE)
    - Cover at least 4 different recommendationCode values (CLOSE_RESOLVED, ESCALATE_FRAUD, IMMEDIATE_REVERSAL, MONITOR_24H, ESCALATE_SENIOR, INVESTIGATE, REFER_PAYMENTS)
    - Create associated TriggeredRule records for each dispute (at least 1 per dispute)
    - Reference only existing seeded customers (cust-001 to cust-006) and transactions (txn-001 to txn-020)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 7.2 Write unit tests for seed script integrity
    - Verify seed produces at least 6 disputes with correct status distribution
    - Verify each dispute has at least 1 associated TriggeredRule record
    - Verify all dispute customerIds and transactionIds reference valid seeded records
    - _Requirements: 5.1, 5.2, 5.6_

- [x] 8. Cascade delete and transaction rollback verification
  - [x] 8.1 Write property test for cascade delete (Property 5)
    - **Property 5: Cascade delete removes all associated triggered rules**
    - Create disputes with 1–5 TriggeredRule records using fast-check generated data
    - Delete the dispute, verify zero TriggeredRule records remain with that disputeId
    - **Validates: Requirements 2.4, 4.5**

  - [x] 8.2 Write integration tests for transaction atomicity
    - Test that if a TriggeredRule insert fails, the parent Dispute is also rolled back
    - Test that running the seed script twice produces consistent data (idempotency)
    - Test that migration preserves existing Customer and Transaction rows
    - _Requirements: 1.5, 2.5, 6.3_

- [x] 9. End-to-end tests
  - [x] 9.1 Write Playwright E2E test for dispute persistence flow
    - Test full dispute capture → triage result → verify dispute persisted with correct status
    - Test triggered rules are visible on the result screen
    - Test creating a CLOSE_RESOLVED dispute shows CLOSED status
    - _Requirements: 1.1, 1.4, 3.1, 6.4_

  - [x] 9.2 Write Playwright E2E test for dispute list with filter
    - Test GET /api/disputes returns seeded disputes
    - Test filtering by status=TRIAGED returns only TRIAGED disputes
    - Test filtering by invalid status shows appropriate error
    - _Requirements: 7.1, 7.2, 7.5_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All code uses TypeScript with ESM imports (`.js` extensions)
- The Prisma singleton from `server/src/lib/prisma.ts` is used throughout
- The frontend response shape is preserved — no client changes required

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.2", "3.3"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 4, "tasks": ["5.4", "5.5", "5.6", "5.7", "5.8", "5.9"] },
    { "id": 5, "tasks": ["7.1"] },
    { "id": 6, "tasks": ["7.2", "8.1", "8.2"] },
    { "id": 7, "tasks": ["9.1", "9.2"] }
  ]
}
```
