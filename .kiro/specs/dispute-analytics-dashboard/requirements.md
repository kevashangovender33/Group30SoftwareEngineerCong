# Requirements Document

## Introduction

The Payment Dispute Triage System currently provides dispute capture, triage, and history views but lacks a visual analytics overview. This feature adds a dedicated Analytics Dashboard that presents dispute data as animated charts and graphs, enabling operations staff to identify trends and patterns across Payment Type, Issue Category, Status, and Priority dimensions. The dashboard consumes persisted dispute data from the existing SQLite database via a new API endpoint and renders interactive visualizations using a lightweight charting library. All charts animate on navigation to the dashboard view. The UI remains clean and uncluttered by following the existing design system and limiting supplementary metrics to high-value summary cards.

## Glossary

- **Analytics_Dashboard**: The React screen component that displays charts, graphs, and summary metrics derived from persisted dispute data.
- **Analytics_API**: The Express route handler that aggregates dispute data from the database and returns structured analytics payloads to the frontend.
- **Chart_Component**: A reusable React component wrapping a chart library to render a specific visualization (bar chart, pie/doughnut chart, or line chart) with animation support.
- **Summary_Card**: A compact UI element displaying a single key metric (e.g., total disputes, open disputes) with a label and value.
- **Animation_Trigger**: The mechanism that initiates chart entrance animations when the dashboard screen mounts or becomes visible.
- **Dispute_Aggregate**: A grouped count of disputes by a specific dimension (Payment Type, Issue Category, Status, or Priority).

## Requirements

### Requirement 1: Analytics API Endpoint

**User Story:** As an operations user, I want the system to provide aggregated dispute data, so that the dashboard can display meaningful charts without heavy client-side computation.

#### Acceptance Criteria

1. WHEN a GET request is made to /api/disputes/analytics, THE Analytics_API SHALL return a JSON response containing dispute counts grouped by paymentType, issueCategory, status, and priority within 2000 milliseconds.
2. THE Analytics_API SHALL return the paymentType breakdown as an array of objects, each containing a label (String: "Card", "EFT", or "Internal Transfer") and a count (Integer >= 0), always including all three payment type labels even when the count for a label is 0.
3. THE Analytics_API SHALL return the issueCategory breakdown as an array of objects, each containing a label (String: the issue category value formatted as title case with underscores replaced by spaces, e.g. "DUPLICATE_DEBIT" displayed as "Duplicate Debit") and a count (Integer >= 0), including only categories that have at least one dispute.
4. THE Analytics_API SHALL return the status breakdown as an array of objects, each containing a label (String: "Open", "Triaged", or "Closed") and a count (Integer >= 0), always including all three status labels even when the count for a label is 0.
5. THE Analytics_API SHALL return the priority breakdown as an array of objects, each containing a label (String: "High", "Medium", or "Low") and a count (Integer >= 0), always including all three priority labels even when the count for a label is 0.
6. THE Analytics_API SHALL return a summary object containing totalDisputes (Integer >= 0), openDisputes (Integer >= 0: count of disputes with status "OPEN"), resolvedDisputes (Integer >= 0: count of disputes with status "CLOSED"), and highPriorityDisputes (Integer >= 0: count of disputes with priority "HIGH").
7. IF no dispute records exist in the database, THEN THE Analytics_API SHALL return all counts as 0, the paymentType array with all three labels at count 0, the status array with all three labels at count 0, the priority array with all three labels at count 0, an empty issueCategory array, and HTTP status 200.
8. IF a database read error occurs, THEN THE Analytics_API SHALL return an error response with HTTP status 500 and error code "ANALYTICS_QUERY_FAILED".
9. WHEN a GET request is made to /api/disputes/analytics, THE Analytics_API SHALL compute all counts from the current state of the disputes table at the time of the request without caching stale results.

### Requirement 2: Dashboard Navigation and Screen Integration

**User Story:** As an operations user, I want to navigate to the analytics dashboard from the side navigation, so that I can view dispute trends without leaving the application.

