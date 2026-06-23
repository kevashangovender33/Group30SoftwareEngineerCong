import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

/**
 * Feature: dispute-history-view, Property 10: Page beyond total returns empty array with valid metadata
 *
 * **Validates: Requirements 10.6**
 *
 * For any requested page number that exceeds the total number of pages
 * (calculated as ceil(totalCount / pageSize)), the API SHALL return HTTP 200
 * with an empty disputes array, the correct totalCount, the requested page
 * number, and the correct totalPages value.
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

describe('Feature: dispute-history-view, Property 10: Page beyond total returns empty array with valid metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requesting a page beyond totalPages returns empty disputes with correct metadata', async () => {
    /**
     * **Validates: Requirements 10.6**
     *
     * Generate random (totalCount, pageSize) pairs, then pick a page number
     * that exceeds ceil(totalCount / pageSize). The queryDisputes function
     * must return an empty disputes array with the correct totalCount, the
     * requested page number, and the correct totalPages.
     */
    await fc.assert(
      fc.asyncProperty(
        fc
          .record({
            totalCount: fc.integer({ min: 0, max: 500 }),
            pageSize: fc.integer({ min: 1, max: 100 }),
          })
          .chain(({ totalCount, pageSize }) => {
            const totalPages = Math.ceil(totalCount / pageSize);
            // Generate a page number that exceeds totalPages (at least totalPages + 1)
            return fc
              .integer({ min: totalPages + 1, max: totalPages + 100 })
              .map((page) => ({ totalCount, pageSize, page, totalPages }));
          }),
        async ({ totalCount, pageSize, page, totalPages }) => {
          // Mock Prisma to return the totalCount
          mockedPrisma.dispute.count.mockResolvedValue(totalCount);
          // When page exceeds total, findMany should return empty (or be called with skip beyond data)
          mockedPrisma.dispute.findMany.mockResolvedValue([]);

          const params: DisputeQueryParams = {
            sortBy: 'createdAt',
            sortOrder: 'desc',
            page,
            pageSize,
          };

          const result = await queryDisputes(params);

          // The disputes array must be empty
          expect(result.disputes).toEqual([]);

          // The totalCount must reflect the actual total
          expect(result.totalCount).toBe(totalCount);

          // The page in the response must be the requested page
          expect(result.page).toBe(page);

          // The totalPages must equal ceil(totalCount / pageSize)
          expect(result.totalPages).toBe(totalPages);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('page exactly equal to totalPages + 1 also returns empty disputes', async () => {
    /**
     * **Validates: Requirements 10.6**
     *
     * Edge property: when page is exactly one past the last page, the response
     * must still be HTTP 200 with an empty array and valid metadata.
     */
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          totalCount: fc.integer({ min: 1, max: 200 }),
          pageSize: fc.integer({ min: 1, max: 100 }),
        }),
        async ({ totalCount, pageSize }) => {
          const totalPages = Math.ceil(totalCount / pageSize);
          const page = totalPages + 1;

          mockedPrisma.dispute.count.mockResolvedValue(totalCount);
          mockedPrisma.dispute.findMany.mockResolvedValue([]);

          const params: DisputeQueryParams = {
            sortBy: 'createdAt',
            sortOrder: 'desc',
            page,
            pageSize,
          };

          const result = await queryDisputes(params);

          expect(result.disputes).toEqual([]);
          expect(result.totalCount).toBe(totalCount);
          expect(result.page).toBe(page);
          expect(result.totalPages).toBe(totalPages);
        },
      ),
      { numRuns: 100 },
    );
  });
});
