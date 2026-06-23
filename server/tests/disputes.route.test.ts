import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock dependencies
vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    transaction: { findUnique: vi.fn() },
    dispute: { count: vi.fn(), findUnique: vi.fn() },
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

import { validateDisputeQueryParams } from '../src/services/disputeQueryValidator.js';
import { queryDisputes } from '../src/services/disputeQueryService.js';
import { disputesRouter } from '../src/routes/disputes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/disputes', disputesRouter);
  app.use(errorHandler);
  return app;
}

describe('GET /api/disputes route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDisputes = [
    {
      id: 'dispute-001',
      referenceNumber: 'DSP-001',
      status: 'OPEN',
      priority: 'HIGH',
      ageIndicator: 'NEW',
      paymentType: 'CARD',
      issueCategory: 'DUPLICATE_DEBIT',
      recommendedAction: 'Immediate Reversal',
      createdAt: '2025-01-15T00:00:00.000Z',
      customerName: 'Alice Smith',
      transactionAmount: 5000,
      triggeredRuleCount: 2,
    },
    {
      id: 'dispute-002',
      referenceNumber: 'DSP-002',
      status: 'TRIAGED',
      priority: 'MEDIUM',
      ageIndicator: 'AGING',
      paymentType: 'EFT',
      issueCategory: 'UNAUTHORISED',
      recommendedAction: 'Escalate to Fraud Team',
      createdAt: '2025-01-10T00:00:00.000Z',
      customerName: 'Bob Johnson',
      transactionAmount: 15000,
      triggeredRuleCount: 1,
    },
    {
      id: 'dispute-003',
      referenceNumber: 'DSP-003',
      status: 'CLOSED',
      priority: 'LOW',
      ageIndicator: 'OVERDUE',
      paymentType: 'INTERNAL',
      issueCategory: 'MISSING_PAYMENT',
      recommendedAction: 'No Action Required',
      createdAt: '2025-01-05T00:00:00.000Z',
      customerName: 'Charlie Brown',
      transactionAmount: 250,
      triggeredRuleCount: 0,
    },
  ];

  // --- Successful GET with default params (Requirements: 10.3, 10.4) ---

  describe('successful GET with default params', () => {
    it('returns 200 with paginated results', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { sortBy: 'createdAt', sortOrder: 'desc', page: 1, pageSize: 10 },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: mockDisputes,
        totalCount: 3,
        page: 1,
        totalPages: 1,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes');

      expect(res.status).toBe(200);
      expect(res.body.disputes).toHaveLength(3);
      expect(res.body.totalCount).toBe(3);
      expect(res.body.page).toBe(1);
      expect(res.body.totalPages).toBe(1);
    });

    it('passes query params to validator', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { sortBy: 'createdAt', sortOrder: 'desc', page: 1, pageSize: 10 },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: [],
        totalCount: 0,
        page: 1,
        totalPages: 0,
      });

      const app = createApp();
      await request(app).get('/api/disputes?status=OPEN&page=2');

      expect(validateDisputeQueryParams).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'OPEN', page: '2' }),
      );
    });
  });

  // --- Filtering by status (Requirements: 10.3) ---

  describe('filtering by status', () => {
    it('returns only OPEN disputes when status=OPEN', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { status: 'OPEN', sortBy: 'createdAt', sortOrder: 'desc', page: 1, pageSize: 10 },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: [mockDisputes[0]],
        totalCount: 1,
        page: 1,
        totalPages: 1,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?status=OPEN');

      expect(res.status).toBe(200);
      expect(res.body.disputes).toHaveLength(1);
      expect(res.body.disputes[0].status).toBe('OPEN');
      expect(queryDisputes).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'OPEN' }),
      );
    });
  });

  // --- Filtering by priority (Requirements: 10.3) ---

  describe('filtering by priority', () => {
    it('returns only HIGH priority disputes', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { priority: 'HIGH', sortBy: 'createdAt', sortOrder: 'desc', page: 1, pageSize: 10 },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: [mockDisputes[0]],
        totalCount: 1,
        page: 1,
        totalPages: 1,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?priority=HIGH');

      expect(res.status).toBe(200);
      expect(res.body.disputes).toHaveLength(1);
      expect(res.body.disputes[0].priority).toBe('HIGH');
    });
  });

  // --- Filtering by paymentType (Requirements: 10.3) ---

  describe('filtering by paymentType', () => {
    it('returns only EFT disputes', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { paymentType: 'EFT', sortBy: 'createdAt', sortOrder: 'desc', page: 1, pageSize: 10 },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: [mockDisputes[1]],
        totalCount: 1,
        page: 1,
        totalPages: 1,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?paymentType=EFT');

      expect(res.status).toBe(200);
      expect(res.body.disputes).toHaveLength(1);
      expect(res.body.disputes[0].paymentType).toBe('EFT');
    });
  });

  // --- Filtering by issueCategory (Requirements: 10.3) ---

  describe('filtering by issueCategory', () => {
    it('returns only MISSING_PAYMENT disputes', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { issueCategory: 'MISSING_PAYMENT', sortBy: 'createdAt', sortOrder: 'desc', page: 1, pageSize: 10 },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: [mockDisputes[2]],
        totalCount: 1,
        page: 1,
        totalPages: 1,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?issueCategory=MISSING_PAYMENT');

      expect(res.status).toBe(200);
      expect(res.body.disputes).toHaveLength(1);
      expect(res.body.disputes[0].issueCategory).toBe('MISSING_PAYMENT');
    });
  });

  // --- Customer name search (Requirements: 10.3) ---

  describe('customer name search', () => {
    it('returns disputes matching case-insensitive partial name', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { customerName: 'alice', sortBy: 'createdAt', sortOrder: 'desc', page: 1, pageSize: 10 },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: [mockDisputes[0]],
        totalCount: 1,
        page: 1,
        totalPages: 1,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?customerName=alice');

      expect(res.status).toBe(200);
      expect(res.body.disputes).toHaveLength(1);
      expect(res.body.disputes[0].customerName).toBe('Alice Smith');
      expect(queryDisputes).toHaveBeenCalledWith(
        expect.objectContaining({ customerName: 'alice' }),
      );
    });
  });

  // --- Date range filtering (Requirements: 10.3) ---

  describe('date range filtering', () => {
    it('filters by startDate and endDate', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: {
          startDate: '2025-01-10',
          endDate: '2025-01-15',
          sortBy: 'createdAt',
          sortOrder: 'desc',
          page: 1,
          pageSize: 10,
        },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: [mockDisputes[0], mockDisputes[1]],
        totalCount: 2,
        page: 1,
        totalPages: 1,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?startDate=2025-01-10&endDate=2025-01-15');

      expect(res.status).toBe(200);
      expect(res.body.disputes).toHaveLength(2);
      expect(queryDisputes).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2025-01-10', endDate: '2025-01-15' }),
      );
    });
  });

  // --- Sorting (Requirements: 10.3, 10.4) ---

  describe('sorting', () => {
    it('sorts by createdAt ascending', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { sortBy: 'createdAt', sortOrder: 'asc', page: 1, pageSize: 10 },
      });
      const sorted = [...mockDisputes].reverse();
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: sorted,
        totalCount: 3,
        page: 1,
        totalPages: 1,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?sortBy=createdAt&sortOrder=asc');

      expect(res.status).toBe(200);
      expect(queryDisputes).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'createdAt', sortOrder: 'asc' }),
      );
    });

    it('sorts by priority descending', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { sortBy: 'priority', sortOrder: 'desc', page: 1, pageSize: 10 },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: [mockDisputes[2], mockDisputes[1], mockDisputes[0]],
        totalCount: 3,
        page: 1,
        totalPages: 1,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?sortBy=priority&sortOrder=desc');

      expect(res.status).toBe(200);
      expect(queryDisputes).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'priority', sortOrder: 'desc' }),
      );
    });

    it('sorts by status ascending', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { sortBy: 'status', sortOrder: 'asc', page: 1, pageSize: 10 },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: mockDisputes,
        totalCount: 3,
        page: 1,
        totalPages: 1,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?sortBy=status&sortOrder=asc');

      expect(res.status).toBe(200);
      expect(queryDisputes).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'status', sortOrder: 'asc' }),
      );
    });
  });

  // --- Pagination (Requirements: 10.4) ---

  describe('pagination', () => {
    it('returns correct page and totalPages metadata', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { sortBy: 'createdAt', sortOrder: 'desc', page: 2, pageSize: 2 },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: [mockDisputes[2]],
        totalCount: 3,
        page: 2,
        totalPages: 2,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?page=2&pageSize=2');

      expect(res.status).toBe(200);
      expect(res.body.disputes).toHaveLength(1);
      expect(res.body.page).toBe(2);
      expect(res.body.totalPages).toBe(2);
      expect(res.body.totalCount).toBe(3);
    });

    it('respects custom pageSize', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { sortBy: 'createdAt', sortOrder: 'desc', page: 1, pageSize: 1 },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: [mockDisputes[0]],
        totalCount: 3,
        page: 1,
        totalPages: 3,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?pageSize=1');

      expect(res.status).toBe(200);
      expect(res.body.disputes).toHaveLength(1);
      expect(res.body.totalPages).toBe(3);
    });
  });

  // --- Validation errors: invalid enum values (Requirements: 10.5) ---

  describe('validation errors - invalid enum values', () => {
    it('returns 400 for invalid status value', async () => {
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
      expect(res.body.error.message).toContain('status');
    });

    it('returns 400 for invalid priority value', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: false,
        error: {
          field: 'priority',
          message: "Invalid value for 'priority': must be HIGH, MEDIUM, or LOW",
        },
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?priority=CRITICAL');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_QUERY_PARAM');
      expect(res.body.error.field).toBe('priority');
    });

    it('returns 400 for invalid paymentType value', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: false,
        error: {
          field: 'paymentType',
          message: "Invalid value for 'paymentType': must be CARD, EFT, or INTERNAL",
        },
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?paymentType=CRYPTO');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_QUERY_PARAM');
      expect(res.body.error.field).toBe('paymentType');
    });

    it('returns 400 for invalid issueCategory value', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: false,
        error: {
          field: 'issueCategory',
          message: "Invalid value for 'issueCategory': must be DUPLICATE_DEBIT, FAILED_TRANSFER, MISSING_PAYMENT, UNAUTHORISED, INCORRECT_AMOUNT, or CARD_DISPUTE",
        },
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?issueCategory=HACKED');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_QUERY_PARAM');
      expect(res.body.error.field).toBe('issueCategory');
    });
  });

  // --- Validation errors: invalid date format (Requirements: 10.5) ---

  describe('validation errors - invalid date format', () => {
    it('returns 400 for invalid startDate format', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: false,
        error: {
          field: 'startDate',
          message: "Invalid date format for 'startDate': must be YYYY-MM-DD",
        },
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?startDate=01-15-2025');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_QUERY_PARAM');
      expect(res.body.error.field).toBe('startDate');
      expect(res.body.error.message).toContain('YYYY-MM-DD');
    });

    it('returns 400 for invalid endDate format', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: false,
        error: {
          field: 'endDate',
          message: "Invalid date format for 'endDate': must be YYYY-MM-DD",
        },
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?endDate=not-a-date');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_QUERY_PARAM');
      expect(res.body.error.field).toBe('endDate');
    });
  });

  // --- Validation errors: startDate > endDate (Requirements: 10.5) ---

  describe('validation errors - startDate > endDate', () => {
    it('returns 400 when startDate is after endDate', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: false,
        error: {
          field: 'startDate',
          message: 'startDate must be before or equal to endDate',
        },
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?startDate=2025-01-20&endDate=2025-01-10');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_QUERY_PARAM');
      expect(res.body.error.field).toBe('startDate');
      expect(res.body.error.message).toContain('before or equal');
    });
  });

  // --- Validation errors: page/pageSize bounds (Requirements: 10.5) ---

  describe('validation errors - pagination bounds', () => {
    it('returns 400 when page < 1', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: false,
        error: {
          field: 'page',
          message: 'page must be >= 1',
        },
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?page=0');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_QUERY_PARAM');
      expect(res.body.error.field).toBe('page');
      expect(res.body.error.message).toContain('>= 1');
    });

    it('returns 400 when pageSize > 100', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: false,
        error: {
          field: 'pageSize',
          message: 'pageSize must be between 1 and 100',
        },
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?pageSize=101');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_QUERY_PARAM');
      expect(res.body.error.field).toBe('pageSize');
      expect(res.body.error.message).toContain('between 1 and 100');
    });

    it('returns 400 when pageSize < 1', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: false,
        error: {
          field: 'pageSize',
          message: 'pageSize must be between 1 and 100',
        },
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?pageSize=0');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_QUERY_PARAM');
      expect(res.body.error.field).toBe('pageSize');
    });
  });

  // --- Empty result set (Requirements: 10.6) ---

  describe('empty result set', () => {
    it('returns 200 with zero disputes and valid metadata', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { customerName: 'nonexistent', sortBy: 'createdAt', sortOrder: 'desc', page: 1, pageSize: 10 },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: [],
        totalCount: 0,
        page: 1,
        totalPages: 0,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?customerName=nonexistent');

      expect(res.status).toBe(200);
      expect(res.body.disputes).toEqual([]);
      expect(res.body.totalCount).toBe(0);
      expect(res.body.page).toBe(1);
      expect(res.body.totalPages).toBe(0);
    });
  });

  // --- Page beyond total (Requirements: 10.6) ---

  describe('page beyond total', () => {
    it('returns 200 with empty array and valid metadata when page exceeds total', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { sortBy: 'createdAt', sortOrder: 'desc', page: 99, pageSize: 10 },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: [],
        totalCount: 3,
        page: 99,
        totalPages: 1,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?page=99');

      expect(res.status).toBe(200);
      expect(res.body.disputes).toEqual([]);
      expect(res.body.totalCount).toBe(3);
      expect(res.body.page).toBe(99);
      expect(res.body.totalPages).toBe(1);
    });
  });

  // --- Service layer error propagation ---

  describe('service layer error propagation', () => {
    it('returns 500 when queryDisputes throws an error', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: { sortBy: 'createdAt', sortOrder: 'desc', page: 1, pageSize: 10 },
      });
      vi.mocked(queryDisputes).mockRejectedValue(new Error('Database connection failed'));

      const app = createApp();
      const res = await request(app).get('/api/disputes');

      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  // --- Combined filters (Requirements: 10.3) ---

  describe('combined filters', () => {
    it('applies multiple filters simultaneously', async () => {
      vi.mocked(validateDisputeQueryParams).mockReturnValue({
        valid: true,
        params: {
          status: 'OPEN',
          priority: 'HIGH',
          paymentType: 'CARD',
          sortBy: 'createdAt',
          sortOrder: 'desc',
          page: 1,
          pageSize: 10,
        },
      });
      vi.mocked(queryDisputes).mockResolvedValue({
        disputes: [mockDisputes[0]],
        totalCount: 1,
        page: 1,
        totalPages: 1,
      });

      const app = createApp();
      const res = await request(app).get('/api/disputes?status=OPEN&priority=HIGH&paymentType=CARD');

      expect(res.status).toBe(200);
      expect(res.body.disputes).toHaveLength(1);
      expect(queryDisputes).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'OPEN',
          priority: 'HIGH',
          paymentType: 'CARD',
        }),
      );
    });
  });
});
