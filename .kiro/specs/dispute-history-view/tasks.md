# Implementation Plan: Dispute History View

## Overview

This plan implements the Dispute History View feature across server and client. The server-side work extends `GET /api/disputes` with query parameter validation, filtering, sorting, and pagination. The client-side work adds a new screen with filter panel, sortable table, pagination controls, and navigation integration. Tasks are ordered so that foundational server logic is built first, then client utilities and components, then integration and wiring.

## Tasks

- [x] 1. Implement server-side query validation and service layer
  - [x] 1.1 Create query parameter validator (`server/src/services/disputeQueryValidator.ts`)
    - Implement `validateDisputeQueryParams` function that validates raw query string values
    - Validate enum values: status (OPEN, TRIAGED, CLOSED), priority (HIGH, MEDIUM, LOW), paymentType (CARD, EFT, INTERNAL), issueCategory (DUPLICATE_DEBIT, FAILED_TRANSFER, MISSING_PAYMENT, UNAUTHORISED, INCORRECT_AMOUNT, CARD_DISPUTE)
    - Validate date format (YYYY-MM-DD ISO 8601), startDate <= endDate
    - Validate page >= 1, pageSize between 1–100
    - Apply defaults: sortBy="createdAt", sortOrder="desc", page=1, pageSize=10
    - Return `{ valid: true, params }` or `{ valid: false, error: { field, message } }`
    - _Requirements: 10.3, 10.5_

  - [x] 1.2 Create dispute query service (`server/src/services/disputeQueryService.ts`)
    - Implement Prisma `where` clause builder from validated params (customerName contains case-insensitive, exact match for enums, date range on createdAt)
    - Implement `orderBy` clause builder with custom priority weights (HIGH=1, MEDIUM=2, LOW=3) and status weights (OPEN=1, TRIAGED=2, CLOSED=3)
    - Implement pagination: skip = (page - 1) * pageSize, take = pageSize
    - Return `{ disputes: DisputeListItem[], totalCount, page, totalPages }`
    - Flatten joined data: customerName from Customer, transactionAmount from Transaction, triggeredRuleCount from triggeredRules JSON
    - _Requirements: 10.3, 10.4, 5.5, 5.6_

  - [x] 1.3 Extend GET /api/disputes route (`server/src/routes/disputes.ts`)
    - Add `GET /` handler (before the existing `GET /:id`) that accepts all query parameters
    - Wire validator → query service → response
    - Return 400 with `{ error: { message, code: "INVALID_QUERY_PARAM", field } }` for validation failures
    - Return 200 with `{ disputes, totalCount, page, totalPages }` on success
    - Return empty disputes array with correct metadata when page exceeds total
    - Wrap in try/catch, pass errors to `next()`
    - _Requirements: 10.1, 10.4, 10.5, 10.6_

  - [x] 1.4 Write property tests for query validator
    - **Property 9: Invalid enum parameter returns HTTP 400**
    - **Validates: Requirements 10.5, 10.3**

  - [x] 1.5 Write property tests for sort ordering
    - **Property 2: Sort ordering correctness**
    - **Validates: Requirements 5.2, 5.5, 5.6**

  - [x] 1.6 Write property test for page size invariant
    - **Property 6: Page size invariant**
    - **Validates: Requirements 6.1, 1.1**

  - [x] 1.7 Write property test for page beyond total
    - **Property 10: Page beyond total returns empty array with valid metadata**
    - **Validates: Requirements 10.6**

  - [x] 1.8 Write property test for filter AND logic
    - **Property 1: Filter AND logic — all returned disputes satisfy every active filter**
    - **Validates: Requirements 2.2, 3.2, 3.5, 4.2, 4.3**

  - [x] 1.9 Write unit tests for GET /api/disputes route
    - Test filter combinations, sort orders, pagination, validation errors, empty results
    - _Requirements: 10.3, 10.4, 10.5, 10.6_

