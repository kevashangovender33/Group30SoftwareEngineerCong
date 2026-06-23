# Requirements Document

## Introduction

The Payment Dispute Triage System currently captures and triages disputes but provides no way to review historical dispute records. This feature adds a Dispute History View — a dedicated screen for browsing, searching, filtering, and sorting all persisted disputes. Two access points are provided: a global dispute history listing all disputes across all customers, and a customer-specific history accessible from the existing customer selection flow. The feature depends on the "dispute-persistence" spec being implemented first, consuming the GET /api/disputes endpoint and the normalised TriggeredRule relation defined there.

## Glossary

- **History_View**: The dedicated React screen that displays a paginated, filterable list of all persisted dispute records.
- **Global_Dispute_List**: The full listing of all disputes across all customers, accessible as a separate top-level screen via the side navigation.
- **Customer_Dispute_List**: A filtered listing showing only disputes belonging to a specific customer, accessible from the customer selection flow.
- **Dispute_List_Item**: A single row in the dispute history table displaying summary information for one dispute record.
- **Filter_Panel**: The UI component containing search, filter, and sort controls for narrowing the dispute list.
- **Pagination_Controls**: The UI component providing page navigation (previous, next, page numbers) for the dispute list.
- **Sort_Order**: The direction and field by which the dispute list is ordered (ascending or descending by date, priority, or status).
- **Disputes_API**: The GET /api/disputes endpoint defined in the dispute-persistence spec that returns dispute records with optional query parameters.

## Requirements

### Requirement 1: Global Dispute History Screen

**User Story:** As an operations user, I want a dedicated screen showing all disputes across all customers, so that I can review the full dispute history from one place without navigating through individual customer records.

#### Acceptance Criteria

1. WHEN the operations user navigates to the Dispute History screen via the side navigation, THE History_View SHALL display a paginated table of all persisted dispute records ordered by createdAt descending, with a maximum of 10 disputes per page.
2. THE History_View SHALL display the following columns for each Dispute_List_Item: dispute date (createdAt), customer name, transaction amount, payment type, issue category, recommended action, priority, status, and triggered rule count.
3. WHEN no disputes exist in the database, THE History_View SHALL display an empty state message indicating that no dispute records are available, and SHALL hide pagination controls.
4. THE History_View SHALL be accessible as a separate top-level screen in the application, independent of the existing triage capture flow, via the side navigation menu.
5. THE History_View SHALL include a page heading of "Dispute History" displayed as an h1 element and a navigation indicator showing the user is on the history screen.

### Requirement 2: Customer-Specific Dispute History

**User Story:** As an operations user, I want to view past disputes for a specific customer after selecting them, so that I can understand their dispute history before capturing a new dispute.

#### Acceptance Criteria

1. WHEN an operations user selects a customer in the customer selection flow, THE History_View SHALL display a "View History" navigation element within the customer selection screen that navigates to that customer's dispute history.
2. WHEN the customer-specific dispute history is displayed, THE Customer_Dispute_List SHALL show only disputes where the customerId matches the selected customer, displaying the following columns: dispute date (createdAt), customer name, transaction amount, payment type, issue category, recommended action, priority, status, and triggered rule count.
3. WHEN a customer has no prior disputes, THE Customer_Dispute_List SHALL display an empty state message indicating that no disputes exist for that customer, with the customer name included in the message.
4. THE Customer_Dispute_List SHALL display the customer name as a heading element (h2) above the dispute table.
5. THE Customer_Dispute_List SHALL provide a "Back to Customer Selection" navigation element and a "Proceed to Capture" navigation element, enabling the user to either return to the customer selection screen or continue to the transaction selection step of the triage capture flow.
6. IF the Disputes_API returns an error when fetching customer-specific disputes, THEN THE Customer_Dispute_List SHALL display an error message describing the failure and a "Retry" button to re-attempt the data fetch.

### Requirement 3: Search by Customer Name

**User Story:** As an operations user, I want to search the global dispute list by customer name, so that I can quickly find disputes for a specific customer without scrolling through the full list.

