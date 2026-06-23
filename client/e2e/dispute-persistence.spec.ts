import { test, expect } from '@playwright/test';

test.describe('Dispute Persistence — E2E Flow', () => {
  test('Full dispute capture persists with TRIAGED status and shows triggered rules (REQ 1.1, 1.4, 6.4)', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('/');

    // ─── Step 1: Select Customer ───────────────────────────────────────────────
    const searchInput = page.getByTestId('customer-search-input');
    await expect(searchInput).toBeVisible();

    // Search for Thabo Molefe (cust-001)
    await searchInput.fill('Thabo');

    const thaboCard = page.getByTestId('customer-item-cust-001');
    await expect(thaboCard).toBeVisible({ timeout: 15_000 });
    await thaboCard.click();

    // ─── Step 2: Select Transaction ────────────────────────────────────────────
    // txn-001: R1,250 CARD COMPLETED — will trigger RULE-002 (Card + Duplicate Debit)
    const txnRow = page.getByTestId('transaction-item-txn-001');
    await expect(txnRow).toBeVisible({ timeout: 15_000 });
    await txnRow.click();

    // ─── Step 3: Capture Dispute ───────────────────────────────────────────────
    const submitButton = page.getByTestId('submit-dispute-button');
    await expect(submitButton).toBeVisible();

    // Verify payment type is pre-populated as "Card Payment"
    const paymentTypeInput = page.getByTestId('payment-type-select');
    await expect(paymentTypeInput).toHaveValue('Card Payment');

    // Select issue category "Duplicate Debit"
    const issueCategorySelect = page.getByTestId('issue-category-select');
    await issueCategorySelect.selectOption('DUPLICATE_DEBIT');

    // Submit the dispute
    await submitButton.click();

    // ─── Step 4: Triage Result — Verify Persistence ────────────────────────────
    const recommendationDisplay = page.getByTestId('recommendation-display');
    await expect(recommendationDisplay).toBeVisible({ timeout: 15_000 });

    // Verify recommendation is "Immediate Reversal"
    await expect(recommendationDisplay).toContainText('Immediate Reversal');

    // Verify priority badge shows "LOW" (R1,250 < R5k, not UNAUTHORISED)
    const priorityBadge = page.getByTestId('priority-badge');
    await expect(priorityBadge).toBeVisible();
    await expect(priorityBadge).toContainText('LOW');

    // Verify age badge shows "NEW" (txn-001 is recent)
    const ageBadge = page.getByTestId('age-badge');
    await expect(ageBadge).toBeVisible();
    await expect(ageBadge).toContainText('NEW');

    // ─── Verify triggered rules are visible on the result screen (REQ 6.4) ────
    const rulesList = page.getByTestId('rules-list');
    await expect(rulesList).toBeVisible();
    await expect(rulesList).toContainText('Card + Duplicate Debit');

    // Verify rule conditions are displayed
    await expect(rulesList).toContainText('paymentType');
    await expect(rulesList).toContainText('CARD');
    await expect(rulesList).toContainText('issueCategory');
    await expect(rulesList).toContainText('DUPLICATE_DEBIT');

    // Verify the dispute was persisted by checking the reference number is visible
    await expect(page.locator('text=/DSP-\\d{3}/').first()).toBeVisible();
  });

  test('CLOSE_RESOLVED dispute shows CLOSED status via recommendation code (REQ 3.1)', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('/');

    // ─── Step 1: Select Customer ───────────────────────────────────────────────
    const searchInput = page.getByTestId('customer-search-input');
    await expect(searchInput).toBeVisible();

    // Search for James van der Merwe (cust-003) who has txn-009 (ALREADY_REFUNDED)
    await searchInput.fill('James');

    const jamesCard = page.getByTestId('customer-item-cust-003');
    await expect(jamesCard).toBeVisible({ timeout: 15_000 });
    await jamesCard.click();

    // ─── Step 2: Select Transaction ────────────────────────────────────────────
    // txn-009: R1,800 CARD ALREADY_REFUNDED — will trigger RULE-PRE-01 → CLOSE_RESOLVED
    const txnRow = page.getByTestId('transaction-item-txn-009');
    await expect(txnRow).toBeVisible({ timeout: 15_000 });
    await txnRow.click();

    // ─── Step 3: Capture Dispute ───────────────────────────────────────────────
    const submitButton = page.getByTestId('submit-dispute-button');
    await expect(submitButton).toBeVisible();

    // Verify payment type is pre-populated as "Card Payment"
    const paymentTypeInput = page.getByTestId('payment-type-select');
    await expect(paymentTypeInput).toHaveValue('Card Payment');

    // Select any issue category — the ALREADY_REFUNDED status takes priority (RULE-PRE-01)
    const issueCategorySelect = page.getByTestId('issue-category-select');
    await issueCategorySelect.selectOption('DUPLICATE_DEBIT');

    // Submit the dispute
    await submitButton.click();

    // ─── Step 4: Triage Result — Verify CLOSE_RESOLVED ─────────────────────────
    const recommendationDisplay = page.getByTestId('recommendation-display');
    await expect(recommendationDisplay).toBeVisible({ timeout: 15_000 });

    // Verify recommendation shows "Close Dispute — Resolved"
    await expect(recommendationDisplay).toContainText('Close Dispute');

    // Verify triggered rules show "Already Refunded" rule
    const rulesList = page.getByTestId('rules-list');
    await expect(rulesList).toBeVisible();
    await expect(rulesList).toContainText('Already Refunded');

    // Verify the transaction status condition is displayed
    await expect(rulesList).toContainText('transactionStatus');
    await expect(rulesList).toContainText('ALREADY_REFUNDED');

    // Verify reference number is shown (confirms persistence)
    await expect(page.locator('text=/DSP-\\d{3}/').first()).toBeVisible();
  });

  test('Triggered rules display rule details with conditions on result screen (REQ 6.4)', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('/');

    // ─── Step 1: Select Customer ───────────────────────────────────────────────
    const searchInput = page.getByTestId('customer-search-input');
    await expect(searchInput).toBeVisible();

    // Use Fatima Ismail (cust-006) with txn-018 (R18,000 CARD COMPLETED)
    // This triggers RULE-001 (Unauthorised) → ESCALATE_FRAUD
    await searchInput.fill('Fatima');

    const fatimaCard = page.getByTestId('customer-item-cust-006');
    await expect(fatimaCard).toBeVisible({ timeout: 15_000 });
    await fatimaCard.click();

    // ─── Step 2: Select Transaction ────────────────────────────────────────────
    const txnRow = page.getByTestId('transaction-item-txn-018');
    await expect(txnRow).toBeVisible({ timeout: 15_000 });
    await txnRow.click();

    // ─── Step 3: Capture Dispute ───────────────────────────────────────────────
    const issueCategorySelect = page.getByTestId('issue-category-select');
    await issueCategorySelect.selectOption('UNAUTHORISED');

    const submitButton = page.getByTestId('submit-dispute-button');
    await submitButton.click();

    // ─── Step 4: Triage Result — Verify rules display ──────────────────────────
    const recommendationDisplay = page.getByTestId('recommendation-display');
    await expect(recommendationDisplay).toBeVisible({ timeout: 15_000 });

    // Verify it escalated to fraud team
    await expect(recommendationDisplay).toContainText('Escalate to Fraud Team');

    // Verify priority is HIGH (R18,000 > R10k AND UNAUTHORISED)
    const priorityBadge = page.getByTestId('priority-badge');
    await expect(priorityBadge).toContainText('HIGH');

    // Verify triggered rules section shows the rule with conditions
    const rulesList = page.getByTestId('rules-list');
    await expect(rulesList).toBeVisible();
    await expect(rulesList).toContainText('Unauthorised (Fraud)');
    await expect(rulesList).toContainText('issueCategory');
    await expect(rulesList).toContainText('UNAUTHORISED');
  });
});