- [x] 2. Checkpoint — Server validation and query service
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement client utilities and shared types
  - [x] 3.1 Add dispute history types to `client/src/types/index.ts`
    - Add `DisputeListItem`, `DisputeListResponse`, `DisputeFilters`, `SortField`, `SortOrder`, `DisputeHistoryState` interfaces
    - Add updated `Screen` type union with `'DISPUTE_HISTORY' | 'CUSTOMER_DISPUTE_HISTORY'`
    - _Requirements: 10.4, 1.2_

  - [x] 3.2 Create formatters utility (`client/src/utils/formatters.ts`)
    - Implement `formatDate(isoString)` → "DD MMM YYYY"
    - Implement `formatCurrency(amount)` → "R X,XXX.XX"
    - Implement `formatPaymentType(type)` → display label
    - Implement `formatIssueCategory(category)` → display label
    - Implement `formatRuleCount(count)` → "N rule" or "N rules"
    - _Requirements: 7.1, 7.2, 7.5, 7.6_

  - [x] 3.3 Write property test for date formatting
    - **Property 3: Date formatting produces DD MMM YYYY**
    - **Validates: Requirements 7.1**

  - [x] 3.4 Write property test for currency formatting
    - **Property 4: Currency formatting produces R X,XXX.XX**
    - **Validates: Requirements 7.2**

  - [x] 3.5 Write property test for rule count formatting
    - **Property 5: Rule count formatting uses correct singular/plural**
    - **Validates: Requirements 7.5**

  - [x] 3.6 Write unit tests for formatters
    - Test edge cases: midnight dates, zero amount, large amounts, all enum mappings
    - _Requirements: 7.1, 7.2, 7.5, 7.6_

- [x] 4. Implement client hooks and core components
  - [x] 4.1 Create `useDisputeHistory` hook (`client/src/hooks/useDisputeHistory.ts`)
    - Accept filters, sortBy, sortOrder, page, pageSize, customerId params
    - Build query string from active (non-empty) params only
    - Implement 300ms debounce on customerName search
    - Return `{ data, loading, error, refetch }`
    - Reset page to 1 on filter/sort change
    - _Requirements: 3.2, 6.5, 10.2_

  - [x] 4.2 Write property test for query string construction
    - **Property 12: Query string omits unset parameters**
    - **Validates: Requirements 10.2**

  - [x] 4.3 Write property test for page reset on filter change
    - **Property 13: Filter or sort change resets pagination to page 1**
    - **Validates: Requirements 6.5**

  - [x] 4.4 Create StatusBadge component (`client/src/components/StatusBadge.tsx`)
    - Display OPEN, TRIAGED, CLOSED with visually distinct styles
    - Follow same pattern as existing PriorityBadge
    - Add `data-testid="status-badge"`
    - _Requirements: 7.4_

  - [x] 4.5 Create PaginationControls component (`client/src/components/PaginationControls.tsx`)
    - Display current page, total pages, total count
    - Previous/Next buttons with disabled states at boundaries
    - Up to 5 page number buttons centered around current page
    - Add `data-testid` attributes for all interactive elements
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

  - [x] 4.6 Write property test for pagination page buttons
    - **Property 7: Pagination page buttons computation**
    - **Validates: Requirements 6.2**

  - [x] 4.7 Write unit tests for PaginationControls and StatusBadge
    - Test disabled states, page button computation, badge rendering
    - _Requirements: 6.2, 6.3, 6.4, 7.4_

- [x] 5. Checkpoint — Client utilities, hook, and core components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement filter panel and dispute table
  - [x] 6.1 Create FilterPanel component (`client/src/components/FilterPanel.tsx`)
    - Text input for customerName search (max 100 chars)
    - Dropdowns for paymentType, issueCategory, priority, status
    - Date range inputs (startDate, endDate) with inline validation (start <= end)
    - "Clear Filters" button that resets all to defaults
    - Active filter count badge
    - Disabled state (reduced opacity, no interaction) when loading
    - Add `data-testid` attributes
    - _Requirements: 3.1, 4.1, 4.4, 4.6, 4.7, 9.3_

  - [x] 6.2 Write property test for date range validation
    - **Property 8: Date range validation rejects invalid ranges**
    - **Validates: Requirements 4.7**

  - [x] 6.3 Create DisputeTable component (`client/src/components/DisputeTable.tsx`)
    - Display columns: date, customer name, amount, payment type, issue category, recommended action, priority, status, rule count
    - Sortable column headers for createdAt, priority, status with direction indicators
    - Use PriorityBadge, StatusBadge, and formatters for cell rendering
    - Add `data-testid` attributes for table, headers, rows
    - _Requirements: 1.2, 5.1, 5.2, 5.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 6.4 Write unit tests for FilterPanel and DisputeTable
    - Test filter controls rendering, debounce behaviour, sort indicator rendering, column formatting
    - _Requirements: 3.1, 4.1, 5.3, 7.1_

