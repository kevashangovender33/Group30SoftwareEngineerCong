import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboard', () => {
  test('should navigate to Dashboard via desktop side nav and display heading', async ({ page }) => {
    await page.goto('/');

    // Click the Dashboard nav item in the sidebar
    await page.locator('aside').getByText('Dashboard').click();

    // Verify the dashboard heading is visible
    await expect(page.getByText('Dispute Analytics')).toBeVisible();

    // Verify all 4 chart cards are rendered
    await expect(page.getByTestId('chart-card-disputes-by-payment-type')).toBeVisible();
    await expect(page.getByTestId('chart-card-disputes-by-issue-category')).toBeVisible();
    await expect(page.getByTestId('chart-card-disputes-by-status')).toBeVisible();
    await expect(page.getByTestId('chart-card-disputes-by-priority')).toBeVisible();
  });

  test('should display all 4 summary cards with numeric values', async ({ page }) => {
    await page.goto('/');
    await page.locator('aside').getByText('Dashboard').click();

    // Wait for dashboard to load
    await expect(page.getByTestId('analytics-dashboard')).toBeVisible();

    // Verify summary cards
    await expect(page.getByTestId('summary-card-total-disputes')).toBeVisible();
    await expect(page.getByTestId('summary-card-open-disputes')).toBeVisible();
    await expect(page.getByTestId('summary-card-resolved-disputes')).toBeVisible();
    await expect(page.getByTestId('summary-card-high-priority')).toBeVisible();

    // Each card should have a numeric value
    const values = page.getByTestId('summary-card-value');
    const count = await values.count();
    expect(count).toBe(4);

    for (let i = 0; i < count; i++) {
      const text = await values.nth(i).textContent();
      expect(text).toMatch(/^\d/); // starts with a digit
    }
  });

  test('should render charts with canvas elements', async ({ page }) => {
    await page.goto('/');
    await page.locator('aside').getByText('Dashboard').click();

    await expect(page.getByTestId('analytics-dashboard')).toBeVisible();

    // Each chart widget should have a canvas
    const barCharts = page.getByTestId('bar-chart-widget');
    const doughnutCharts = page.getByTestId('doughnut-chart-widget');

    await expect(barCharts.first()).toBeVisible();
    await expect(doughnutCharts.first()).toBeVisible();

    // Verify canvases exist
    const canvases = page.locator('canvas');
    expect(await canvases.count()).toBeGreaterThanOrEqual(4);
  });

  test('should apply active nav styling when on dashboard screen', async ({ page }) => {
    await page.goto('/');
    await page.locator('aside').getByText('Dashboard').click();

    await expect(page.getByTestId('analytics-dashboard')).toBeVisible();

    // The Dashboard nav item should have active styling
    const dashboardNavItem = page.locator('aside').locator('div').filter({ hasText: /^Dashboard$/ });
    await expect(dashboardNavItem).toHaveClass(/bg-secondary-container/);
    await expect(dashboardNavItem).toHaveClass(/font-bold/);
  });

  test('should navigate away and back with fresh data', async ({ page }) => {
    await page.goto('/');

    // Go to dashboard
    await page.locator('aside').getByText('Dashboard').click();
    await expect(page.getByTestId('analytics-dashboard')).toBeVisible();

    // Navigate to New Dispute
    await page.locator('aside').getByText('New Dispute').click();
    await expect(page.getByTestId('analytics-dashboard')).not.toBeVisible();

    // Navigate back to dashboard
    await page.locator('aside').getByText('Dashboard').click();
    await expect(page.getByTestId('analytics-dashboard')).toBeVisible();

    // Charts should still be rendered
    expect(await page.locator('canvas').count()).toBeGreaterThanOrEqual(4);
  });

  test('should show loading state initially', async ({ page }) => {
    // Intercept the analytics API to delay response
    await page.route('**/api/disputes/analytics', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          paymentType: [
            { label: 'Card', count: 1 },
            { label: 'EFT', count: 1 },
            { label: 'Internal Transfer', count: 1 },
          ],
          issueCategory: [],
          status: [
            { label: 'Open', count: 1 },
            { label: 'Triaged', count: 1 },
            { label: 'Closed', count: 1 },
          ],
          priority: [
            { label: 'High', count: 1 },
            { label: 'Medium', count: 1 },
            { label: 'Low', count: 1 },
          ],
          summary: { totalDisputes: 3, openDisputes: 1, resolvedDisputes: 1, highPriorityDisputes: 1 },
        }),
      });
    });

    await page.goto('/');
    await page.locator('aside').getByText('Dashboard').click();

    // Should show loading state
    await expect(page.getByTestId('analytics-loading')).toBeVisible();

    // Eventually should show dashboard
    await expect(page.getByTestId('analytics-dashboard')).toBeVisible({ timeout: 5000 });
  });

  test('should show error state and retry on API failure', async ({ page }) => {
    let callCount = 0;

    await page.route('**/api/disputes/analytics', async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { message: 'fail' } }) });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            paymentType: [
              { label: 'Card', count: 2 },
              { label: 'EFT', count: 1 },
              { label: 'Internal Transfer', count: 0 },
            ],
            issueCategory: [{ label: 'Duplicate Debit', count: 2 }],
            status: [
              { label: 'Open', count: 1 },
              { label: 'Triaged', count: 1 },
              { label: 'Closed', count: 1 },
            ],
            priority: [
              { label: 'High', count: 1 },
              { label: 'Medium', count: 1 },
              { label: 'Low', count: 1 },
            ],
            summary: { totalDisputes: 3, openDisputes: 1, resolvedDisputes: 1, highPriorityDisputes: 1 },
          }),
        });
      }
    });

    await page.goto('/');
    await page.locator('aside').getByText('Dashboard').click();

    // Should show error
    await expect(page.getByTestId('analytics-error')).toBeVisible();
    await expect(page.getByTestId('analytics-retry-button')).toBeVisible();

    // Click retry
    await page.getByTestId('analytics-retry-button').click();

    // Should recover
    await expect(page.getByTestId('analytics-dashboard')).toBeVisible({ timeout: 5000 });
  });
});
