import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAnalytics, formatIssueCategoryLabel } from '../src/services/analyticsService.js';

// Mock Prisma
vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    dispute: {
      groupBy: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from '../src/lib/prisma.js';

const mockDisputeGroupBy = vi.mocked(prisma.dispute.groupBy);
const mockDisputeCount = vi.mocked(prisma.dispute.count);

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatIssueCategoryLabel', () => {
    it('should convert DUPLICATE_DEBIT to "Duplicate Debit"', () => {
      expect(formatIssueCategoryLabel('DUPLICATE_DEBIT')).toBe('Duplicate Debit');
    });

    it('should convert FAILED_TRANSFER to "Failed Transfer"', () => {
      expect(formatIssueCategoryLabel('FAILED_TRANSFER')).toBe('Failed Transfer');
    });

    it('should convert MISSING_PAYMENT to "Missing Payment"', () => {
      expect(formatIssueCategoryLabel('MISSING_PAYMENT')).toBe('Missing Payment');
    });

    it('should convert UNAUTHORISED to "Unauthorised"', () => {
      expect(formatIssueCategoryLabel('UNAUTHORISED')).toBe('Unauthorised');
    });

    it('should convert INCORRECT_AMOUNT to "Incorrect Amount"', () => {
      expect(formatIssueCategoryLabel('INCORRECT_AMOUNT')).toBe('Incorrect Amount');
    });

    it('should convert CARD_DISPUTE to "Card Dispute"', () => {
      expect(formatIssueCategoryLabel('CARD_DISPUTE')).toBe('Card Dispute');
    });

    it('should handle single word without underscore', () => {
      expect(formatIssueCategoryLabel('FRAUD')).toBe('Fraud');
    });
  });

  describe('getAnalytics', () => {
    it('should return correct aggregation with data', async () => {
      mockDisputeGroupBy
        .mockResolvedValueOnce([
          { paymentType: 'CARD', _count: { _all: 5 } },
          { paymentType: 'EFT', _count: { _all: 3 } },
          { paymentType: 'INTERNAL', _count: { _all: 2 } },
        ] as any)
        .mockResolvedValueOnce([
          { issueCategory: 'DUPLICATE_DEBIT', _count: { _all: 4 } },
          { issueCategory: 'FAILED_TRANSFER', _count: { _all: 3 } },
        ] as any)
        .mockResolvedValueOnce([
          { status: 'OPEN', _count: { _all: 4 } },
          { status: 'TRIAGED', _count: { _all: 3 } },
          { status: 'CLOSED', _count: { _all: 3 } },
        ] as any)
        .mockResolvedValueOnce([
          { priority: 'HIGH', _count: { _all: 3 } },
          { priority: 'MEDIUM', _count: { _all: 4 } },
          { priority: 'LOW', _count: { _all: 3 } },
        ] as any);

      mockDisputeCount
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(4)  // open
        .mockResolvedValueOnce(3)  // resolved
        .mockResolvedValueOnce(3); // high priority

      const result = await getAnalytics();

      expect(result.paymentType).toEqual([
        { label: 'Card', count: 5 },
        { label: 'EFT', count: 3 },
        { label: 'Internal Transfer', count: 2 },
      ]);

      expect(result.status).toEqual([
        { label: 'Open', count: 4 },
        { label: 'Triaged', count: 3 },
        { label: 'Closed', count: 3 },
      ]);

      expect(result.priority).toEqual([
        { label: 'High', count: 3 },
        { label: 'Medium', count: 4 },
        { label: 'Low', count: 3 },
      ]);

      expect(result.issueCategory).toEqual([
        { label: 'Duplicate Debit', count: 4 },
        { label: 'Failed Transfer', count: 3 },
      ]);

      expect(result.summary).toEqual({
        totalDisputes: 10,
        openDisputes: 4,
        resolvedDisputes: 3,
        highPriorityDisputes: 3,
      });
    });

    it('should return all zeros when no disputes exist', async () => {
      mockDisputeGroupBy
        .mockResolvedValueOnce([]) // paymentType
        .mockResolvedValueOnce([]) // issueCategory
        .mockResolvedValueOnce([]) // status
        .mockResolvedValueOnce([]); // priority

      mockDisputeCount
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // open
        .mockResolvedValueOnce(0) // resolved
        .mockResolvedValueOnce(0); // high priority

      const result = await getAnalytics();

      expect(result.paymentType).toEqual([
        { label: 'Card', count: 0 },
        { label: 'EFT', count: 0 },
        { label: 'Internal Transfer', count: 0 },
      ]);

      expect(result.status).toEqual([
        { label: 'Open', count: 0 },
        { label: 'Triaged', count: 0 },
        { label: 'Closed', count: 0 },
      ]);

      expect(result.priority).toEqual([
        { label: 'High', count: 0 },
        { label: 'Medium', count: 0 },
        { label: 'Low', count: 0 },
      ]);

      expect(result.issueCategory).toEqual([]);

      expect(result.summary).toEqual({
        totalDisputes: 0,
        openDisputes: 0,
        resolvedDisputes: 0,
        highPriorityDisputes: 0,
      });
    });

    it('should include all payment type labels even when some have zero count', async () => {
      mockDisputeGroupBy
        .mockResolvedValueOnce([
          { paymentType: 'CARD', _count: { _all: 5 } },
        ] as any)
        .mockResolvedValueOnce([]) // issueCategory
        .mockResolvedValueOnce([
          { status: 'OPEN', _count: { _all: 5 } },
        ] as any)
        .mockResolvedValueOnce([
          { priority: 'HIGH', _count: { _all: 5 } },
        ] as any);

      mockDisputeCount
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(5);

      const result = await getAnalytics();

      expect(result.paymentType).toHaveLength(3);
      expect(result.paymentType[0]).toEqual({ label: 'Card', count: 5 });
      expect(result.paymentType[1]).toEqual({ label: 'EFT', count: 0 });
      expect(result.paymentType[2]).toEqual({ label: 'Internal Transfer', count: 0 });
    });

    it('should throw when database query fails', async () => {
      mockDisputeGroupBy.mockRejectedValueOnce(new Error('DB connection failed'));

      await expect(getAnalytics()).rejects.toThrow('DB connection failed');
    });
  });
});
