# Requirements Document

## Introduction

The Payment Dispute Triage System currently processes disputes in-memory during the triage flow without persisting the full dispute record to the database. This feature adds full persistence so that when a dispute is submitted and triaged, the complete dispute record (including triage result, priority, age indicator, status, and the rules that fired) is saved to the SQLite database via Prisma. Additionally, rules that fired are stored as separate related records rather than a JSON blob, and the seed script is enhanced with pre-existing dispute records covering all lifecycle states for development and testing.

## Glossary

- **Dispute_Repository**: The data access layer responsible for persisting and retrieving dispute records from the SQLite database via Prisma ORM.
- **Triggered_Rule_Record**: A separate database record representing a single business rule that fired during triage evaluation, linked to its parent dispute via a foreign key relationship.
- **Dispute_Status**: The lifecycle state of a dispute record, progressing through OPEN, TRIAGED, and CLOSED based on the triage recommendation.
- **Triage_Engine**: The existing rules-based evaluation service that produces a recommendation, priority, age indicator, and list of triggered rules for a given dispute.
- **Seed_Script**: The Prisma seed script that populates the database with mock data for development and testing.
- **Dispute_Record**: The full persisted representation of a dispute including all triage outputs (recommendedAction, priority, ageIndicator, status, and associated Triggered_Rule_Records).

## Requirements

### Requirement 1: Persist Full Dispute Record on Triage

**User Story:** As an operations user, I want the complete dispute record including triage results to be saved to the database when I submit a dispute, so that dispute history is retained and available for future reference.

#### Acceptance Criteria

1. WHEN a dispute form is submitted and triaged, THE Dispute_Repository SHALL persist the dispute record to the SQLite database including: referenceNumber, customerId, transactionId, paymentType, issueCategory, status, priority, ageIndicator, and recommendedAction.
2. WHEN a dispute is persisted, THE Dispute_Repository SHALL store the createdAt timestamp as the current date and time in ISO 8601 format.
3. IF the persisted dispute has a recommendedAction value other than CLOSE_RESOLVED, THEN THE Dispute_Repository SHALL set the resolvedAt field to null.
4. IF the persisted dispute has a recommendedAction value of CLOSE_RESOLVED, THEN THE Dispute_Repository SHALL set the status to CLOSED and the resolvedAt field to the current date and time.
5. IF the database write operation fails during dispute persistence, THEN THE Dispute_Repository SHALL return an error indicating that the dispute could not be saved, and no partial dispute record SHALL remain in the database.

### Requirement 2: Store Triggered Rules as Separate Related Records

**User Story:** As an operations user, I want the rules that fired during triage to be stored as individual related records in the database, so that I can query and report on rule activity independently of the parent dispute.

#### Acceptance Criteria

1. THE Triggered_Rule_Record SHALL contain the following fields: id (String, UUID primary key), disputeId (String, foreign key to Dispute), ruleId (String, maximum 20 characters), ruleName (String, maximum 100 characters), and conditions (String storing a JSON representation of the matched conditions, maximum 1000 characters).
2. WHEN a dispute is persisted, THE Dispute_Repository SHALL create one Triggered_Rule_Record for each rule that fired during triage evaluation, with a minimum of 1 record per dispute, within the same database transaction as the parent dispute record.
3. WHEN a dispute is retrieved, THE Dispute_Repository SHALL include all associated Triggered_Rule_Records in the response, ordered by the sequence in which the rules were evaluated (matching the priority order defined in the decision matrix).
4. IF a dispute is deleted, THEN THE Dispute_Repository SHALL cascade-delete all associated Triggered_Rule_Records.
5. IF the creation of any Triggered_Rule_Record fails, THEN THE Dispute_Repository SHALL roll back the entire transaction including the parent dispute record to maintain data consistency.

### Requirement 3: Status Lifecycle Based on Triage Recommendation

**User Story:** As an operations user, I want the dispute status to reflect the triage outcome, so that I can immediately understand the current state of each dispute.

#### Acceptance Criteria

1. WHEN a dispute is created with recommendationCode CLOSE_RESOLVED, THE Dispute_Repository SHALL set the initial status to CLOSED and the resolvedAt timestamp to the current date and time.
2. WHEN a dispute is created with any recommendationCode other than CLOSE_RESOLVED, THE Dispute_Repository SHALL set the initial status to OPEN with resolvedAt set to null.
3. WHEN a dispute submission is triaged (i.e., the triage engine evaluates and assigns a recommendation), THE Dispute_Repository SHALL transition the status from OPEN to TRIAGED, unless the recommendation is CLOSE_RESOLVED (which sets CLOSED directly).
4. THE Dispute_Record SHALL restrict the status field to one of three values: OPEN, TRIAGED, or CLOSED.
5. IF a status transition is attempted that does not follow the allowed progression (OPEN → TRIAGED → CLOSED, or OPEN → CLOSED for CLOSE_RESOLVED), THEN THE Dispute_Repository SHALL reject the transition and return a validation error.

### Requirement 4: Prisma Schema Update for Triggered Rules Relation

**User Story:** As a developer, I want the database schema to model triggered rules as a separate table with a one-to-many relationship to disputes, so that rule data is normalised and queryable.

