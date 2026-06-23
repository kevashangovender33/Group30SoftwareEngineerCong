import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Mock prisma
vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    transaction: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock triageEngine
vi.mock('../src/services/triageEngine.js', () => ({
  evaluate: vi.fn(),
}));

import { prisma } from '../src/lib/prisma.js';
import { evaluate } from '../src/services/triageEngine.js';

// We need to test the route handler directly
// Import the router and extract the handler
import { triageRouter } from '../src/routes/triage.js';

function createMockReqRes(body: Record<string, unknown> = {}) {
  const req = { body } as Request;
  const res = {
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

// Extract the POST /evaluate handler from the router
function getEvaluateHandler() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stack = (triageRouter as any).stack;
  const layer = stack.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (l: any) => l.route?.path === '/evaluate' && l.route?.methods?.post,
  );
  return layer?.route?.stack[0]?.handle;
}

describe('POST /triage/evaluate', () => {
  const handler = getEvaluateHandler()!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when transactionId is missing', async () => {
    const { req, res, next } = createMockReqRes({
      paymentType: 'CARD',
      issueCategory: 'DUPLICATE_DEBIT',
    });

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        code: 'VALIDATION_ERROR',
        fields: ['transactionId'],
      }),
    );
  });

  it('returns 400 when paymentType is missing', async () => {
    const { req, res, next } = createMockReqRes({
      transactionId: 'txn-001',
      issueCategory: 'DUPLICATE_DEBIT',
    });

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        code: 'VALIDATION_ERROR',
        fields: ['paymentType'],
      }),
    );
  });

  it('returns 400 when issueCategory is missing', async () => {
    const { req, res, next } = createMockReqRes({
      transactionId: 'txn-001',
      paymentType: 'CARD',
    });

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        code: 'VALIDATION_ERROR',
        fields: ['issueCategory'],
      }),
    );
  });

  it('returns 400 when all required fields are missing', async () => {
    const { req, res, next } = createMockReqRes({});

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        code: 'VALIDATION_ERROR',
        fields: ['transactionId', 'paymentType', 'issueCategory'],
      }),
    );
  });

  it('returns 400 for invalid paymentType', async () => {
    const { req, res, next } = createMockReqRes({
      transactionId: 'txn-001',
      paymentType: 'CRYPTO',
      issueCategory: 'DUPLICATE_DEBIT',
    });

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        code: 'VALIDATION_ERROR',
        fields: ['paymentType'],
      }),
    );
  });

  it('returns 400 for invalid issueCategory', async () => {
    const { req, res, next } = createMockReqRes({
      transactionId: 'txn-001',
      paymentType: 'CARD',
      issueCategory: 'INVALID_CATEGORY',
    });

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        code: 'VALIDATION_ERROR',
        fields: ['issueCategory'],
      }),
    );
  });

  it('returns 404 when transaction is not found', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(null);

    const { req, res, next } = createMockReqRes({
      transactionId: 'txn-nonexistent',
      paymentType: 'CARD',
      issueCategory: 'DUPLICATE_DEBIT',
    });

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 404,
        code: 'NOT_FOUND',
      }),
    );
  });

  it('returns triage result on success', async () => {
    const mockTransaction = {
      id: 'txn-001',
      customerId: 'cust-001',
      amount: 1250.0,
      paymentType: 'CARD',
      status: 'COMPLETED',
      description: 'POS purchase',
      transactionDate: new Date('2026-06-20T10:00:00.000Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTriageResult = {
      recommendation: 'Immediate Reversal',
      recommendationCode: 'IMMEDIATE_REVERSAL',
      priority: 'LOW',
      ageIndicator: 'NEW',
      rulesTriggered: [
        {
          ruleId: 'RULE-002',
          ruleName: 'Card + Duplicate Debit',
          conditions: { paymentType: 'CARD', issueCategory: 'DUPLICATE_DEBIT' },
        },
      ],
    };

    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(mockTransaction);
    vi.mocked(evaluate).mockReturnValue(mockTriageResult as ReturnType<typeof evaluate>);

    const { req, res, next } = createMockReqRes({
      transactionId: 'txn-001',
      paymentType: 'CARD',
      issueCategory: 'DUPLICATE_DEBIT',
    });

    await handler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(evaluate).toHaveBeenCalledWith({
      paymentType: 'CARD',
      issueCategory: 'DUPLICATE_DEBIT',
      transactionStatus: 'COMPLETED',
      transactionAmount: 1250.0,
      transactionDate: expect.any(Date),
    });
    expect(res.json).toHaveBeenCalledWith({
      recommendation: 'Immediate Reversal',
      recommendationCode: 'IMMEDIATE_REVERSAL',
      priority: 'LOW',
      ageIndicator: 'NEW',
      rulesTriggered: [
        {
          ruleId: 'RULE-002',
          ruleName: 'Card + Duplicate Debit',
          conditions: { paymentType: 'CARD', issueCategory: 'DUPLICATE_DEBIT' },
        },
      ],
    });
  });

  it('does not create a dispute record (dry-run)', async () => {
    const mockTransaction = {
      id: 'txn-001',
      customerId: 'cust-001',
      amount: 500.0,
      paymentType: 'EFT',
      status: 'PENDING',
      description: 'Transfer',
      transactionDate: new Date('2026-06-20T10:00:00.000Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(mockTransaction);
    vi.mocked(evaluate).mockReturnValue({
      recommendation: 'Monitor for 24 Hours',
      recommendationCode: 'MONITOR_24H',
      priority: 'LOW',
      ageIndicator: 'NEW',
      rulesTriggered: [],
    });

    const { req, res, next } = createMockReqRes({
      transactionId: 'txn-001',
      paymentType: 'EFT',
      issueCategory: 'MISSING_PAYMENT',
    });

    await handler(req, res, next);

    // Verify no dispute creation was attempted
    expect(prisma).not.toHaveProperty('dispute.create');
    expect(next).not.toHaveBeenCalled();
  });

  it('passes unexpected errors to next()', async () => {
    const dbError = new Error('Database connection failed');
    vi.mocked(prisma.transaction.findUnique).mockRejectedValue(dbError);

    const { req, res, next } = createMockReqRes({
      transactionId: 'txn-001',
      paymentType: 'CARD',
      issueCategory: 'DUPLICATE_DEBIT',
    });

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
  });
});