- [x] 7. Implement top-level screen and navigation
  - [x] 7.1 Create DisputeHistoryScreen component (`client/src/components/DisputeHistoryScreen.tsx`)
    - Compose FilterPanel, DisputeTable, PaginationControls
    - Manage filter/sort/pagination state with DEFAULT_STATE
    - Handle loading, error, empty, and data states
    - Customer-specific mode: accept customerId prop, show customer heading (h2), back/proceed buttons
    - Global mode: show "Dispute History" heading (h1)
    - Retry button on error
    - _Requirements: 1.1, 1.3, 1.5, 2.2, 2.3, 2.4, 2.5, 2.6, 6.7, 9.1, 9.2, 9.4, 9.5_

  - [x] 7.2 Write property test for response shape completeness
    - **Property 11: Response shape completeness**
    - **Validates: Requirements 1.2, 10.4**

  - [x] 7.3 Update App.tsx with navigation integration
    - Extend Screen type to include 'DISPUTE_HISTORY' and 'CUSTOMER_DISPUTE_HISTORY'
    - Add click handlers to side nav "Dispute History" item (active style when on history screen)
    - Add click handler to mobile bottom nav "History" item (active style)
    - Wire "New Dispute" nav items to set active style and reset to capture flow
    - Add DisputeHistoryScreen rendering in screen switch
    - Track customerId/customerName for customer-specific history
    - Reset history state when navigating away
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 7.4 Add "View History" link to CustomerSelect component
    - Add a "View History" button/link that navigates to CUSTOMER_DISPUTE_HISTORY with selected customerId
    - Pass customer name for the heading
    - _Requirements: 2.1_

  - [x] 7.5 Write unit tests for DisputeHistoryScreen
    - Test loading, error, empty, and data rendering states
    - Test customer-specific mode with back/proceed navigation
    - _Requirements: 1.1, 1.3, 2.3, 9.1, 9.2, 9.5_

- [x] 8. Checkpoint — All components integrated
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. End-to-end tests
  - [x] 9.1 Write Playwright E2E tests (`client/e2e/dispute-history.spec.ts`)
    - Navigate to Dispute History via side nav, verify screen loads with h1 and table
    - Search by customer name with debounce, verify filtered results
    - Apply multiple filters, verify AND logic, clear filters
    - Sort by column headers, verify sort indicator
    - Paginate through results, verify disabled states at boundaries
    - Customer-specific history via "View History" link
    - Error state with retry button
    - Mobile bottom nav navigation
    - Empty state message and hidden pagination
    - _Requirements: 1.1, 1.3, 2.1, 3.2, 4.2, 5.2, 6.2, 8.1, 8.4, 9.2_

- [x] 10. Final checkpoint — All tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The server GET handler must be added BEFORE the existing `GET /:id` to avoid route conflicts
- All client components use Tailwind CSS utility classes and `data-testid` attributes
- The `useDisputeHistory` hook follows the same pattern as existing hooks in `useApi.ts`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "3.2"] },
    { "id": 2, "tasks": ["1.3", "3.3", "3.4", "3.5", "3.6"] },
    { "id": 3, "tasks": ["1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "4.1", "4.4", "4.5"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.6", "4.7", "6.1", "6.3"] },
    { "id": 5, "tasks": ["6.2", "6.4", "7.1"] },
    { "id": 6, "tasks": ["7.2", "7.3", "7.4", "7.5"] },
    { "id": 7, "tasks": ["9.1"] }
  ]
}
```