#### Acceptance Criteria

1. THE Prisma schema SHALL define a TriggeredRule model with fields: id (String, UUID primary key, `@default(uuid())`), disputeId (String, foreign key referencing Dispute.id), ruleId (String), ruleName (String), conditions (String storing a JSON-encoded representation of rule conditions), createdAt (DateTime, `@default(now())`), and updatedAt (DateTime, `@updatedAt`).
2. THE Prisma schema SHALL define a one-to-many relationship from Dispute to TriggeredRule using a `triggeredRules TriggeredRule[]` field on the Dispute model and a `dispute Dispute @relation(fields: [disputeId], references: [id], onDelete: Cascade)` field on the TriggeredRule model, so that deleting a Dispute automatically deletes all associated TriggeredRule records.
3. THE Dispute model SHALL remove the existing `triggeredRules String?` field and replace it with a `triggeredRules TriggeredRule[]` relation field pointing to the TriggeredRule model.
4. WHEN a migration is applied, THE Prisma schema change SHALL preserve all existing Customer and Transaction row data; any existing JSON values in the removed `triggeredRules` String field are not required to be migrated to the new TriggeredRule table.
5. WHEN a Dispute record is deleted, THE database SHALL cascade-delete all TriggeredRule records whose disputeId references that Dispute, leaving zero orphaned TriggeredRule rows.

### Requirement 5: Seed Script with Pre-Existing Dispute Records

**User Story:** As a developer, I want the seed script to include pre-existing dispute records in all lifecycle states (OPEN, TRIAGED, CLOSED), so that I can develop and test against realistic data without manually creating disputes.

#### Acceptance Criteria

1. WHEN the seed script runs, THE Seed_Script SHALL create at least 6 dispute records spanning all three status values (OPEN, TRIAGED, CLOSED) with at least 2 disputes per status.
2. WHEN the seed script runs, THE Seed_Script SHALL create associated Triggered_Rule_Records for each seeded dispute, with each dispute having at least 1 related TriggeredRule record.
3. THE Seed_Script SHALL include disputes with varying priorities (HIGH, MEDIUM, LOW) and age indicators (NEW, AGING, OVERDUE), covering all combinations where applicable.
4. THE Seed_Script SHALL include disputes covering at least 4 different recommendationCode values from: CLOSE_RESOLVED, ESCALATE_FRAUD, IMMEDIATE_REVERSAL, MONITOR_24H, ESCALATE_SENIOR, INVESTIGATE, REFER_PAYMENTS.
5. THE Seed_Script SHALL clear existing TriggeredRule and Dispute records before seeding (TriggeredRule first, then Dispute) to respect foreign key constraints.
6. THE Seed_Script SHALL reference only existing seeded Customer and Transaction records via their known IDs (cust-001 through cust-006, txn-001 through txn-020).

### Requirement 6: Update Dispute Creation Endpoint for Normalised Rules

**User Story:** As an operations user, I want the dispute API to return triggered rules from the related records rather than a JSON blob, so that the data format is consistent with the new persistence model.

#### Acceptance Criteria

1. WHEN a dispute is created via POST /api/disputes, THE Dispute_Repository SHALL persist each triggered rule as a separate TriggeredRule record linked to the dispute via a foreign key, within a single Prisma interactive transaction that also creates the Dispute record.
2. WHEN a dispute is retrieved via GET /api/disputes/:id, THE Dispute_Repository SHALL return triggeredRules as an array of objects containing ruleId (string), ruleName (string), and conditions (object parsed from the stored JSON string) loaded from the TriggeredRule relation.
3. IF the database write for any TriggeredRule record fails within the Prisma transaction, THEN THE Dispute_Repository SHALL roll back both the TriggeredRule inserts and the parent Dispute record creation, and return an error response with HTTP status 500.
4. WHEN a dispute is created via POST /api/disputes, THE Dispute_Repository SHALL include the triggeredRules array (each element containing ruleId, ruleName, and conditions) in the POST response body, preserving the same response shape consumed by the frontend.
5. THE TriggeredRule model SHALL store the conditions field as a JSON-serialised string column, and the API layer SHALL deserialise it to an object when returning it in responses.

### Requirement 7: Query Disputes with Filtering

**User Story:** As an operations user, I want to retrieve a list of all persisted disputes with optional filtering by status, so that I can review dispute history and track open cases.

#### Acceptance Criteria

1. WHEN a GET request is made to /api/disputes, THE Dispute_Repository SHALL return all dispute records ordered by createdAt descending, with each record including at minimum: id, referenceNumber, status, priority, ageIndicator, paymentType, issueCategory, recommendedAction, and createdAt.
2. WHERE a status query parameter is provided, THE Dispute_Repository SHALL filter results to only disputes matching that status value.
3. WHEN disputes are returned, THE Dispute_Repository SHALL include the associated customer name, transaction amount, and a count of associated Triggered_Rule_Records for each dispute record.
4. IF no disputes match the filter criteria, THEN THE Dispute_Repository SHALL return an empty array with HTTP status 200.
5. IF the status query parameter value is not one of OPEN, TRIAGED, or CLOSED, THEN THE Dispute_Repository SHALL return an error response with HTTP status 400 indicating the invalid status value.
