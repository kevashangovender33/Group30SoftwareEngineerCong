import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

/**
 * **Validates: Requirements 7.1**
 *
 * Property 7: Dispute list is ordered by createdAt descending
 * For any set of persisted disputes, querying disputeRepository.findAll()
 * SHALL return them in strictly non-increasing createdAt order.
 */

// Mock the Prisma client before importing the repository
vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    $transaction: vi.fn(),
    dispute: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
    },
    triggeredRule: {
      create: vi.fn(),
    },
  },
}));

import { disputeRepository } from '../src/repositories/disputeRepository.js';
import { prisma } from '../src/lib/prisma.js';

const mockedPrisma = vi.mocked(prisma, true);

describe('Feature: dispute-persistence, Property 7: Dispute list is ordered by createdAt descending', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returned disputes have createdAt values in non-increasing order for any N disputes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }).chain((n) =>
          fc.array(
            fc.integer({ min: 1577836800000, max: 1924905600000 }).map((ts) => new Date(ts)),
            { minLength: n, maxLength: n }
          )
        ),
        async (dates: Date[]) => {
          // Sort dates descending to simulate what the DB returns with orderBy: { createdAt: 'desc' }
          const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime());

          // Create mock dispute data with the sorted dates
          const mockDisputes = sortedDates.map((date, index) => ({
            id: `dispute-${index}`,
            referenceNumber: `DSP-${String(index + 1).padStart(3, '0')}`,
            status: 'TRIAGED',
            priority: 'HIGH',
            ageIndicator: 'NEW',
            paymentType: 'CARD',
            issueCategory: 'DUPLICATE_DEBIT',
            recommendedAction: 'Immediate Reversal',
            createdAt: date,
            customer: { name: `Customer ${index}` },
            transaction: { amount: 1000 + index },
            _count: { triggeredRules: 1 },
          }));

          // Mock findMany to return disputes in the sorted order (as DB would)
          mockedPrisma.dispute.findMany.mockResolvedValue(mockDisputes as any);

          const result = await disputeRepository.findAll();

          // Assert: createdAt values are in non-increasing order
          for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].createdAt.getTime()).toBeGreaterThanOrEqual(
              result[i + 1].createdAt.getTime()
            );
          }

          // Also verify findMany was called with the correct orderBy
          expect(mockedPrisma.dispute.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              orderBy: { createdAt: 'desc' },
            })
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ordering is maintained regardless of status filter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 8 }).chain((n) =>
          fc.tuple(
            fc.array(
              fc.integer({ min: 1577836800000, max: 1924905600000 }).map((ts) => new Date(ts)),
              { minLength: n, maxLength: n }
            ),
            fc.constantFrom('OPEN' as const, 'TRIAGED' as const, 'CLOSED' as const)
          )
        ),
        async ([dates, status]) => {
          const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime());

          const mockDisputes = sortedDates.map((date, index) => ({
            id: `dispute-${index}`,
            referenceNumber: `DSP-${String(index + 1).padStart(3, '0')}`,
            status,
            priority: 'MEDIUM',
            ageIndicator: 'AGING',
            paymentType: 'EFT',
            issueCategory: 'FAILED_TRANSFER',
            recommendedAction: 'Investigate',
            createdAt: date,
            customer: { name: `Customer ${index}` },
            transaction: { amount: 500 + index },
            _count: { triggeredRules: 2 },
          }));

          mockedPrisma.dispute.findMany.mockResolvedValue(mockDisputes as any);

          const result = await disputeRepository.findAll({ status });

          // Assert: createdAt values remain in non-increasing order
          for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].createdAt.getTime()).toBeGreaterThanOrEqual(
              result[i + 1].createdAt.getTime()
            );
          }

          // Verify filter is applied along with ordering
          expect(mockedPrisma.dispute.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: { status },
              orderBy: { createdAt: 'desc' },
            })
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
