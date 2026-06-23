# Implementation Plan: Dispute Analytics Dashboard

## Overview

This plan implements the Dispute Analytics Dashboard feature, spanning both server (analytics API endpoint with Prisma aggregation) and client (React screen with Chart.js visualizations and summary cards). The implementation follows the existing layered architecture: route → service for the backend, and hook → screen → components for the frontend. Chart.js and react-chartjs-2 are added as new client dependencies.

## Tasks

- [x] 1. Set up server-side analytics service and route
  - [x] 1.1 Create the analytics service (`server/src/services/analyticsService.ts`)
    - Implement `getAnalytics()` function with Prisma `groupBy` queries for paymentType, issueCategory, status, and priority
    - Implement `formatIssueCategoryLabel()` utility to convert UPPER_SNAKE_CASE to Title Case
    - Ensure fixed-enum dimensions (paymentType, status, priority) always return all labels with count >= 0
    - Ensure issueCategory only includes categories with count > 0
    - Compute summary object (totalDisputes, openDisputes, resolvedDisputes, highPriorityDisputes)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.9_

  - [x] 1.2 Create the analytics route handler (`server/src/routes/analytics.ts`)
    - Create Express Router with `GET /` handler that calls `getAnalytics()` and returns JSON
    - Handle errors by creating AppError with status 500 and code `ANALYTICS_QUERY_FAILED`
    - _Requirements: 1.1, 1.8_

  - [x] 1.3 Mount the analytics router in the API router (`server/src/routes/api.ts`)
    - Import `analyticsRouter` and mount at `/disputes/analytics` path
    - Ensure the analytics route is registered BEFORE the `/disputes/:id` catch-all route
    - _Requirements: 1.1_

- [x] 2. Add client-side types and install charting dependencies
  - [x] 2.1 Add analytics types to `client/src/types/index.ts`
    - Add `AnalyticsBreakdown` interface (label: string, count: number)
    - Add `AnalyticsSummary` interface (totalDisputes, openDisputes, resolvedDisputes, highPriorityDisputes)
    - Add `AnalyticsResponse` interface (paymentType, issueCategory, status, priority arrays + summary)
    - Add `'ANALYTICS_DASHBOARD'` to the `Screen` type union
    - _Requirements: 1.1, 1.6, 2.1_

  - [x] 2.2 Install chart.js and react-chartjs-2 dependencies
    - Run `npm install chart.js@^4.4.0 react-chartjs-2@^5.2.0` in the client workspace
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Implement the useAnalytics hook (`client/src/hooks/useAnalytics.ts`)
  - [x] 3.1 Create the `useAnalytics` custom hook
    - Fetch `GET /api/disputes/analytics` on mount
    - Use `AbortController` for cleanup on unmount
    - Implement 30-second timeout via `setTimeout` + abort
    - Expose `data`, `loading`, `error`, and `retry()` in the return value
    - No retry limit — retry button remains enabled indefinitely
    - _Requirements: 2.5, 7.1, 7.2, 7.3, 7.6_

- [x] 4. Implement chart widget components
  - [x] 4.1 Create `BarChartWidget` component (`client/src/components/analytics/BarChartWidget.tsx`)
    - Accept `data: AnalyticsBreakdown[]`, `colors?: string[]`, and `reducedMotion?: boolean` props
    - Register Chart.js modules (CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)
    - Configure animation duration to 800ms with easeOutQuart easing
    - When `reducedMotion` is true, set animation duration to 0
    - Render zero-value categories with a bar at 0 (no missing bars)
    - _Requirements: 3.1, 3.3, 3.5, 4.1, 4.2, 4.3, 4.5_

  - [x] 4.2 Create `DoughnutChartWidget` component (`client/src/components/analytics/DoughnutChartWidget.tsx`)
    - Accept `data: AnalyticsBreakdown[]`, `colors?: string[]`, and `reducedMotion?: boolean` props
    - Register Chart.js modules (ArcElement, Tooltip, Legend)
    - Configure animation duration to 800ms with easeOutQuart easing
    - When `reducedMotion` is true, set animation duration to 0
    - Render zero-value segments correctly
    - _Requirements: 3.2, 3.4, 3.5, 4.1, 4.2, 4.3, 4.5_

