import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3001/api';

test.describe('Dispute List API E2E', () => {
  test('GET /api/disputes returns seeded disputes', async ({ request }) => {
    const response = await request.get(`${API_BASE}/disputes`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.disputes).toBeDefined();
    expect(body.disputes.length).toBeGreaterThanOrEqual(1);

    // Verify response shape matches Requirement 7.1
    const firstDispute = body.disputes[0];
    expect(firstDispute).toHaveProperty('id');
    expect(firstDispute).toHaveProperty('referenceNumber');
    expect(firstDispute).toHaveProperty('status');
    expect(firstDispute).toHaveProperty('priority');
    expect(firstDispute).toHaveProperty('ageIndicator');
    expect(firstDispute).toHaveProperty('paymentType');
    expect(firstDispute).toHaveProperty('issueCategory');
    expect(firstDispute).toHaveProperty('recommendedAction');
    expect(firstDispute).toHaveProperty('createdAt');
    expect(firstDispute).toHaveProperty('customerName');
    expect(firstDispute).toHaveProperty('transactionAmount');
    expect(firstDispute).toHaveProperty('triggeredRuleCount');
  });

  test('GET /api/disputes?status=TRIAGED returns only TRIAGED disputes', async ({ request }) => {
    const response = await request.get(`${API_BASE}/disputes?status=TRIAGED`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.disputes).toBeDefined();
    expect(body.disputes.length).toBeGreaterThanOrEqual(1);

    // Requirement 7.2: filter results to only disputes matching that status
    for (const dispute of body.disputes) {
      expect(dispute.status).toBe('TRIAGED');
    }

    // Requirement 7.3: each record includes customerName, transactionAmount, triggeredRuleCount
    const firstDispute = body.disputes[0];
    expect(firstDispute.customerName).toBeDefined();
    expect(typeof firstDispute.customerName).toBe('string');
    expect(firstDispute.transactionAmount).toBeDefined();
    expect(typeof firstDispute.transactionAmount).toBe('number');
    expect(firstDispute.triggeredRuleCount).toBeDefined();
    expect(typeof firstDispute.triggeredRuleCount).toBe('number');
  });

  test('GET /api/disputes?status=INVALID returns 400', async ({ request }) => {
    // Requirement 7.5: invalid status query parameter returns HTTP 400
    const response = await request.get(`${API_BASE}/disputes?status=INVALID`);
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe('INVALID_STATUS');
  });
});