#### Acceptance Criteria

1. WHEN the user clicks the "Dashboard" item in the side navigation, THE Analytics_Dashboard SHALL set the application screen state to render the Analytics_Dashboard component in the main content area, replacing the previously displayed screen content within 1 second.
2. THE Analytics_Dashboard SHALL be navigable via the "Dashboard" item in both the desktop side navigation and the mobile bottom navigation, where clicking either item sets the screen state to display the Analytics_Dashboard.
3. WHILE the Analytics_Dashboard screen is the active screen state, THE side navigation SHALL apply the active state styling (bg-secondary-container, font-bold) to the "Dashboard" item on desktop, and apply the active indicator (text-primary with filled icon variant) to the "Dashboard" item on mobile bottom navigation.
4. THE Analytics_Dashboard SHALL include a page header with the title "Dispute Analytics" styled using the headline-md token from the design system.
5. WHEN the user navigates away from the Analytics_Dashboard to another screen, THE Analytics_Dashboard SHALL cancel any in-progress API requests initiated by the dashboard (via AbortController or equivalent cleanup in useEffect) before the component unmounts.
6. IF the Analytics_Dashboard data fails to load due to a network error or server error, THEN THE Analytics_Dashboard SHALL display an error message indicating that analytics data could not be retrieved, and SHALL provide a retry action allowing the user to re-request the data without navigating away.

### Requirement 3: Charts Displaying Dispute Breakdowns