#### Acceptance Criteria

1. THE Filter_Panel SHALL include a text input field for searching disputes by customer name, with a maximum input length of 100 characters.
2. WHEN the operations user types a search term of at least 1 character into the customer name search field, THE History_View SHALL send the search request to the API after a 300-millisecond debounce delay and filter the displayed disputes to only those whose customer name contains the search term (case-insensitive partial match via the customerName query parameter on GET /api/disputes).
3. WHEN the search term does not match any customer name in the dispute list, THE History_View SHALL display an empty state message indicating no matching disputes were found.
4. WHEN the search field is cleared, THE History_View SHALL display the full unfiltered dispute list.
5. THE History_View SHALL apply the search filter in combination with any active column filters.
6. IF the API request triggered by the customer name search fails or returns a non-200 response, THEN THE History_View SHALL display an error message indicating that the search could not be completed and SHALL retain the previously displayed dispute list until a successful response is received.

### Requirement 4: Column Filtering

**User Story:** As an operations user, I want to filter the dispute list by payment type, issue category, priority, status, and date range, so that I can narrow down the list to relevant disputes.

#### Acceptance Criteria

1. THE Filter_Panel SHALL include single-select filter controls for: payment type (dropdown with CARD, EFT, INTERNAL options), issue category (dropdown with DUPLICATE_DEBIT, FAILED_TRANSFER, MISSING_PAYMENT, UNAUTHORISED, INCORRECT_AMOUNT, CARD_DISPUTE options), priority (dropdown with HIGH, MEDIUM, LOW options), status (dropdown with OPEN, TRIAGED, CLOSED options), and date range (start date and end date inputs accepting ISO 8601 date format YYYY-MM-DD).
2. WHEN the operations user selects a filter value, THE History_View SHALL send a request to GET /api/disputes with the corresponding query parameters and update the displayed dispute list to show only disputes matching all active filter criteria.
3. WHEN multiple filters are active simultaneously, THE History_View SHALL apply all filters using AND logic, displaying only disputes that satisfy every active filter condition.
4. THE Filter_Panel SHALL provide a "Clear Filters" button that resets all filter controls to their default unselected state (no filter applied) and triggers a fresh data fetch without any filter parameters.
5. WHEN active filters result in no matching disputes, THE History_View SHALL display an empty state message indicating no disputes match the current filter criteria.
6. THE Filter_Panel SHALL display a visual indicator showing the number of active filters (e.g., "3 filters active") when one or more filters are applied.
7. IF the start date is later than the end date in the date range filter, THEN THE Filter_Panel SHALL display a validation error message indicating that the start date must be before or equal to the end date, and SHALL NOT send the API request.

### Requirement 5: Sortable Columns

**User Story:** As an operations user, I want to sort the dispute list by date, priority, or status, so that I can organise disputes in the order most useful for my current task.

#### Acceptance Criteria

1. THE History_View SHALL support sorting by the following columns: dispute date (createdAt), priority, and status.
2. WHEN the operations user clicks a sortable column header, THE History_View SHALL send a request to GET /api/disputes with the corresponding sortBy and sortOrder query parameters and sort the dispute list by that column in ascending order; clicking the same column header again SHALL reverse the sort to descending order, alternating between ascending and descending on each subsequent click.
3. THE History_View SHALL display a sort direction indicator (an upward arrow for ascending, a downward arrow for descending) exclusively on the currently active sorted column header, removing any indicator from previously sorted columns.
4. THE History_View SHALL default to sorting by dispute date (sortBy=createdAt) in descending order (sortOrder=desc, newest first) when no explicit sort selection has been made.
5. WHEN sorting by priority, THE History_View SHALL use the ordering: HIGH first, then MEDIUM, then LOW for ascending; reversed for descending.
6. WHEN sorting by status, THE History_View SHALL use the ordering: OPEN first, then TRIAGED, then CLOSED for ascending; reversed for descending.
7. IF the sort request to GET /api/disputes fails, THEN THE History_View SHALL retain the current dispute list and sort state unchanged and display an error message indicating that the sort operation could not be completed.

