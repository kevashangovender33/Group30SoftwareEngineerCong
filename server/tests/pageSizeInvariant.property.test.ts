import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

/**
 * **Validates: Requirements 6.1, 1.1**
 *
 * Property 6: Page size invariant
 * For any valid API request to GET /api/disputes (regardless of filters, sort, or page number),
 * the number of disputes in the response array SHALL be at most the requested pageSize (default 10),
 * and SHALL equal min(pageSize, totalCount - (page-1) * pageSize) when the page is within bounds.
 */

// Mock the Prisma client before importing the service
vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    dispute: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { queryDisputes } from '../src/services/disputeQueryService.js';
import { prisma } from '../src/lib/prisma.js';
import type { DisputeQueryParams } from '../src/services/disputeQueryValidator.js';

const mockedPrisma = vi.mocked(prisma, true);

function createMockDispute(index: number) {
  return {
    id: `dispute-${index}`,
    referenceNumber: `DSP-${String(index + 1).padStart(3, '0')}`,
    status: 'OPEN',
    priority: 'HIGH',
    ageIndicator: 'NEW',
    paymentType: 'CARD',
    issueCategory: 'DUPLICATE_DEBIT',
    recommendedAction: 'Immediate Reversal',
    createdAt: new Date(2024, 0, 1, 0, 0, 0, index),
    customer: { name: `Customer ${index}` },
    transaction: { amount: 1000 + index },
    _count: { triggeredRules: 1 },
  };
}

describe('Feature: dispute-history-view, Property 6: Page size invariant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('response array length is at most pageSize for any valid request', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 50 }), // totalCount
        fc.integer({ min: 1, max: 100 }), // pageSize
        fc.integer({ min: 1, max: 20 }), // page
        async (totalCount, pageSize, page) => {
          // Calculate the expected number of items on this page
          const totalPages = Math.ceil(totalCount / pageSize);
          const skip = (page - 1) * pageSize;

          // Determine how many items this page should have
          let expectedLength: number;
          if (page > totalPages || totalCount === 0) {
            expectedLength = 0;
          } else {
            expectedLength = Math.min(pageSize, totalCount - (page - 1) * pageSize);
          }

          // Create mock disputes for the page
          const pageDisputes = Array.from(
            { length: expectedLength },
            (_, i) => createMockDispute(skip + i)
          );

          // Mock count to return totalCount
          mockedPrisma.dispute.count.mockResolvedValue(totalCount);

          // Mock findMany to return the page disputes
          mockedPrisma.dispute.findMany.mockResolvedValue(pageDisputes as any);

          const params: DisputeQueryParams = {
            sortBy: 'createdAt',
            sortOrder: 'desc',
            page,
            pageSize,
          };

          const result = await queryDisputes(params);

          // Property: response array length is at most pageSize
          expect(result.disputes.length).toBeLessThanOrEqual(pageSize);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('response array length equals min(pageSize, totalCount - (page-1) * pageSize) when page is within bounds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }), // totalCount (at least 1 to have valid pages)
        fc.integer({ min: 1, max: 100 }), // pageSize
        async (totalCount, pageSize) => {
          const totalPages = Math.ceil(totalCount / pageSize);

          // Generate a page that is within bounds
          const page = fc.sample(fc.integer({ min: 1, max: totalPages }), 1)[0];

          const skip = (page - 1) * pageSize;
          const expectedLength = Math.min(pageSize, totalCount - (page - 1) * pageSize);

          // Create mock disputes for the page
          const pageDisputes = Array.from(
            { length: expectedLength },
            (_, i) => createMockDispute(skip + i)
          );

          // Mock count to return totalCount
          mockedPrisma.dispute.count.mockResolvedValue(totalCount);

          // Mock findMany to return the page disputes
          mockedPrisma.dispute.findMany.mockResolvedValue(pageDisputes as any);

          const params: DisputeQueryParams = {
            sortBy: 'createdAt',
            sortOrder: 'desc',
            page,
            pageSize,
          };

          const result = await queryDisputes(params);

          // Property: when page is within bounds, length equals the expected value
          expect(result.disputes.length).toBe(expectedLength);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('page beyond total returns empty array', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }), // totalCount
        fc.integer({ min: 1, max: 100 }), // pageSize
        async (totalCount, pageSize) => {
          const totalPages = Math.ceil(totalCount / pageSize);
          const page = totalPages + 1; // Page beyond total

          // Mock count to return totalCount
          mockedPrisma.dispute.count.mockResolvedValue(totalCount);

          // Mock findMany to return empty (as DB would for out-of-bounds skip)
          mockedPrisma.dispute.findMany.mockResolvedValue([]);

          const params: DisputeQueryParams = {
            sortBy: 'createdAt',
            sortOrder: 'desc',
            page,
            pageSize,
          };

          const result = await queryDisputes(params);

          // Property: page beyond total returns 0 disputes
          expect(result.disputes.length).toBe(0);
          expect(result.disputes.length).toBeLessThanOrEqual(pageSize);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('page size invariant holds regardless of filters and sort options', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 30 }), // totalCount
        fc.integer({ min: 1, max: 100 }), // pageSize
        fc.integer({ min: 1, max: 10 }), // page
        fc.constantFrom('createdAt' as const, 'priority' as const, 'status' as const), // sortBy
        fc.constantFrom('asc' as const, 'desc' as const), // sortOrder
        fc.option(fc.constantFrom('OPEN', 'TRIAGED', 'CLOSED'), { nil: undefined }), // status filter
        fc.option(fc.constantFrom('HIGH', 'MEDIUM', 'LOW'), { nil: undefined }), // priority filter
        fc.option(fc.constantFrom('CARD', 'EFT', 'INTERNAL'), { nil: undefined }), // paymentType filter
        async (totalCount, pageSize, page, sortBy, sortOrder, status, priority, paymentType) => {
          const totalPages = Math.ceil(totalCount / pageSize);
          const skip = (page - 1) * pageSize;

          // Determine expected length
          let expectedLength: number;
          if (page > totalPages || totalCount === 0) {
            expectedLength = 0;
          } else {
            expectedLength = Math.min(pageSize, totalCount - (page - 1) * pageSize);
          }

          // For priority/status sorting, the service fetches ALL and sorts in-memory
          // For createdAt sorting, it uses skip/take directly
          if (sortBy === 'createdAt') {
            // Create mock disputes for the page
            const pageDisputes = Array.from(
              { length: expectedLength },
              (_, i) => createMockDispute(skip + i)
            );
            mockedPrisma.dispute.count.mockResolvedValue(totalCount);
            mockedPrisma.dispute.findMany.mockResolvedValue(pageDisputes as any);
          } else {
            // For priority/status sort: service fetches ALL then slices
            const allDisputes = Array.from(
              { length: totalCount },
              (_, i) => createMockDispute(i)
            );
            mockedPrisma.dispute.count.mockResolvedValue(totalCount);
            mockedPrisma.dispute.findMany.mockResolvedValue(allDisputes as any);
          }

          const params: DisputeQueryParams = {
            sortBy,
            sortOrder,
            page,
            pageSize,
            ...(status && { status }),
            ...(priority && { priority }),
            ...(paymentType && { paymentType }),
          };

          const result = await queryDisputes(params);

          // Property: response array length is at most pageSize
          expect(result.disputes.length).toBeLessThanOrEqual(pageSize);

          // Property: when page is within bounds, length equals expected value
          if (page <= totalPages && totalCount > 0) {
            expect(result.disputes.length).toBe(expectedLength);
          } else {
            expect(result.disputes.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