**User Story:** As an operations user, I want to see disputes visualized by Payment Type, Issue Category, Status, and Priority, so that I can quickly identify distribution patterns and operational hotspots.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a bar chart showing the count of disputes grouped by Payment Type, with one bar per payment type (Card, EFT, Internal Transfer).
2. THE Analytics_Dashboard SHALL display a doughnut chart showing the count of disputes grouped by Status (Open, Triaged, Closed).
3. THE Analytics_Dashboard SHALL display a bar chart showing the count of disputes grouped by Issue Category, with one bar per category.
4. THE Analytics_Dashboard SHALL display a doughnut chart showing the count of disputes grouped by Priority (High, Medium, Low).
5. WHEN chart data contains zero disputes for a given category, THE Chart_Component SHALL still render that category with a value of 0 (no missing segments or bars).
6. THE Analytics_Dashboard SHALL use the functional colour palette from the design system for chart segments: Crimson (#DC2626) for High/Overdue, Amber (#D97706) for Medium/Aging, and Emerald (#059669) for Low/Resolved where semantically appropriate.

### Requirement 4: Chart Animations on Navigation

**User Story:** As an operations user, I want charts to animate into view when I navigate to the dashboard, so that the interface feels responsive and polished.

#### Acceptance Criteria

1. WHEN the Analytics_Dashboard mounts (user navigates to the dashboard), THE Chart_Component SHALL animate each chart from an initial rendered value of zero to the final data values using Chart.js built-in animation.
2. WHEN the Analytics_Dashboard mount event occurs, THE Animation_Trigger SHALL activate each chart animation within 100 milliseconds of the mount event.
3. WHEN the animation trigger activates, THE Chart_Component SHALL complete all entrance animations within 800 milliseconds, ending with each chart displaying its final data values in a static (non-animating) state.
4. WHEN the dashboard receives updated data (e.g., after a dispute is created and the user returns to the dashboard), THE Chart_Component SHALL re-animate from the currently displayed values to the new data values within 800 milliseconds.
5. IF the user has a prefers-reduced-motion accessibility setting enabled, THEN THE Chart_Component SHALL render charts at their final data values within a single frame (no intermediate animation frames displayed).
6. IF the Analytics_Dashboard unmounts before a chart animation completes, THEN THE Chart_Component SHALL cancel any in-progress animations without errors or memory leaks.

### Requirement 5: Summary Metric Cards

**User Story:** As an operations user, I want to see key summary metrics at a glance, so that I can understand the overall dispute landscape without interpreting individual charts.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a Summary_Card labelled "Total Disputes" showing the totalDisputes value from the Analytics_API summary object.
2. THE Analytics_Dashboard SHALL display a Summary_Card labelled "Open Disputes" showing the openDisputes value from the Analytics_API summary object (status = OPEN).
3. THE Analytics_Dashboard SHALL display a Summary_Card labelled "Resolved Disputes" showing the resolvedDisputes value from the Analytics_API summary object (status = CLOSED).
4. THE Analytics_Dashboard SHALL display a Summary_Card labelled "High Priority" showing the highPriorityDisputes value from the Analytics_API summary object (priority = HIGH).
5. THE Summary_Card components SHALL be arranged in a single horizontal row above the charts section on viewports at or above the md breakpoint (768px), and SHALL wrap to a 2x2 grid on viewports below the md breakpoint.
6. WHEN summary metric values are zero, THE Summary_Card SHALL display "0" rather than hiding the card.
7. THE Summary_Card SHALL display metric values as locale-formatted integers with thousands separators (e.g., "1,234") for values of 1000 or greater.
8. THE Summary_Card SHALL render each metric value with an accessible label associating the displayed number with its card title, so that screen readers announce both the metric name and value.

### Requirement 6: Dashboard Layout and Visual Clarity

**User Story:** As an operations user, I want the dashboard to be clean and uncluttered, so that I can focus on the data without visual noise.

#### Acceptance Criteria

1. WHEN the viewport width is 768px or above, THE Analytics_Dashboard SHALL arrange charts in a 2-column grid layout, and WHEN the viewport width is below 768px, THE Analytics_Dashboard SHALL arrange charts in a single-column vertical stack.
2. THE Analytics_Dashboard SHALL limit the total number of chart visualizations to exactly 4 (Payment Type, Issue Category, Status, Priority) to avoid information overload.
3. THE Analytics_Dashboard SHALL wrap each chart in a card container with a white background, 8px border-radius, and a 1px solid border using the outline-variant color token.
4. THE Analytics_Dashboard SHALL include a descriptive title label above each chart using the body-lg typography token, where the title identifies the data dimension being visualized (e.g., "Disputes by Payment Type").
5. THE Analytics_Dashboard SHALL maintain a minimum of 16px spacing between chart cards and 24px spacing between the summary cards row and the charts grid.
6. THE Analytics_Dashboard SHALL display no more than 4 Summary_Card components, arranged in a horizontal row on viewports 768px and above, and in a 2-column grid on viewports below 768px.
7. THE Analytics_Dashboard SHALL render the 4 chart cards in the following fixed order: Payment Type, Issue Category, Status, Priority.

### Requirement 7: Loading and Error States

**User Story:** As an operations user, I want clear feedback when analytics data is loading or fails to load, so that I am not confused by empty or broken charts.

#### Acceptance Criteria

1. WHILE the Analytics_API request is in progress, THE Analytics_Dashboard SHALL display a loading skeleton or spinner in place of each chart and summary card, preserving the page layout dimensions.
2. IF the Analytics_API request returns an HTTP error status or does not respond within 30 seconds, THEN THE Analytics_Dashboard SHALL display an error message indicating that analytics data could not be loaded, along with a retry button.
3. WHEN the user clicks the retry button, THE Analytics_Dashboard SHALL display the loading state from criterion 1 and re-fetch the analytics data from the API.
4. THE Analytics_Dashboard SHALL not display partially loaded charts; either all charts render with complete data or the loading/error state is shown for the entire analytics section.
5. WHILE the Analytics_API request is in progress, THE Analytics_Dashboard SHALL disable chart animations so that previously rendered data does not animate during the transition to the updated dataset.
6. IF the user has clicked the retry button 3 times consecutively without a successful response, THEN THE Analytics_Dashboard SHALL keep the error message visible and the retry button enabled, allowing the user to continue retrying without restriction.