- [x] 5. Implement SummaryCard and ChartCard components
  - [x] 5.1 Create `SummaryCard` component (`client/src/components/SummaryCard.tsx`)
    - Accept `label`, `value`, `icon`, and `variant` props
    - Format value with `Intl.NumberFormat` for thousands separators (e.g., 1234 → "1,234")
    - Display "0" for zero values (never hide)
    - Use `aria-label` associating metric name with value for screen readers
    - Apply variant-specific styling (default, warning, success, danger)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 5.8_

  - [x] 5.2 Create `ChartCard` component (`client/src/components/ChartCard.tsx`)
    - Accept `title` and `children` props
    - White background, 8px border-radius, 1px solid outline-variant border
    - Title uses body-lg typography token (16px, 400 weight)
    - _Requirements: 6.3, 6.4_

- [x] 6. Implement AnalyticsDashboardScreen component
  - [x] 6.1 Create `AnalyticsDashboardScreen` (`client/src/components/AnalyticsDashboardScreen.tsx`)
    - Call `useAnalytics()` hook on mount
    - Display loading skeleton while data is fetching (preserve layout dimensions)
    - Display error message with retry button on failure
    - Render page header with title "Dispute Analytics" using headline-md token
    - Render 4 SummaryCard components in a horizontal row (md+) or 2x2 grid (below md)
    - Render 4 ChartCard components in 2-column grid (md+) or single column (below md)
    - Fixed chart order: Payment Type, Issue Category, Status, Priority
    - Detect `prefers-reduced-motion` and pass to chart widgets
    - Use design system colour palette for chart segments
    - Ensure no partial rendering — all or nothing for charts section
    - 16px spacing between chart cards, 24px between summary row and charts grid
    - _Requirements: 2.4, 2.6, 3.1, 3.2, 3.3, 3.4, 3.6, 4.4, 4.5, 4.6, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7. Integrate dashboard into App.tsx navigation
  - [x] 7.1 Wire up the Dashboard navigation in `client/src/App.tsx`
    - Add `'ANALYTICS_DASHBOARD'` to the Screen type in the component
    - Add `handleNavigateToDashboard` handler that sets screen state
    - Wire the existing desktop "Dashboard" nav item onClick to navigate to the analytics screen
    - Wire the existing mobile "Dash" bottom nav item onClick to navigate to the analytics screen
    - Apply active state styling (bg-secondary-container, font-bold) when dashboard is active on desktop
    - Apply active indicator (text-primary with filled icon variant) on mobile when active
    - Add `'ANALYTICS_DASHBOARD'` case to `renderScreen()` that renders `<AnalyticsDashboardScreen />`
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Write unit tests for server-side analytics
  - [x]* 9.1 Write unit tests for analyticsService (`server/tests/analyticsService.test.ts`)
    - Test correct aggregation with various dispute sets
    - Test empty database returns all zeros with correct shape
    - Test all-same-type sets return correct counts
    - Test formatIssueCategoryLabel for all valid categories
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x]* 9.2 Write unit tests for analytics route (`server/tests/analytics.route.test.ts`)
    - Test returns 200 with correct JSON shape on success
    - Test returns 500 with ANALYTICS_QUERY_FAILED code on database error
    - _Requirements: 1.1, 1.8_

- [x] 10. Write unit tests for client components
  - [x]* 10.1 Write unit tests for SummaryCard (`client/tests/SummaryCard.test.tsx`)
    - Test displays formatted value with thousands separators
    - Test displays "0" for zero value
    - Test has aria-label associating metric name with value
    - Test applies variant-specific styling
    - _Requirements: 5.1, 5.6, 5.7, 5.8_

  - [x]* 10.2 Write unit tests for ChartCard (`client/tests/ChartCard.test.tsx`)
    - Test renders title with correct typography
    - Test wraps children in card container with correct styling
    - _Requirements: 6.3, 6.4_

  - [x]* 10.3 Write unit tests for BarChartWidget (`client/tests/BarChartWidget.test.tsx`)
    - Test renders canvas element
    - Test passes correct data to Chart.js
    - Test handles reducedMotion prop (animation duration 0)
    - _Requirements: 3.1, 3.3, 4.5_

  - [x]* 10.4 Write unit tests for DoughnutChartWidget (`client/tests/DoughnutChartWidget.test.tsx`)
    - Test renders canvas element
    - Test passes correct data to Chart.js
    - Test handles reducedMotion prop (animation duration 0)
    - _Requirements: 3.2, 3.4, 4.5_

  - [x]* 10.5 Write unit tests for AnalyticsDashboardScreen (`client/tests/AnalyticsDashboardScreen.test.tsx`)
    - Test loading state displays skeleton/spinner
    - Test error state displays error message and retry button
    - Test retry click re-fetches data
    - Test all 4 charts render with correct titles
    - Test all 4 summary cards render with correct labels
    - Test charts render in fixed order
    - _Requirements: 2.4, 7.1, 7.2, 7.3, 7.4_

  - [x]* 10.6 Write unit tests for useAnalytics hook (`client/tests/useAnalytics.test.ts`)
    - Test fetch lifecycle (loading → data)
    - Test error handling (loading → error)
    - Test abort on unmount
    - Test retry function re-triggers fetch
    - _Requirements: 2.5, 7.1, 7.2, 7.3, 7.6_

