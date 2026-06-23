# Requirements Document

## Introduction

The Payment Dispute Triage System enables banking operations staff to capture customer payment disputes and receive deterministic, rules-based recommendations for next actions. The system uses a static decision matrix to evaluate disputes against priority-ordered rules, assigns independent priority and age indicators, and displays the full triage result on a single screen. All data is local mock data served from SQLite — no external integrations exist.

## Glossary

- **Triage_Engine**: The server-side service that evaluates disputes against the decision matrix and produces recommendations
- **API_Server**: The Express backend providing RESTful endpoints for customers, transactions, disputes, and triage evaluation
- **Frontend**: The React single-page application providing the 4-step user interface
- **Decision_Matrix**: The ordered set of business rules evaluated top-to-bottom where the first match wins
- **Operations_User**: Internal bank staff responsible for handling customer payment disputes
- **Priority**: A HIGH/MEDIUM/LOW classification assigned independently of the recommendation
- **Age_Indicator**: A NEW/AGING/OVERDUE classification calculated from the transaction date
- **High_Value_Threshold**: R10,000 — the configurable amount above which disputes receive HIGH priority
- **Reference_Number**: A human-readable dispute identifier (e.g., DSP-001)

## Requirements

### Requirement 1: Reference Data Retrieval

**User Story:** As an operations user, I want to retrieve the allowed payment types and issue categories, so that the capture form presents only valid options.

#### Acceptance Criteria

1. WHEN a client requests reference data, THE API_Server SHALL return exactly three payment types: CARD, EFT, INTERNAL
2. WHEN a client requests reference data, THE API_Server SHALL return exactly six issue categories: DUPLICATE_DEBIT, FAILED_TRANSFER, MISSING_PAYMENT, UNAUTHORISED, INCORRECT_AMOUNT, CARD_DISPUTE
3. THE API_Server SHALL include a dataSource field set to "MOCK" in the reference data response

### Requirement 2: Customer Search and Retrieval

**User Story:** As an operations user, I want to search for customers by name, email, or account number, so that I can select the correct customer to lodge a dispute for.

#### Acceptance Criteria

1. WHEN a search query is provided, THE API_Server SHALL return customers whose name, email, or account number partially matches the query (case-insensitive)
2. WHEN no search query is provided, THE API_Server SHALL return all customers from the mock dataset
3. THE API_Server SHALL return customer records containing id, name, email, and accountNumber fields

### Requirement 3: Transaction Retrieval by Customer

**User Story:** As an operations user, I want to view transactions for a selected customer, so that I can choose which transaction to dispute.

#### Acceptance Criteria

1. WHEN a customerId filter is provided, THE API_Server SHALL return only transactions belonging to that customer
2. WHEN a status filter is provided, THE API_Server SHALL return only transactions matching that status
3. THE API_Server SHALL return transaction records containing id, customerId, amount, paymentType, status, description, and transactionDate fields

### Requirement 4: Dispute Creation and Triage

**User Story:** As an operations user, I want to submit a dispute and immediately receive a triage recommendation, so that I can take the appropriate next action without delay.

#### Acceptance Criteria

1. WHEN a valid dispute is submitted, THE API_Server SHALL create a dispute record with a unique reference number and persist it to the database
2. WHEN a valid dispute is submitted, THE API_Server SHALL invoke the Triage_Engine and return the recommendation, priority, age indicator, and triggered rules in the response
3. WHEN a dispute is created, THE API_Server SHALL set its status to TRIAGED
4. IF the transactionId does not exist in the database, THEN THE API_Server SHALL return a 404 error
5. IF the paymentType is not one of CARD, EFT, or INTERNAL, THEN THE API_Server SHALL return a 422 error
6. IF the issueCategory is not one of the six valid categories, THEN THE API_Server SHALL return a 422 error
7. IF a required field (transactionId, paymentType, or issueCategory) is missing, THEN THE API_Server SHALL return a 400 error with the missing field names

### Requirement 5: Rules Engine Evaluation

**User Story:** As an operations user, I want disputes to be evaluated by a deterministic rules engine, so that I receive consistent and transparent recommendations.

#### Acceptance Criteria

1. THE Triage_Engine SHALL evaluate rules in strict priority order and return the first matching rule's recommendation
2. THE Triage_Engine SHALL always produce exactly one recommendation for any valid input (a default fallback rule exists)
3. WHERE the transaction status is ALREADY_REFUNDED, THE Triage_Engine SHALL short-circuit and return CLOSE_RESOLVED without evaluating further rules
4. WHERE the issue category is UNAUTHORISED, THE Triage_Engine SHALL return ESCALATE_FRAUD (highest priority business rule)
5. WHERE the payment type is CARD and issue category is DUPLICATE_DEBIT, THE Triage_Engine SHALL return IMMEDIATE_REVERSAL
6. WHERE the payment type is EFT and transaction status is PENDING, THE Triage_Engine SHALL return MONITOR_24H
7. WHERE the transaction amount exceeds the High_Value_Threshold (R10,000), THE Triage_Engine SHALL return ESCALATE_SENIOR
8. WHERE the payment type is INTERNAL and issue category is FAILED_TRANSFER, THE Triage_Engine SHALL return REFER_PAYMENTS
9. WHERE the payment type is EFT and issue category is MISSING_PAYMENT, THE Triage_Engine SHALL return INVESTIGATE
10. WHERE the payment type is CARD and issue category is CARD_DISPUTE, THE Triage_Engine SHALL return INVESTIGATE
11. WHERE the issue category is INCORRECT_AMOUNT, THE Triage_Engine SHALL return INVESTIGATE
12. THE Triage_Engine SHALL record the matched rule's ID, name, and conditions in the rulesTriggered array

