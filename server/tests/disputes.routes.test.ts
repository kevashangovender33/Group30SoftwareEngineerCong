import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock all dependencies
vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    transaction: { findUnique: vi.fn() },
    dispute: { count: vi.fn() },
  },
}));

vi.mock('../src/repositories/disputeRepository.js', () => ({
  disputeRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
  },
}));

vi.mock('../src/services/triageEngine.js', () => ({
  evaluate: vi.fn(),
}));

vi.mock('../src/services/statusLifecycle.js', () => ({
  determineInitialStatus: vi.fn(),
}));

vi.mock('../src/services/disputeQueryValidator.js', () => ({
  validateDisputeQueryParams: vi.fn(),
}));

vi.mock('../src/services/disputeQueryService.js', () => ({
  queryDisputes: vi.fn(),
}));

import { prisma } from '../src/lib/prisma.js';
import { disputeRepository } from '../src/repositories/disputeRepository.js';
import { evaluate } from '../src/services/triageEngine.js';
import { determineInitialStatus } from '../src/services/statusLifecycle.js';
import { validateDisputeQueryParams } from '../src/services/disputeQueryValidator.js';
import { queryDisputes } from '../src/services/disputeQueryService.js';
import { disputesRouter } from '../src/routes/disputes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

// Create test Express app
function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/disputes', disputesRouter);
  app.use(errorHandler);
  return app;
}

