import { test, expect } from '@playwright/test';

test.describe('Dispute Triage — Full Journey', () => {
  test('Happy Path — Card + Duplicate Debit → Immediate Reversal (TC-001)', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('/');

    // ─── Step 1: Select Customer ───────────────────────────────────────────────
    const searchInput = page.getByTestId('customer-search-input');
    await expect(searchInput).toBeVisible();

    // Type "Thabo" in the search input
    await searchInput.fill('Thabo');

    // Wait for customer list to load and verify Thabo Molefe appears
    const thaboCard = page.getByTestId('customer-item-cust-001');
    await expect(thaboCard).toBeVisible({ timeout: 15_000 });
    await expect(thaboCard).toContainText('Thabo Molefe');

    // Click on customer "Thabo Molefe"
    await thaboCard.click();

    // ─── Step 2: Select Transaction ────────────────────────────────────────────
    // Verify transaction table appears (Step 2)
    const txnRow = page.getByTestId('transaction-item-txn-001');
    await expect(txnRow).toBeVisible({ timeout: 15_000 });

    // Click on txn-001 (R1,250 CARD COMPLETED)
    await txnRow.click();

    // ─── Step 3: Capture Dispute ───────────────────────────────────────────────
    // Verify dispute form appears (Step 3)
    const submitButton = page.getByTestId('submit-dispute-button');
    await expect(submitButton).toBeVisible();

    // Verify payment type is pre-populated as "Card Payment"
    const paymentTypeInput = page.getByTestId('payment-type-select');
    await expect(paymentTypeInput).toHaveValue('Card Payment');

    // Select issue category "Duplicate Debit" (DUPLICATE_DEBIT)
    const issueCategorySelect = page.getByTestId('issue-category-select');
    await issueCategorySelect.selectOption('DUPLICATE_DEBIT');

    // Click "Run Triage Engine" submit button
    await submitButton.click();

    // ─── Step 4: Triage Result ─────────────────────────────────────────────────
    // Wait for triage result screen (Step 4)
    const recommendationDisplay = page.getByTestId('recommendation-display');
    await expect(recommendationDisplay).toBeVisible({ timeout: 15_000 });

    // Verify recommendation "Immediate Reversal" is displayed
    await expect(recommendationDisplay).toContainText('Immediate Reversal');

    // Verify priority badge shows "Low" (R1,250 < R5k, not UNAUTHORISED)
    const priorityBadge = page.getByTestId('priority-badge');
    await expect(priorityBadge).toBeVisible();
    await expect(priorityBadge).toContainText('LOW');

    // Verify age badge shows "New" (txn-001 is 2 days old)
    const ageBadge = page.getByTestId('age-badge');
    await expect(ageBadge).toBeVisible();
    await expect(ageBadge).toContainText('NEW');

    // Verify rules list shows rule info
    const rulesList = page.getByTestId('rules-list');
    await expect(rulesList).toBeVisible();
    await expect(rulesList).toContainText('Card + Duplicate Debit');

    // Click "Log New Dispute"
    const newDisputeButton = page.getByTestId('new-dispute-button');
    await expect(newDisputeButton).toBeVisible();
    await newDisputeButton.click();

    // ─── Verify Return to Step 1 ───────────────────────────────────────────────
    // Verify customer search input is visible again (back to Step 1)
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
  });

  test('Fraud Escalation — Unauthorised Card Transaction (TC-074)', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // ─── Step 1: Select Customer ───────────────────────────────────────────────
    const searchInput = page.getByTestId('customer-search-input');
    await expect(searchInput).toBeVisible();

    // Search for "Fatima"
    await searchInput.fill('Fatima');

    // Select Fatima Ismail (cust-006)
    const fatimaCard = page.getByTestId('customer-item-cust-006');
    await expect(fatimaCard).toBeVisible({ timeout: 15_000 });
    await expect(fatimaCard).toContainText('Fatima Ismail');
    await fatimaCard.click();

    // ─── Step 2: Select Transaction ────────────────────────────────────────────
    // Select txn-018 (R18,000 CARD — unauthorised online purchase)
    const txnRow = page.getByTestId('transaction-item-txn-018');
    await expect(txnRow).toBeVisible({ timeout: 15_000 });
    await txnRow.click();

    // ─── Step 3: Capture Dispute ───────────────────────────────────────────────
    // Verify payment type is pre-populated as "Card Payment"
    const paymentTypeInput = page.getByTestId('payment-type-select');
    await expect(paymentTypeInput).toHaveValue('Card Payment');

    // Select issue category "Unauthorised Transaction" (UNAUTHORISED)
    const issueCategorySelect = page.getByTestId('issue-category-select');
    await issueCategorySelect.selectOption('UNAUTHORISED');

    // Submit the dispute
    const submitButton = page.getByTestId('submit-dispute-button');
    await submitButton.click();

    // ─── Step 4: Triage Result ─────────────────────────────────────────────────
    // Verify recommendation contains "Escalate to Fraud Team"
    const recommendationDisplay = page.getByTestId('recommendation-display');
    await expect(recommendationDisplay).toBeVisible({ timeout: 15_000 });
    await expect(recommendationDisplay).toContainText('Escalate to Fraud Team');

    // Verify priority badge shows "High" (R18,000 > R10k AND UNAUTHORISED)
    const priorityBadge = page.getByTestId('priority-badge');
    await expect(priorityBadge).toBeVisible();
    await expect(priorityBadge).toContainText('HIGH');
  });

  test('Validation Error — Submit without selecting issue category', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // ─── Step 1: Select Customer ───────────────────────────────────────────────
    const searchInput = page.getByTestId('customer-search-input');
    await expect(searchInput).toBeVisible();

    // Search for "Thabo"
    await searchInput.fill('Thabo');

    // Select Thabo Molefe
    const thaboCard = page.getByTestId('customer-item-cust-001');
    await expect(thaboCard).toBeVisible({ timeout: 15_000 });
    await thaboCard.click();

    // ─── Step 2: Select Transaction ────────────────────────────────────────────
    const txnRow = page.getByTestId('transaction-item-txn-001');
    await expect(txnRow).toBeVisible({ timeout: 15_000 });
    await txnRow.click();

    // ─── Step 3: Attempt to submit without selecting issue category ─────────────
    // Verify we're on the capture form
    const heading = page.getByRole('heading', { name: /Capture Dispute/i });
    await expect(heading).toBeVisible();

    // Click submit WITHOUT selecting an issue category
    const submitButton = page.getByTestId('submit-dispute-button');
    await submitButton.click();

    // Verify validation error message appears
    const errorMessage = page.getByTestId('issue-category-error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText('Issue category is required');

    // Verify we're still on the capture form (form did not submit)
    await expect(heading).toBeVisible();
    await expect(submitButton).toBeVisible();
  });
});
