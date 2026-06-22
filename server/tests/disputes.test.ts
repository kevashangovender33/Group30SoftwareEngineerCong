import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import { disputesRouter } from '../src/routes/disputes.js';

// Mock Prisma
vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    transaction: {
      findUnique: vi.fn(),
    },
    dispute: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

// Mock triage engine
vi.mock('../src/services/triageEngine.js', () => ({
  evaluate: vi.fn(),
}));

import { prisma } from '../src/lib/prisma.js';
import { evaluate } from '../src/services/triageEngine.js';

// Helper to make requests to the router
function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/disputes', disputesRouter);
  // Simple error handler for tests
  app.use((err: any, _req: any, res: any, _next: any) => {
    const status = err.status || 500;
    res.status(status).json({
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message,
        status,
        ...(err.fields && { fields: err.fields }),
      },
    });
  });
  return app;
}

async function makeRequest(app: any, method: string, path: string, body?: any) {
  const http = await import('http');
  const server = http.createServer(app);

  return new Promise<{ status: number; body: any }>((resolve, reject) => {
    server.listen(0, () => {
      const address = server.address() as any;
      const port = address.port;

      const options: any = {
        hostname: 'localhost',
        port,
        path: `/disputes${path}`,
        method: method.toUpperCase(),
        headers: { 'Content-Type': 'application/json' },
      };

      const req = http.request(options, (res: any) => {
        let data = '';
        res.on('data', (chunk: string) => { data += chunk; });
        res.on('end', () => {
          server.close();
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        });
      });

      req.on('error', (e: Error) => {
        server.close();
        reject(e);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  });
}

describe('Disputes Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /disputes', () => {
    const validBody = {
      transactionId: 'txn-001',
      paymentType: 'CARD',
      issueCategory: 'DUPLICATE_DEBIT',
    };

    const mockTransaction = {
      id: 'txn-001',
      customerId: 'cust-001',
      amount: 5000,
      paymentType: 'CARD',
      status: 'COMPLETED',
      description: 'Test transaction',
      transactionDate: new Date('2025-01-01'),
      customer: { id: 'cust-001', name: 'John Doe', accountNumber: 'ACC-001' },
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

    it('should return 400 when required fields are missing', async () => {
      const app = createApp();
      const result = await makeRequest(app, 'POST', '/', {});

      expect(result.status).toBe(400);
      expect(result.body.error.code).toBe('VALIDATION_ERROR');
      expect(result.body.error.fields).toEqual(['transactionId', 'paymentType', 'issueCategory']);
    });

    it('should return 400 when transactionId is missing', async () => {
      const app = createApp();
      const result = await makeRequest(app, 'POST', '/', {
        paymentType: 'CARD',
        issueCategory: 'DUPLICATE_DEBIT',
      });

      expect(result.status).toBe(400);
      expect(result.body.error.fields).toContain('transactionId');
    });

    it('should return 422 for invalid payment type', async () => {
      const app = createApp();
      const result = await makeRequest(app, 'POST', '/', {
        transactionId: 'txn-001',
        paymentType: 'INVALID',
        issueCategory: 'DUPLICATE_DEBIT',
      });

      expect(result.status).toBe(422);
      expect(result.body.error.code).toBe('INVALID_PAYMENT_TYPE');
    });

    it('should return 422 for invalid issue category', async () => {
      const app = createApp();
      const result = await makeRequest(app, 'POST', '/', {
        transactionId: 'txn-001',
        paymentType: 'CARD',
        issueCategory: 'INVALID_CATEGORY',
      });

      expect(result.status).toBe(422);
      expect(result.body.error.code).toBe('INVALID_ISSUE_CATEGORY');
    });

    it('should return 404 when transaction not found', async () => {
      vi.mocked(prisma.transaction.findUnique).mockResolvedValue(null);

      const app = createApp();
      const result = await makeRequest(app, 'POST', '/', validBody);

      expect(result.status).toBe(404);
      expect(result.body.error.code).toBe('TRANSACTION_NOT_FOUND');
    });

    it('should return 201 with triage result on success', async () => {
      vi.mocked(prisma.transaction.findUnique).mockResolvedValue(mockTransaction as any);
      vi.mocked(evaluate).mockReturnValue(mockTriageResult as any);
      vi.mocked(prisma.dispute.count).mockResolvedValue(0);
      vi.mocked(prisma.dispute.create).mockResolvedValue({
        id: 'dispute-001',
        referenceNumber: 'DSP-001',
        status: 'TRIAGED',
      } as any);

      const app = createApp();
      const result = await makeRequest(app, 'POST', '/', validBody);

      expect(result.status).toBe(201);
      expect(result.body.disputeId).toBe('dispute-001');
      expect(result.body.referenceNumber).toBe('DSP-001');
      expect(result.body.status).toBe('TRIAGED');
      expect(result.body.triage.recommendation).toBe('Immediate Reversal');
      expect(result.body.triage.recommendationCode).toBe('IMMEDIATE_REVERSAL');
      expect(result.body.triage.priority).toBe('LOW');
      expect(result.body.triage.ageIndicator).toBe('NEW');
      expect(result.body.triage.rulesTriggered).toHaveLength(1);
    });

    it('should generate correct reference number based on count', async () => {
      vi.mocked(prisma.transaction.findUnique).mockResolvedValue(mockTransaction as any);
      vi.mocked(evaluate).mockReturnValue(mockTriageResult as any);
      vi.mocked(prisma.dispute.count).mockResolvedValue(9);
      vi.mocked(prisma.dispute.create).mockResolvedValue({
        id: 'dispute-010',
        referenceNumber: 'DSP-010',
        status: 'TRIAGED',
      } as any);

      const app = createApp();
      await makeRequest(app, 'POST', '/', validBody);

      expect(prisma.dispute.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            referenceNumber: 'DSP-010',
          }),
        }),
      );
    });

    it('should call evaluate with correct triage input', async () => {
      vi.mocked(prisma.transaction.findUnique).mockResolvedValue(mockTransaction as any);
      vi.mocked(evaluate).mockReturnValue(mockTriageResult as any);
      vi.mocked(prisma.dispute.count).mockResolvedValue(0);
      vi.mocked(prisma.dispute.create).mockResolvedValue({
        id: 'dispute-001',
        referenceNumber: 'DSP-001',
        status: 'TRIAGED',
      } as any);

      const app = createApp();
      await makeRequest(app, 'POST', '/', validBody);

      expect(evaluate).toHaveBeenCalledWith({
        paymentType: 'CARD',
        issueCategory: 'DUPLICATE_DEBIT',
        transactionStatus: 'COMPLETED',
        transactionAmount: 5000,
        transactionDate: expect.any(Date),
      });
    });
  });

  describe('GET /disputes/:id', () => {
    const mockDispute = {
      id: 'dispute-001',
      referenceNumber: 'DSP-001',
      status: 'TRIAGED',
      paymentType: 'CARD',
      issueCategory: 'DUPLICATE_DEBIT',
      priority: 'LOW',
      ageIndicator: 'NEW',
      recommendedAction: 'Immediate Reversal',
      triggeredRules: JSON.stringify([
        {
          ruleId: 'RULE-002',
          ruleName: 'Card + Duplicate Debit',
          conditions: { paymentType: 'CARD', issueCategory: 'DUPLICATE_DEBIT' },
        },
      ]),
      createdAt: new Date('2025-01-15'),
      transaction: {
        id: 'txn-001',
        amount: 5000,
        paymentType: 'CARD',
        status: 'COMPLETED',
        description: 'Test transaction',
        transactionDate: new Date('2025-01-01'),
      },
      customer: {
        id: 'cust-001',
        name: 'John Doe',
        accountNumber: 'ACC-001',
      },
    };

    it('should return 404 when dispute not found', async () => {
      vi.mocked(prisma.dispute.findUnique).mockResolvedValue(null);

      const app = createApp();
      const result = await makeRequest(app, 'GET', '/non-existent-id');

      expect(result.status).toBe(404);
      expect(result.body.error.code).toBe('DISPUTE_NOT_FOUND');
    });

    it('should return dispute details with transaction and customer', async () => {
      vi.mocked(prisma.dispute.findUnique).mockResolvedValue(mockDispute as any);

      const app = createApp();
      const result = await makeRequest(app, 'GET', '/dispute-001');

      expect(result.status).toBe(200);
      expect(result.body.disputeId).toBe('dispute-001');
      expect(result.body.referenceNumber).toBe('DSP-001');
      expect(result.body.status).toBe('TRIAGED');
      expect(result.body.paymentType).toBe('CARD');
      expect(result.body.issueCategory).toBe('DUPLICATE_DEBIT');
      expect(result.body.priority).toBe('LOW');
      expect(result.body.ageIndicator).toBe('NEW');
      expect(result.body.recommendation).toBe('Immediate Reversal');
      expect(result.body.rulesTriggered).toHaveLength(1);
      expect(result.body.rulesTriggered[0].ruleId).toBe('RULE-002');
      expect(result.body.transaction.id).toBe('txn-001');
      expect(result.body.transaction.amount).toBe(5000);
      expect(result.body.customer.id).toBe('cust-001');
      expect(result.body.customer.name).toBe('John Doe');
    });

    it('should parse triggeredRules from JSON string', async () => {
      vi.mocked(prisma.dispute.findUnique).mockResolvedValue(mockDispute as any);

      const app = createApp();
      const result = await makeRequest(app, 'GET', '/dispute-001');

      expect(result.body.rulesTriggered).toEqual([
        {
          ruleId: 'RULE-002',
          ruleName: 'Card + Duplicate Debit',
          conditions: { paymentType: 'CARD', issueCategory: 'DUPLICATE_DEBIT' },
        },
      ]);
    });
  });

  describe('POST /disputes/:id/acknowledge', () => {
    it('should return 404 when dispute not found', async () => {
      vi.mocked(prisma.dispute.findUnique).mockResolvedValue(null);

      const app = createApp();
      const result = await makeRequest(app, 'POST', '/non-existent-id/acknowledge');

      expect(result.status).toBe(404);
      expect(result.body.error.code).toBe('DISPUTE_NOT_FOUND');
    });

    it('should return acknowledgement response', async () => {
      vi.mocked(prisma.dispute.findUnique).mockResolvedValue({
        id: 'dispute-001',
        referenceNumber: 'DSP-001',
        status: 'TRIAGED',
      } as any);

      const app = createApp();
      const result = await makeRequest(app, 'POST', '/dispute-001/acknowledge');

      expect(result.status).toBe(200);
      expect(result.body.disputeId).toBe('dispute-001');
      expect(result.body.acknowledged).toBe(true);
      expect(result.body.nextAction).toBe('RETURN_TO_CAPTURE');
    });
  });
});