describe('Disputes Route Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/disputes', () => {
    const validBody = {
      transactionId: 'txn-001',
      paymentType: 'CARD',
      issueCategory: 'DUPLICATE_DEBIT',
    };

    const mockTransaction = {
      id: 'txn-001',
      customerId: 'cust-001',
      amount: 7500,
      paymentType: 'CARD',
      status: 'COMPLETED',
      description: 'Test purchase',
      transactionDate: new Date('2025-01-10'),
      customer: { id: 'cust-001', name: 'Jane Smith', accountNumber: 'ACC-101' },
    };

    const mockTriageResult = {
      recommendation: 'Immediate Reversal',
      recommendationCode: 'IMMEDIATE_REVERSAL',
      priority: 'MEDIUM',
      ageIndicator: 'NEW',
      rulesTriggered: [
        {
          ruleId: 'RULE-002',
          ruleName: 'Card + Duplicate Debit',
          conditions: { paymentType: 'CARD', issueCategory: 'DUPLICATE_DEBIT' },
        },
      ],
    };

    const mockCreatedDispute = {
      id: 'dispute-001',
      referenceNumber: 'DSP-001',
      customerId: 'cust-001',
      transactionId: 'txn-001',
      paymentType: 'CARD',
      issueCategory: 'DUPLICATE_DEBIT',
      status: 'TRIAGED',
      priority: 'MEDIUM',
      ageIndicator: 'NEW',
      recommendedAction: 'Immediate Reversal',
      resolvedAt: null,
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-15'),
      triggeredRules: [
        {
          id: 'rule-rec-001',
          disputeId: 'dispute-001',
          ruleId: 'RULE-002',
          ruleName: 'Card + Duplicate Debit',
          conditions: { paymentType: 'CARD', issueCategory: 'DUPLICATE_DEBIT' },
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-01-15'),
        },
      ],
      customer: { id: 'cust-001', name: 'Jane Smith', accountNumber: 'ACC-101', email: 'jane@example.com', createdAt: new Date(), updatedAt: new Date() },
      transaction: { id: 'txn-001', customerId: 'cust-001', amount: 7500, paymentType: 'CARD', status: 'COMPLETED', description: 'Test purchase', transactionDate: new Date('2025-01-10'), createdAt: new Date(), updatedAt: new Date() },
    };

    // Validates: Requirements 1.1, 6.1, 6.4
    it('should return 201 with triggeredRules as objects in the response', async () => {
      vi.mocked(prisma.transaction.findUnique).mockResolvedValue(mockTransaction as any);
      vi.mocked(evaluate).mockReturnValue(mockTriageResult as any);
      vi.mocked(determineInitialStatus).mockReturnValue({ status: 'TRIAGED', resolvedAt: null });
      vi.mocked(prisma.dispute.count).mockResolvedValue(0);
      vi.mocked(disputeRepository.create).mockResolvedValue(mockCreatedDispute as any);

      const app = createApp();
      const res = await request(app).post('/api/disputes').send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.disputeId).toBe('dispute-001');
      expect(res.body.referenceNumber).toBe('DSP-001');
      expect(res.body.status).toBe('TRIAGED');
      expect(res.body.triage).toBeDefined();
      expect(res.body.triage.recommendation).toBe('Immediate Reversal');
      expect(res.body.triage.recommendationCode).toBe('IMMEDIATE_REVERSAL');
      expect(res.body.triage.priority).toBe('MEDIUM');
      expect(res.body.triage.ageIndicator).toBe('NEW');
      // triggeredRules should be objects with ruleId, ruleName, conditions
      expect(res.body.triage.rulesTriggered).toHaveLength(1);
      expect(res.body.triage.rulesTriggered[0]).toEqual({
        ruleId: 'RULE-002',
        ruleName: 'Card + Duplicate Debit',
        conditions: { paymentType: 'CARD', issueCategory: 'DUPLICATE_DEBIT' },
      });
    });

    // Validates: Requirement 6.1
    it('should return 400 when transactionId is missing', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/disputes')
        .send({ paymentType: 'CARD', issueCategory: 'DUPLICATE_DEBIT' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.fields).toContain('transactionId');
    });

    it('should return 400 when all required fields are missing', async () => {
      const app = createApp();
      const res = await request(app).post('/api/disputes').send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.fields).toEqual(
        expect.arrayContaining(['transactionId', 'paymentType', 'issueCategory'])
      );
    });

    // Validates: Requirement 6.1
    it('should return 422 for invalid paymentType', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/disputes')
        .send({ transactionId: 'txn-001', paymentType: 'CRYPTO', issueCategory: 'DUPLICATE_DEBIT' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_PAYMENT_TYPE');
    });

    // Validates: Requirement 6.1
    it('should return 422 for invalid issueCategory', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/disputes')
        .send({ transactionId: 'txn-001', paymentType: 'CARD', issueCategory: 'HACKED' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_ISSUE_CATEGORY');
    });
  });

  describe('GET /api/disputes', () => {
    const mockDisputeList = [
      {
        id: 'dispute-001',
        referenceNumber: 'DSP-001',
        status: 'TRIAGED',
        priority: 'MEDIUM',
        ageIndicator: 'NEW',
        paymentType: 'CARD',
        issueCategory: 'DUPLICATE_DEBIT',
        recommendedAction: 'Immediate Reversal',
        createdAt: '2025-01-15T00:00:00.000Z',
        customerName: 'Jane Smith',
        transactionAmount: 7500,
        triggeredRuleCount: 1,
      },
      {
        id: 'dispute-002',
        referenceNumber: 'DSP-002',
        status: 'OPEN',
        priority: 'HIGH',
        ageIndicator: 'AGING',
        paymentType: 'EFT',
        issueCategory: 'UNAUTHORISED',
        recommendedAction: 'Escalate to Fraud Team',
        createdAt: '2025-01-10T00:00:00.000Z',
        customerName: 'Bob Johnson',
        transactionAmount: 15000,
        triggeredRuleCount: 1,
      },
    ];

    // Validates: Requirements 7.1, 7.3, 10.4
    it('should return list with customerName and transactionAmount', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { sortBy: 'createdAt', sortOrder: 'desc', page: 1, pageSize: 10 },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: mockDisputeList,
        totalCount: 2,
        page: 1,
        totalPages: 1,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes');

      expect(res.status).toBe(200);
      expect(res.body.disputes).toHaveLength(2);
      expect(res.body.disputes[0].customerName).toBe('Jane Smith');
      expect(res.body.disputes[0].transactionAmount).toBe(7500);
      expect(res.body.disputes[1].customerName).toBe('Bob Johnson');
      expect(res.body.disputes[1].transactionAmount).toBe(15000);
      expect(res.body.totalCount).toBe(2);
      expect(res.body.page).toBe(1);
      expect(res.body.totalPages).toBe(1);
    });

    // Validates: Requirement 10.5
    it('should filter by status=OPEN correctly', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { status: 'OPEN', sortBy: 'createdAt', sortOrder: 'desc', page: 1, pageSize: 10 },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: [mockDisputeList[1]],
        totalCount: 1,
        page: 1,
        totalPages: 1,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?status=OPEN');

      expect(res.status).toBe(200);
      expect(res.body.disputes).toHaveLength(1);
      expect(res.body.disputes[0].status).toBe('OPEN');
    });

    // Validates: Requirement 10.5
    it('should return 400 for invalid status query parameter', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: false,
        error: {
          field: 'status',
          message: "Invalid value for 'status': must be OPEN, TRIAGED, or CLOSED",
        },
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?status=INVALID');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_QUERY_PARAM');
      expect(res.body.error.field).toBe('status');
    });

    // Validates: Requirement 10.6
    it('should return empty array when no disputes match filter', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { status: 'CLOSED', sortBy: 'createdAt', sortOrder: 'desc', page: 1, pageSize: 10 },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: [],
        totalCount: 0,
        page: 1,
        totalPages: 0,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?status=CLOSED');

      expect(res.status).toBe(200);
      expect(res.body.disputes).toEqual([]);
      expect(res.body.totalCount).toBe(0);
    });
  });

  describe('GET /api/disputes/:id', () => {
    const mockFullDispute = {
      id: 'dispute-001',
      referenceNumber: 'DSP-001',
      customerId: 'cust-001',
      transactionId: 'txn-001',
      paymentType: 'CARD',
      issueCategory: 'DUPLICATE_DEBIT',
      status: 'TRIAGED',
      priority: 'MEDIUM',
      ageIndicator: 'NEW',
      recommendedAction: 'Immediate Reversal',
      createdAt: new Date('2025-01-15'),
      resolvedAt: null,
      updatedAt: new Date('2025-01-15'),
      triggeredRules: [
        {
          id: 'rule-rec-001',
          disputeId: 'dispute-001',
          ruleId: 'RULE-002',
          ruleName: 'Card + Duplicate Debit',
          conditions: { paymentType: 'CARD', issueCategory: 'DUPLICATE_DEBIT' },
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-01-15'),
        },
      ],
      transaction: {
        id: 'txn-001',
        customerId: 'cust-001',
        amount: 7500,
        paymentType: 'CARD',
        status: 'COMPLETED',
        description: 'Test purchase',
        transactionDate: new Date('2025-01-10'),
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-10'),
      },
      customer: {
        id: 'cust-001',
        name: 'Jane Smith',
        email: 'jane@example.com',
        accountNumber: 'ACC-101',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    // Validates: Requirements 6.2, 7.1
    it('should return full dispute with triggeredRules array', async () => {
      vi.mocked(disputeRepository.findById).mockResolvedValue(mockFullDispute as any);

      const app = createApp();
      const res = await request(app).get('/api/disputes/dispute-001');

      expect(res.status).toBe(200);
      expect(res.body.disputeId).toBe('dispute-001');
      expect(res.body.referenceNumber).toBe('DSP-001');
      expect(res.body.status).toBe('TRIAGED');
      expect(res.body.paymentType).toBe('CARD');
      expect(res.body.issueCategory).toBe('DUPLICATE_DEBIT');
      expect(res.body.priority).toBe('MEDIUM');
      expect(res.body.ageIndicator).toBe('NEW');
      expect(res.body.recommendation).toBe('Immediate Reversal');
      // triggeredRules should be an array of objects with ruleId, ruleName, conditions
      expect(res.body.rulesTriggered).toHaveLength(1);
      expect(res.body.rulesTriggered[0]).toEqual({
        ruleId: 'RULE-002',
        ruleName: 'Card + Duplicate Debit',
        conditions: { paymentType: 'CARD', issueCategory: 'DUPLICATE_DEBIT' },
      });
      // Verify transaction and customer info
      expect(res.body.transaction.id).toBe('txn-001');
      expect(res.body.transaction.amount).toBe(7500);
      expect(res.body.customer.id).toBe('cust-001');
      expect(res.body.customer.name).toBe('Jane Smith');
      expect(res.body.customer.accountNumber).toBe('ACC-101');
      expect(res.body.createdAt).toBeDefined();
    });

    // Validates: Requirement 6.2
    it('should return 404 for unknown dispute ID', async () => {
      vi.mocked(disputeRepository.findById).mockResolvedValue(null);

      const app = createApp();
      const res = await request(app).get('/api/disputes/unknown-id');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('DISPUTE_NOT_FOUND');
    });
  });
});
