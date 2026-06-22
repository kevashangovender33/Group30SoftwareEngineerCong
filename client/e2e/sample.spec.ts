import { test, expect } from '@playwright/test';

test('homepage shows the title and increments the counter', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Node Conf Starter' })).toBeVisible();

  const count = page.getByTestId('count');
  await expect(count).toHaveText('0');

  await page.getByRole('button', { name: 'Increment' }).click();
  await expect(count).toHaveText('1');
});

test('shows the backend health status', async ({ page }) => {
  await page.goto('/');

  // The Playwright config starts the API server, so the health check resolves to "healthy".
  await expect(page.getByTestId('health')).toHaveText('healthy');
});