- [x] 11. Write property-based tests
  - [x]* 11.1 Write property test for aggregation count correctness (`server/tests/analyticsService.property.test.ts`)
    - **Property 1: Aggregation count correctness**
    - Generate arrays of dispute objects with random paymentType/issueCategory/status/priority
    - Run aggregation logic and verify counts match manual Array.filter().length
    - Verify summary.totalDisputes equals total record count
    - Verify openDisputes equals count of OPEN, resolvedDisputes equals count of CLOSED, highPriorityDisputes equals count of HIGH
    - Verify issueCategory only includes categories with count > 0
    - **Validates: Requirements 1.1, 1.3, 1.6**

  - [x]* 11.2 Write property test for fixed-enum dimension completeness (`server/tests/analyticsService.property.test.ts`)
    - **Property 2: Fixed-enum dimension completeness**
    - Generate random dispute arrays (including empty), verify response always has exactly 3 paymentType, 3 status, 3 priority entries with correct labels
    - **Validates: Requirements 1.2, 1.4, 1.5, 1.7**

  - [x]* 11.3 Write property test for issue category label formatting (`server/tests/analyticsService.property.test.ts`)
    - **Property 3: Issue category label formatting**
    - Generate random uppercase+underscore strings matching [A-Z]+(_[A-Z]+)*
    - Verify output is title-cased with spaces (first letter uppercase, rest lowercase per word)
    - **Validates: Requirements 1.3**

  - [x]* 11.4 Write property test for metric value formatting (`client/tests/summaryCard.property.test.ts`)
    - **Property 4: Metric value formatting with thousands separators**
    - Generate random non-negative integers (0 to 10,000,000)
    - Verify output matches Intl.NumberFormat expected output with comma thousands and no decimals
    - **Validates: Requirements 5.7**

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Write integration tests
  - [x]* 13.1 Write integration tests for analytics endpoint (`server/tests/analytics.integration.test.ts`)
    - Test GET /api/disputes/analytics with seeded data returns correct aggregated counts
    - Test GET /api/disputes/analytics with empty database returns all zeros with HTTP 200
    - Test freshness: insert new dispute, call endpoint again, verify updated counts
    - Test error propagation: mock Prisma failure, verify 500 with ANALYTICS_QUERY_FAILED
    - _Requirements: 1.1, 1.7, 1.8, 1.9_

- [x] 14. Write end-to-end tests
  - [x]* 14.1 Write E2E tests for the analytics dashboard (`client/e2e/dispute-analytics.spec.ts`)
    - Test navigate to Dashboard via desktop side nav — heading "Dispute Analytics" visible, 4 chart cards rendered
    - Test summary cards display correct values with seeded data
    - Test charts render with canvas elements (bar and doughnut)
    - Test mobile bottom nav "Dash" item renders dashboard with active indicator
    - Test active nav styling when on dashboard screen
    - Test navigate away and back — verify fresh data loads
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.3, 5.4_

- [x] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Chart.js and react-chartjs-2 are new dependencies required for this feature
- The analytics route is mounted under `/api/disputes/analytics` to keep it grouped with dispute-related endpoints
- The design specifies no caching — fresh Prisma queries on each request

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.2"] },
    { "id": 1, "tasks": ["1.2", "1.3", "3.1"] },
    { "id": 2, "tasks": ["4.1", "4.2", "5.1", "5.2"] },
    { "id": 3, "tasks": ["6.1"] },
    { "id": 4, "tasks": ["7.1"] },
    { "id": 5, "tasks": ["9.1", "9.2", "10.1", "10.2", "10.3", "10.4"] },
    { "id": 6, "tasks": ["10.5", "10.6", "11.1", "11.2", "11.3", "11.4"] },
    { "id": 7, "tasks": ["13.1"] },
    { "id": 8, "tasks": ["14.1"] }
  ]
}
```
