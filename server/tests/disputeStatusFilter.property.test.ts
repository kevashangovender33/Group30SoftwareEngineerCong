import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    $transaction: vi.fn(),
    dispute: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { disputeRepository } from '../src/repositories/disputeRepository.js';
import { prisma } from '../src/lib/prisma.js';

const mockedFindMany = vi.mocked(prisma.dispute.findMany);

describe('Feature: dispute-persistence, Property 8: Status filter returns only matching disputes', () => {
  /**
   * Validates: Requirements 7.2, 7.3
   *
   * Property: For any valid status value S in {OPEN, TRIAGED, CLOSED},
   * querying disputeRepository.findAll({ status: S }) SHALL return only
   * disputes whose status equals S, with each result including customerName,
   * transactionAmount, and triggeredRuleCount fields.
   */

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filtering by any valid status returns only disputes with that status and includes required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('OPEN' as const, 'TRIAGED' as const, 'CLOSED' as const),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }),
            amount: fc.double({ min: 0.01, max: 100000, noNaN: true }),
            ruleCount: fc.integer({ min: 0, max: 10 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (filterStatus, mockItems) => {
          vi.clearAllMocks();

          // Build mock disputes all with the given filterStatus
          const mockDisputes = mockItems.map((item, idx) => ({
            id: `dispute-${idx}`,
            referenceNumber: `DSP-${String(idx + 1).padStart(3, '0')}`,
            status: filterStatus,
            priority: 'MEDIUM',
            ageIndicator: 'NEW',
            paymentType: 'CARD',
            issueCategory: 'DUPLICATE_DEBIT',
            recommendedAction: 'INVESTIGATE',
            createdAt: new Date(Date.now() - idx * 1000),
            customer: { name: item.name },
            transaction: { amount: item.amount },
            _count: { triggeredRules: item.ruleCount },
          }));

          mockedFindMany.mockResolvedValue(mockDisputes as never);

          const results = await disputeRepository.findAll({ status: filterStatus });

          // Assert: Prisma was called with the correct status filter
          expect(mockedFindMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: { status: filterStatus },
            })
          );

          // Assert: all returned items have matching status
          for (const dispute of results) {
            expect(dispute.status).toBe(filterStatus);
          }

          // Assert: each item contains customerName, transactionAmount, triggeredRuleCount
          for (const dispute of results) {
            expect(dispute).toHaveProperty('customerName');
            expect(typeof dispute.customerName).toBe('string');
            expect(dispute).toHaveProperty('transactionAmount');
            expect(typeof dispute.transactionAmount).toBe('number');
            expect(dispute).toHaveProperty('triggeredRuleCount');
            expect(typeof dispute.triggeredRuleCount).toBe('number');
          }

          // Assert: result count matches mock input
          expect(results.length).toBe(mockItems.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('each valid status value produces a where clause with that exact status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('OPEN' as const, 'TRIAGED' as const, 'CLOSED' as const),
        async (filterStatus) => {
          vi.clearAllMocks();

          const mockDisputes = [
            {
              id: 'dispute-1',
              referenceNumber: 'DSP-001',
              status: filterStatus,
              priority: 'HIGH',
              ageIndicator: 'AGING',
              paymentType: 'EFT',
              issueCategory: 'UNAUTHORIZED',
              recommendedAction: 'ESCALATE_FRAUD',
              createdAt: new Date(),
              customer: { name: 'Test Customer' },
              transaction: { amount: 500 },
              _count: { triggeredRules: 2 },
            },
          ];

          mockedFindMany.mockResolvedValue(mockDisputes as never);

          await disputeRepository.findAll({ status: filterStatus });

          const callArgs = mockedFindMany.mock.calls[0][0] as { where?: { status?: string } };
          expect(callArgs?.where?.status).toBe(filterStatus);
        }
      ),
      { numRuns: 100 }
    );
  });
});
