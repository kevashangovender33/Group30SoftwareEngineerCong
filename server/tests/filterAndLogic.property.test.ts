import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

/**
 * Feature: dispute-history-view, Property 1: Filter AND logic
 *
 * Validates: Requirements 2.2, 3.2, 3.5, 4.2, 4.3
 *
 * For any combination of active filters (customerName, paymentType,
 * issueCategory, priority, status, startDate, endDate) applied to any set
 * of persisted disputes, every dispute in the API response SHALL satisfy ALL
 * active filter conditions simultaneously:
 *   - customer name contains the search term (case-insensitive)
 *   - paymentType matches exactly
 *   - issueCategory matches exactly
 *   - priority matches exactly
 *   - status matches exactly
 *   - createdAt falls within the date range
 */

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    dispute: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { queryDisputes } from '../src/services/disputeQueryService.js';
import { prisma } from '../src/lib/prisma.js';
import type { DisputeQueryParams } from '../src/services/disputeQueryValidator.js';

const mockedFindMany = vi.mocked(prisma.dispute.findMany);
const mockedCount = vi.mocked(prisma.dispute.count);

const VALID_PAYMENT_TYPES = ['CARD', 'EFT', 'INTERNAL'] as const;
const VALID_ISSUE_CATEGORIES = [
  'DUPLICATE_DEBIT',
  'FAILED_TRANSFER',
  'MISSING_PAYMENT',
  'UNAUTHORISED',
  'INCORRECT_AMOUNT',
  'CARD_DISPUTE',
] as const;
const VALID_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;
const VALID_STATUSES = ['OPEN', 'TRIAGED', 'CLOSED'] as const;

// Generator for a single mock dispute record (as returned by Prisma with includes)
function genDisputeRecord() {
  return fc.record({
    id: fc.uuid(),
    referenceNumber: fc.string({ minLength: 5, maxLength: 10 }),
    status: fc.constantFrom(...VALID_STATUSES),
    priority: fc.constantFrom(...VALID_PRIORITIES),
    ageIndicator: fc.constantFrom('NEW', 'AGING', 'OVERDUE'),
    paymentType: fc.constantFrom(...VALID_PAYMENT_TYPES),
    issueCategory: fc.constantFrom(...VALID_ISSUE_CATEGORIES),
    recommendedAction: fc.constantFrom(
      'Immediate Reversal',
      'Escalate to Fraud Team',
      'Standard Investigation',
      null,
    ),
    createdAt: fc.date({
      min: new Date('2024-01-01'),
      max: new Date('2025-12-31'),
    }),
    customer: fc.record({ name: fc.string({ minLength: 1, maxLength: 30 }) }),
    transaction: fc.record({
      amount: fc.double({ min: 1, max: 100000, noNaN: true }),
    }),
    _count: fc.record({
      triggeredRules: fc.integer({ min: 0, max: 10 }),
    }),
  });
}

// Generator for optional filter params (each filter may or may not be active)
function genFilterParams() {
  return fc.record({
    customerName: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
    paymentType: fc.option(fc.constantFrom(...VALID_PAYMENT_TYPES), { nil: undefined }),
    issueCategory: fc.option(fc.constantFrom(...VALID_ISSUE_CATEGORIES), { nil: undefined }),
    priority: fc.option(fc.constantFrom(...VALID_PRIORITIES), { nil: undefined }),
    status: fc.option(fc.constantFrom(...VALID_STATUSES), { nil: undefined }),
    startDate: fc.option(
      fc.date({ min: new Date('2024-01-01'), max: new Date('2025-06-30') }).map(
        (d) => d.toISOString().split('T')[0],
      ),
      { nil: undefined },
    ),
    endDate: fc.option(
      fc.date({ min: new Date('2024-07-01'), max: new Date('2025-12-31') }).map(
        (d) => d.toISOString().split('T')[0],
      ),
      { nil: undefined },
    ),
  });
}

/**
 * Simulates the Prisma where clause filtering in-memory.
 * This is the oracle: it independently checks if a dispute matches ALL active filters.
 */
function disputeMatchesAllFilters(
  dispute: {
    status: string;
    priority: string;
    paymentType: string;
    issueCategory: string;
    createdAt: Date;
    customer: { name: string };
  },
  params: DisputeQueryParams,
): boolean {
  // customerName: case-insensitive contains
  if (params.customerName) {
    if (!dispute.customer.name.toLowerCase().includes(params.customerName.toLowerCase())) {
      return false;
    }
  }

  // paymentType: exact match
  if (params.paymentType) {
    if (dispute.paymentType !== params.paymentType) {
      return false;
    }
  }

  // issueCategory: exact match
  if (params.issueCategory) {
    if (dispute.issueCategory !== params.issueCategory) {
      return false;
    }
  }

  // priority: exact match
  if (params.priority) {
    if (dispute.priority !== params.priority) {
      return false;
    }
  }

  // status: exact match
  if (params.status) {
    if (dispute.status !== params.status) {
      return false;
    }
  }

  // date range: createdAt >= startDate (start of day)
  if (params.startDate) {
    const startOfDay = new Date(params.startDate + 'T00:00:00.000Z');
    if (dispute.createdAt < startOfDay) {
      return false;
    }
  }

  // date range: createdAt <= endDate (end of day)
  if (params.endDate) {
    const endOfDay = new Date(params.endDate + 'T23:59:59.999Z');
    if (dispute.createdAt > endOfDay) {
      return false;
    }
  }

  return true;
}