### Requirement 6: Pagination

**User Story:** As an operations user, I want the dispute list to be paginated with a fixed page size, so that I can browse large volumes of disputes without performance degradation or overwhelming the interface.

#### Acceptance Criteria

1. THE History_View SHALL display a maximum of 10 disputes per page.
2. THE Pagination_Controls SHALL display: the current page number, the total number of pages, a "Previous" button, a "Next" button, and up to 5 direct page number buttons for navigation (centered around the current page when total pages exceed 5).
3. WHILE the user is on the first page, THE Pagination_Controls SHALL disable the "Previous" button.
4. WHILE the user is on the last page, THE Pagination_Controls SHALL disable the "Next" button.
5. WHEN the operations user changes a filter or sort option, THE Pagination_Controls SHALL reset to page 1.
6. THE Pagination_Controls SHALL display the total count of disputes matching the current filter criteria.
7. IF the total number of disputes matching the current filter is zero, THEN THE History_View SHALL display an empty-state message indicating no disputes were found and SHALL hide the Pagination_Controls.
8. IF the API request to fetch a page of disputes fails, THEN THE History_View SHALL display an error message indicating the disputes could not be loaded, retain the current page number, and allow the user to retry the request.
9. WHILE a page of disputes is being fetched from the API, THE History_View SHALL display a loading indicator in place of the dispute list.

### Requirement 7: Dispute Detail Information Display

**User Story:** As an operations user, I want each dispute row to show all relevant triage information at a glance, so that I can assess disputes without opening individual detail views.

#### Acceptance Criteria

1. THE Dispute_List_Item SHALL display the dispute creation date (createdAt) formatted as "DD MMM YYYY" (e.g., "22 Jun 2026").
2. THE Dispute_List_Item SHALL display the transaction amount formatted as South African Rand with the "R" symbol, thousands separator (comma), and exactly two decimal places (e.g., "R 1,250.00").
3. THE Dispute_List_Item SHALL display the priority using colour-coded badges: HIGH in red, MEDIUM in amber, LOW in green, matching the existing PriorityBadge component styling.
4. THE Dispute_List_Item SHALL display the status as a text label badge showing one of: "OPEN", "TRIAGED", or "CLOSED", each visually distinguishable by label text.
5. THE Dispute_List_Item SHALL display the number of triggered rules as a count badge using the format "N rule" when exactly 1 rule triggered, or "N rules" when more than 1 rule triggered (e.g., "1 rule", "2 rules").
6. THE Dispute_List_Item SHALL display the payment type and issue category using the following label mappings: "CARD" → "Card Payment", "EFT" → "EFT", "INTERNAL" → "Internal Transfer", "DUPLICATE_DEBIT" → "Duplicate Debit", "FAILED_TRANSFER" → "Failed Transfer", "MISSING_PAYMENT" → "Missing Payment", "UNAUTHORISED" → "Unauthorised", "INCORRECT_AMOUNT" → "Incorrect Amount", "CARD_DISPUTE" → "Card Dispute".
7. THE Dispute_List_Item SHALL display the recommended action as a human-readable label (e.g., "Immediate Reversal", "Escalate to Fraud Team").
8. IF no disputes exist in the system, THEN THE History_View SHALL display a message indicating that no disputes have been captured yet.

### Requirement 8: Navigation Integration

**User Story:** As an operations user, I want the dispute history to be accessible from the main navigation, so that I can switch between the triage flow and history review without losing context.

#### Acceptance Criteria