### Requirement 6: Priority Calculation

**User Story:** As an operations user, I want disputes assigned a priority level, so that I can identify urgent cases at a glance.

#### Acceptance Criteria

1. THE Triage_Engine SHALL assign HIGH priority when the transaction amount exceeds R10,000 or the issue category is UNAUTHORISED
2. THE Triage_Engine SHALL assign MEDIUM priority when the transaction amount is between R5,000 and R10,000 (inclusive) or the dispute age exceeds 7 days
3. THE Triage_Engine SHALL assign LOW priority when no HIGH or MEDIUM conditions are met
4. WHERE multiple priority conditions are met, THE Triage_Engine SHALL assign the highest applicable priority (HIGH > MEDIUM > LOW)
5. THE Triage_Engine SHALL calculate priority independently of the rule recommendation

### Requirement 7: Age Indicator Calculation

**User Story:** As an operations user, I want disputes flagged by age, so that I can identify SLA risks without calculating dates manually.

#### Acceptance Criteria

1. THE Triage_Engine SHALL assign NEW when the dispute age is 0–7 calendar days
2. THE Triage_Engine SHALL assign AGING when the dispute age is 8–14 calendar days
3. THE Triage_Engine SHALL assign OVERDUE when the dispute age exceeds 14 calendar days
4. THE Triage_Engine SHALL calculate age as the number of full days between the transaction date and the current date
5. THE Triage_Engine SHALL calculate age independently of the rule recommendation and priority

### Requirement 8: Standalone Triage Evaluation

**User Story:** As a developer, I want to evaluate the rules engine independently without creating a dispute record, so that I can test triage logic in isolation.

#### Acceptance Criteria

1. WHEN a valid triage evaluation request is submitted to the evaluate endpoint, THE API_Server SHALL return the recommendation, priority, age indicator, and triggered rules without creating a dispute record
2. IF the transactionId does not exist, THEN THE API_Server SHALL return a 404 error
3. IF required fields are missing or invalid, THEN THE API_Server SHALL return a 400 error

### Requirement 9: Dispute Retrieval with Full Context

**User Story:** As an operations user, I want to view complete dispute details including the transaction and customer context, so that I can review the full triage decision on one screen.

#### Acceptance Criteria

1. WHEN a dispute is retrieved by ID, THE API_Server SHALL return the dispute record with embedded transaction and customer details
2. THE API_Server SHALL include the recommendation, recommendationCode, priority, ageIndicator, and rulesTriggered in the response
3. IF the dispute ID does not exist, THEN THE API_Server SHALL return a 404 error

### Requirement 10: Dispute Acknowledgement

**User Story:** As an operations user, I want to acknowledge a triage result and return to the capture screen, so that I can efficiently process multiple disputes in a session.

#### Acceptance Criteria

1. WHEN a dispute is acknowledged, THE API_Server SHALL return a success response with nextAction set to RETURN_TO_CAPTURE
2. IF the dispute ID does not exist, THEN THE API_Server SHALL return a 404 error

### Requirement 11: Frontend Customer Selection Screen

**User Story:** As an operations user, I want to search and select a customer from the mock dataset, so that I can proceed to viewing their transactions.

#### Acceptance Criteria

1. WHEN the application loads, THE Frontend SHALL display a customer search interface with a text input field
2. WHEN the user types in the search field, THE Frontend SHALL display matching customers from the API
3. WHEN the user selects a customer, THE Frontend SHALL navigate to the transaction selection screen

### Requirement 12: Frontend Transaction Selection Screen

**User Story:** As an operations user, I want to view and select a transaction for the chosen customer, so that I can lodge a dispute against it.

#### Acceptance Criteria

1. WHEN the transaction screen loads, THE Frontend SHALL display all transactions for the selected customer
2. THE Frontend SHALL display each transaction's amount, payment type, status, description, and date
3. WHEN the user selects a transaction, THE Frontend SHALL navigate to the dispute capture form
4. WHEN the user clicks back, THE Frontend SHALL return to the customer selection screen

### Requirement 13: Frontend Dispute Capture Form

**User Story:** As an operations user, I want to confirm the payment type and select an issue category, so that the system can evaluate the dispute.

#### Acceptance Criteria

1. WHEN the dispute form loads, THE Frontend SHALL pre-populate the payment type from the selected transaction
2. THE Frontend SHALL display all six issue categories as selectable options
3. IF the user submits without selecting an issue category, THEN THE Frontend SHALL display an inline validation error "Issue category is required"
4. WHILE the dispute is being submitted, THE Frontend SHALL display a loading indicator and disable the submit button
5. WHEN the submission succeeds, THE Frontend SHALL navigate to the triage result screen

### Requirement 14: Frontend Triage Result Screen

**User Story:** As an operations user, I want to see the complete triage result on a single screen, so that I can understand the recommendation and take action.

#### Acceptance Criteria

1. THE Frontend SHALL display the recommendation prominently with colour coding (Red = Escalate, Amber = Monitor/Investigate, Green = Resolve/Close)
2. THE Frontend SHALL display all triggered rules with their conditions as human-readable sentences
3. THE Frontend SHALL display a priority badge with colour coding (High = red, Medium = amber, Low = green)
4. THE Frontend SHALL display an age indicator badge with colour coding (New = grey, Aging = amber, Overdue = red)
5. THE Frontend SHALL display the dispute summary including reference number, payment type, issue category, transaction amount, and transaction date
6. WHEN the user clicks "Log New Dispute", THE Frontend SHALL reset all state and return to the customer selection screen
7. THE Frontend SHALL present all triage information on a single screen without tabs, modals, or secondary navigation