describe('Feature: dispute-history-view, Property 1: Filter AND logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('all returned disputes satisfy every active filter condition simultaneously', async () => {
    await fc.assert(
      fc.asyncProperty(
        genFilterParams(),
        fc.array(genDisputeRecord(), { minLength: 1, maxLength: 10 }),
        async (filterOverrides, disputes) => {
          vi.clearAllMocks();

          // Ensure startDate <= endDate when both are present
          let startDate = filterOverrides.startDate;
          let endDate = filterOverrides.endDate;
          if (startDate && endDate && startDate > endDate) {
            // Swap to ensure valid range
            [startDate, endDate] = [endDate, startDate];
          }

          const params: DisputeQueryParams = {
            customerName: filterOverrides.customerName,
            paymentType: filterOverrides.paymentType,
            issueCategory: filterOverrides.issueCategory,
            priority: filterOverrides.priority,
            status: filterOverrides.status,
            startDate,
            endDate,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            page: 1,
            pageSize: 100,
          };

          // Apply the oracle filter to get expected results
          const expectedDisputes = disputes.filter((d) =>
            disputeMatchesAllFilters(d, params),
          );

          // Mock Prisma to return the filtered disputes (simulating DB filtering)
          mockedCount.mockResolvedValue(expectedDisputes.length as never);
          mockedFindMany.mockResolvedValue(expectedDisputes as never);

          const result = await queryDisputes(params);

          // Verify: every returned dispute satisfies ALL active filter conditions
          for (const dispute of result.disputes) {
            // customerName: case-insensitive contains
            if (params.customerName) {
              expect(
                dispute.customerName.toLowerCase(),
              ).toContain(params.customerName.toLowerCase());
            }

            // paymentType: exact match
            if (params.paymentType) {
              expect(dispute.paymentType).toBe(params.paymentType);
            }

            // issueCategory: exact match
            if (params.issueCategory) {
              expect(dispute.issueCategory).toBe(params.issueCategory);
            }

            // priority: exact match
            if (params.priority) {
              expect(dispute.priority).toBe(params.priority);
            }

            // status: exact match
            if (params.status) {
              expect(dispute.status).toBe(params.status);
            }

            // date range check
            if (params.startDate) {
              const disputeDate = new Date(dispute.createdAt);
              const startOfDay = new Date(params.startDate + 'T00:00:00.000Z');
              expect(disputeDate.getTime()).toBeGreaterThanOrEqual(startOfDay.getTime());
            }

            if (params.endDate) {
              const disputeDate = new Date(dispute.createdAt);
              const endOfDay = new Date(params.endDate + 'T23:59:59.999Z');
              expect(disputeDate.getTime()).toBeLessThanOrEqual(endOfDay.getTime());
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('the where clause passed to Prisma includes all active filter conditions', async () => {
    await fc.assert(
      fc.asyncProperty(
        genFilterParams(),
        async (filterOverrides) => {
          vi.clearAllMocks();

          // Ensure startDate <= endDate when both are present
          let startDate = filterOverrides.startDate;
          let endDate = filterOverrides.endDate;
          if (startDate && endDate && startDate > endDate) {
            [startDate, endDate] = [endDate, startDate];
          }

          const params: DisputeQueryParams = {
            customerName: filterOverrides.customerName,
            paymentType: filterOverrides.paymentType,
            issueCategory: filterOverrides.issueCategory,
            priority: filterOverrides.priority,
            status: filterOverrides.status,
            startDate,
            endDate,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            page: 1,
            pageSize: 10,
          };

          // Mock Prisma to return empty results
          mockedCount.mockResolvedValue(0 as never);
          mockedFindMany.mockResolvedValue([] as never);

          await queryDisputes(params);

          // Verify that findMany was called with a where clause containing all active filters
          const findManyCall = mockedFindMany.mock.calls[0][0] as {
            where?: Record<string, unknown>;
          };
          const where = findManyCall?.where ?? {};

          // customerName filter should produce a customer relation filter
          if (params.customerName) {
            expect(where).toHaveProperty('customer');
            const customerWhere = where.customer as { name: { contains: string; mode: string } };
            expect(customerWhere.name.contains).toBe(params.customerName);
            expect(customerWhere.name.mode).toBe('insensitive');
          }

          // paymentType: exact match
          if (params.paymentType) {
            expect(where).toHaveProperty('paymentType', params.paymentType);
          }

          // issueCategory: exact match
          if (params.issueCategory) {
            expect(where).toHaveProperty('issueCategory', params.issueCategory);
          }

          // priority: exact match
          if (params.priority) {
            expect(where).toHaveProperty('priority', params.priority);
          }

          // status: exact match
          if (params.status) {
            expect(where).toHaveProperty('status', params.status);
          }

          // date range
          if (params.startDate || params.endDate) {
            expect(where).toHaveProperty('createdAt');
            const createdAt = where.createdAt as { gte?: Date; lte?: Date };

            if (params.startDate) {
              expect(createdAt.gte).toEqual(new Date(params.startDate + 'T00:00:00.000Z'));
            }
            if (params.endDate) {
              expect(createdAt.lte).toEqual(new Date(params.endDate + 'T23:59:59.999Z'));
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