1. THE side navigation SHALL include a "Dispute History" menu item that, when clicked, sets the application view state to the Global_Dispute_List screen.
2. WHEN the operations user navigates to the Dispute History screen, THE side navigation SHALL indicate the "Dispute History" item as active by applying a visually distinct style (background fill and bold font weight) differentiating it from inactive navigation items.
3. WHEN the operations user navigates from the Dispute History screen to the New Dispute flow, THE History_View state (filters, sort, page) SHALL reset to default values so that returning to Dispute History starts from an unfiltered, first-page view.
4. THE mobile bottom navigation SHALL include a "History" item that, when tapped, sets the application view state to the Global_Dispute_List screen.
5. WHEN the operations user navigates to the Dispute History screen via the mobile bottom navigation, THE mobile bottom navigation SHALL indicate the "History" item as active by applying a visually distinct style (primary text colour) differentiating it from inactive items.
6. WHEN the operations user is on the New Dispute flow, THE side navigation and mobile bottom navigation SHALL indicate the "New Dispute" item as active and the "Dispute History" item as inactive.

### Requirement 9: Loading and Error States

**User Story:** As an operations user, I want clear feedback when dispute data is loading or when an error occurs, so that I understand the system status and can take appropriate action.

#### Acceptance Criteria

1. WHILE the dispute list data is being fetched from the Disputes_API, THE History_View SHALL display a loading indicator (spinner or skeleton placeholder) in place of the dispute list content area, visible within 100 milliseconds of the fetch initiating.
2. IF the Disputes_API returns an error response (HTTP status 4xx or 5xx) or the request fails to complete within 30 seconds, THEN THE History_View SHALL display an error message indicating the nature of the failure and a "Retry" button to re-attempt the data fetch.
3. WHILE data is loading, THE Filter_Panel and Pagination_Controls SHALL be visually indicated as disabled (reduced opacity) and SHALL NOT respond to user interaction (clicks and keyboard input are ignored).
4. WHEN the operations user clicks the "Retry" button after an error, THE History_View SHALL display the loading indicator and re-fetch the dispute data from the Disputes_API, transitioning to either the dispute list on success or the error state on subsequent failure.
5. IF the Disputes_API returns an empty result set (HTTP 200 with zero disputes), THEN THE History_View SHALL display an empty state message indicating that no disputes match the current filter criteria, distinct from the error state.

### Requirement 10: API Integration with Dispute Persistence

**User Story:** As a developer, I want the history view to consume the GET /api/disputes endpoint from the dispute-persistence spec, so that the feature builds on the existing persistence layer without duplicating data access logic.

#### Acceptance Criteria

1. THE History_View SHALL fetch dispute data exclusively from the GET /api/disputes endpoint defined in the dispute-persistence spec.
2. WHEN fetching disputes, THE History_View SHALL pass query parameters for: status filter, customer name search, payment type filter, issue category filter, priority filter, date range filter, sort field, sort direction, page number, and page size, omitting any parameter whose value has not been set by the user so that the API applies its defaults.
3. THE Disputes_API SHALL support the following query parameters: customerName (string, case-insensitive partial match, minimum 1 character), paymentType (string), issueCategory (string), priority (string), status (string), startDate (ISO 8601 date string), endDate (ISO 8601 date string), sortBy (string: "createdAt" | "priority" | "status", default "createdAt"), sortOrder (string: "asc" | "desc", default "desc"), page (integer, 1-based, minimum 1), and pageSize (integer, minimum 1, maximum 100, default 10).
4. THE Disputes_API response SHALL include: an array of dispute list items (each containing id, referenceNumber, status, priority, ageIndicator, paymentType, issueCategory, recommendedAction, createdAt, customerName, transactionAmount, and triggeredRuleCount), the total count of matching records, the current page number, and the total number of pages.
5. IF a query parameter value fails validation (non-enum value for status/priority/paymentType/issueCategory, non-ISO-8601 string for startDate or endDate, startDate later than endDate, page less than 1, or pageSize outside the range 1–100), THEN THE Disputes_API SHALL return HTTP 400 with an error message indicating which parameter is invalid and the reason.
6. IF the requested page number exceeds the total number of pages, THEN THE Disputes_API SHALL return HTTP 200 with an empty dispute array, the total count of matching records, the requested page number, and the total number of pages.
7. IF the GET /api/disputes request fails due to a network error or the API returns an HTTP status of 500, THEN THE History_View SHALL display an error message indicating that disputes could not be loaded and SHALL NOT display stale or partial data.
