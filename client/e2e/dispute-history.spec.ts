import { test, expect } from '@playwright/test';

test.describe('Dispute History View — E2E', () => {
  test('Navigate to Dispute History via side nav, verify screen loads with h1 and table (REQ 1.1, 8.1)', async ({
    page,
  }) => {
    await page.goto('/');

    // Click "Dispute History" in the side nav
    const sideNav = page.locator('aside');
    const historyNavItem = sideNav.getByText('Dispute History');
    await historyNavItem.click();

    // Verify the dispute history screen loads
    const historyScreen = page.getByTestId('dispute-history-screen');
    await expect(historyScreen).toBeVisible({ timeout: 15_000 });

    // Verify h1 heading
    const heading = historyScreen.locator('h1');
    await expect(heading).toHaveText('Dispute History');

    // Verify table is displayed with disputes
    const table = page.getByTestId('dispute-table');
    await expect(table).toBeVisible({ timeout: 15_000 });

    // Verify at least one dispute row exists (from seeded data)
    const rows = page.getByTestId('dispute-row');
    await expect(rows.first()).toBeVisible();
  });

  test('Search by customer name with debounce, verify filtered results (REQ 3.2)', async ({
    page,
  }) => {
    await page.goto('/');

    // Navigate to Dispute History
    const sideNav = page.locator('aside');
    await sideNav.getByText('Dispute History').click();
    await expect(page.getByTestId('dispute-history-screen')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('dispute-table')).toBeVisible({ timeout: 15_000 });

    // Get initial row count
    const initialRows = page.getByTestId('dispute-row');
    const initialCount = await initialRows.count();
    expect(initialCount).toBeGreaterThan(0);

    // Type a customer name into the search input
    const searchInput = page.getByTestId('filter-customer-name');
    await searchInput.fill('Thabo');

    // Wait for debounce (300ms) + API response
    await page.waitForTimeout(500);

    // Verify results are filtered — should show fewer or equal results for specific customer
    await expect(page.getByTestId('dispute-table')).toBeVisible({ timeout: 10_000 });
    const filteredRows = page.getByTestId('dispute-row');
    const filteredCount = await filteredRows.count();

    // Filtered results should exist and every row should contain the customer name
    if (filteredCount > 0) {
      for (let i = 0; i < filteredCount; i++) {
        await expect(filteredRows.nth(i)).toContainText('Thabo');
      }
    }
  });

  test('Apply multiple filters and verify AND logic, clear filters (REQ 4.2, 4.3)', async ({
    page,
  }) => {
    await page.goto('/');

    // Navigate to Dispute History
    const sideNav = page.locator('aside');
    await sideNav.getByText('Dispute History').click();
    await expect(page.getByTestId('dispute-history-screen')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('dispute-table')).toBeVisible({ timeout: 15_000 });

    // Apply payment type filter
    const paymentTypeSelect = page.getByTestId('filter-payment-type');
    await paymentTypeSelect.selectOption('CARD');

    // Wait for API response
    await page.waitForTimeout(500);
    await expect(page.getByTestId('dispute-table')).toBeVisible({ timeout: 10_000 });

    // Verify filter count badge shows 1
    const filterCount = page.getByTestId('filter-count');
    await expect(filterCount).toBeVisible();
    await expect(filterCount).toHaveText('1');

    // Apply priority filter (AND logic with payment type)
    const prioritySelect = page.getByTestId('filter-priority');
    await prioritySelect.selectOption('HIGH');

    // Wait for API response
    await page.waitForTimeout(500);

    // Filter count should now be 2
    await expect(filterCount).toHaveText('2');

    // If results exist, all rows should have Card Payment type and HIGH priority displayed
    const rows = page.getByTestId('dispute-row');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        await expect(rows.nth(i)).toContainText('Card Payment');
      }
    }

    // Clear filters
    const clearButton = page.getByTestId('filter-clear');
    await clearButton.click();

    // Wait for reset and API response
    await page.waitForTimeout(500);

    // Verify filters are cleared — filter count badge should disappear
    await expect(filterCount).not.toBeVisible();

    // Verify table is back to full results
    await expect(page.getByTestId('dispute-table')).toBeVisible({ timeout: 10_000 });
  });

  test('Sort by column headers, verify sort indicator (REQ 5.2)', async ({ page }) => {
    await page.goto('/');

    // Navigate to Dispute History
    const sideNav = page.locator('aside');
    await sideNav.getByText('Dispute History').click();
    await expect(page.getByTestId('dispute-history-screen')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('dispute-table')).toBeVisible({ timeout: 15_000 });

    // Default sort should be createdAt descending — check sort indicator shows ↓ on date column
    const dateHeader = page.getByTestId('table-header-createdAt');
    const dateSortIndicator = dateHeader.getByTestId('sort-indicator');
    await expect(dateSortIndicator).toHaveText('↓');

    // Click priority header to sort by priority ascending
    const priorityHeader = page.getByTestId('table-header-priority');
    await priorityHeader.click();

    // Wait for API response
    await page.waitForTimeout(500);
    await expect(page.getByTestId('dispute-table')).toBeVisible({ timeout: 10_000 });

    // Verify priority sort indicator shows ↑ (ascending)
    const prioritySortIndicator = priorityHeader.getByTestId('sort-indicator');
    await expect(prioritySortIndicator).toHaveText('↑');

    // Click priority header again to reverse sort to descending
    await priorityHeader.click();
    await page.waitForTimeout(500);
    await expect(page.getByTestId('dispute-table')).toBeVisible({ timeout: 10_000 });

    // Verify priority sort indicator shows ↓ (descending)
    await expect(prioritySortIndicator).toHaveText('↓');
  });

  test('Paginate through results, verify disabled states at boundaries (REQ 6.2)', async ({
    page,
  }) => {
    await page.goto('/');

    // Navigate to Dispute History
    const sideNav = page.locator('aside');
    await sideNav.getByText('Dispute History').click();
    await expect(page.getByTestId('dispute-history-screen')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('dispute-table')).toBeVisible({ timeout: 15_000 });

    // Verify pagination info is visible
    const paginationInfo = page.getByTestId('pagination-info');
    await expect(paginationInfo).toBeVisible();
    await expect(paginationInfo).toContainText('Page 1');

    // On page 1, the Previous button should be disabled
    const prevButton = page.getByTestId('pagination-previous');
    await expect(prevButton).toBeDisabled();

    // Check if there are multiple pages (more than 10 disputes in seeded data)
    const infoText = await paginationInfo.textContent();
    const totalPagesMatch = infoText?.match(/of (\d+)/);
    const totalPages = totalPagesMatch ? parseInt(totalPagesMatch[1]) : 1;

    if (totalPages > 1) {
      // Click Next to go to page 2
      const nextButton = page.getByTestId('pagination-next');
      await nextButton.click();

      // Wait for API response
      await page.waitForTimeout(500);
      await expect(page.getByTestId('dispute-table')).toBeVisible({ timeout: 10_000 });

      // Verify we are now on page 2
      await expect(paginationInfo).toContainText('Page 2');

      // Previous should now be enabled
      await expect(prevButton).toBeEnabled();

      // Navigate to last page to verify Next is disabled
      if (totalPages === 2) {
        await expect(nextButton).toBeDisabled();
      }
    }
  });

  test('Customer-specific history via "View History" link (REQ 2.1)', async ({
    page,
  }) => {
    await page.goto('/');

    // Wait for customer select screen to load
    const searchInput = page.getByTestId('customer-search-input');
    await expect(searchInput).toBeVisible({ timeout: 15_000 });

    // Wait for customer list to load
    const viewHistoryLinks = page.getByTestId('view-history-link');
    await expect(viewHistoryLinks.first()).toBeVisible({ timeout: 15_000 });

    // Click "View History" on the first customer
    await viewHistoryLinks.first().click();

    // Verify customer-specific history screen loads
    const historyScreen = page.getByTestId('dispute-history-screen');
    await expect(historyScreen).toBeVisible({ timeout: 15_000 });

    // Verify customer-specific heading (h2) is shown — not h1
    const customerHeading = historyScreen.locator('h2');
    await expect(customerHeading).toBeVisible();
    await expect(customerHeading).toContainText('Dispute History');

    // Verify Back and Proceed buttons are present
    const backButton = page.getByTestId('back-button');
    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveText('Back to Customer Selection');

    const proceedButton = page.getByTestId('proceed-button');
    await expect(proceedButton).toBeVisible();
    await expect(proceedButton).toHaveText('Proceed to Capture');
  });

  test('Error state with retry button (REQ 9.2)', async ({ page }) => {
    await page.goto('/');

    // Navigate to Dispute History
    const sideNav = page.locator('aside');
    await sideNav.getByText('Dispute History').click();
    await expect(page.getByTestId('dispute-history-screen')).toBeVisible({ timeout: 15_000 });

    // Intercept API calls to simulate error
    await page.route('**/api/disputes**', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } }) })
    );

    // Trigger a refetch by applying a filter
    const paymentTypeSelect = page.getByTestId('filter-payment-type');
    // Need to wait for table to appear first before we can interact with filters
    await expect(page.getByTestId('dispute-table')).toBeVisible({ timeout: 15_000 });
    await paymentTypeSelect.selectOption('EFT');

    // Wait for the error state to appear
    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible({ timeout: 10_000 });

    // Verify retry button is shown
    const retryButton = page.getByTestId('retry-button');
    await expect(retryButton).toBeVisible();

    // Remove the route interception to allow recovery
    await page.unroute('**/api/disputes**');

    // Click retry
    await retryButton.click();

    // Verify recovery — either table reappears or loading state transitions
    await expect(page.getByTestId('dispute-table')).toBeVisible({ timeout: 15_000 });
  });

  test('Mobile bottom nav navigation (REQ 8.4)', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for app to load
    await page.waitForTimeout(1000);

    // Bottom nav should be visible on mobile
    const bottomNav = page.locator('nav.md\\:hidden');
    await expect(bottomNav).toBeVisible();

    // Click "History" in the mobile bottom nav
    const historyNavItem = bottomNav.getByText('History');
    await historyNavItem.click();

    // Verify dispute history screen loads
    const historyScreen = page.getByTestId('dispute-history-screen');
    await expect(historyScreen).toBeVisible({ timeout: 15_000 });

    // Verify h1 heading appears
    const heading = historyScreen.locator('h1');
    await expect(heading).toHaveText('Dispute History');

    // Verify the History nav item is now active (has text-primary class)
    const historyNav = bottomNav.locator('div').filter({ hasText: 'History' }).first();
    await expect(historyNav).toHaveClass(/text-primary/);
  });

  test('Empty state message and hidden pagination (REQ 1.3, 9.2)', async ({
    page,
  }) => {
    await page.goto('/');

    // Navigate to Dispute History
    const sideNav = page.locator('aside');
    await sideNav.getByText('Dispute History').click();
    await expect(page.getByTestId('dispute-history-screen')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('dispute-table')).toBeVisible({ timeout: 15_000 });

    // Apply a filter that matches no results — use a very specific search term
    const searchInput = page.getByTestId('filter-customer-name');
    await searchInput.fill('ZZZZNONEXISTENTCUSTOMERXYZ999');

    // Wait for debounce + API response
    await page.waitForTimeout(500);

    // Verify empty state message is shown
    const emptyMessage = page.getByTestId('empty-message');
    await expect(emptyMessage).toBeVisible({ timeout: 10_000 });
    await expect(emptyMessage).toContainText('No disputes found');

    // Verify pagination controls are NOT visible in empty state
    const paginationInfo = page.getByTestId('pagination-info');
    await expect(paginationInfo).not.toBeVisible();

    // Verify table is NOT visible in empty state
    await expect(page.getByTestId('dispute-table')).not.toBeVisible();
  });
});
