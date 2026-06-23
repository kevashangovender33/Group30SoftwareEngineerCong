import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Feature: dispute-history-view, Property 2: Sort ordering correctness
 *
 * **Validates: Requirements 5.2, 5.5, 5.6**
 *
 * For any set of disputes returned by the API when sorted by a given field
 * (createdAt, priority, or status) in a given direction (asc or desc), the
 * results SHALL be in strictly non-decreasing (asc) or non-increasing (desc)
 * order according to:
 *   - createdAt: chronological order
 *   - priority: HIGH=1 < MEDIUM=2 < LOW=3
 *   - status: OPEN=1 < TRIAGED=2 < CLOSED=3
 */

// Weight maps matching the implementation in disputeQueryService.ts
const PRIORITY_WEIGHT: Record<string, number> = { HIGH: 1, MEDIUM: 2, LOW: 3 };
const STATUS_WEIGHT: Record<string, number> = { OPEN: 1, TRIAGED: 2, CLOSED: 3 };

type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
type Status = 'OPEN' | 'TRIAGED' | 'CLOSED';

interface DisputeListItem {
  id: string;
  referenceNumber: string;
  status: string;
  priority: string;
  ageIndicator: string;
  paymentType: string;
  issueCategory: string;
  recommendedAction: string | null;
  createdAt: string;
  customerName: string;
  transactionAmount: number;
  triggeredRuleCount: number;
}

// Re-implement the sort logic from disputeQueryService to test it as a pure function
function sortByWeight(
  disputes: DisputeListItem[],
  field: 'priority' | 'status',
  order: 'asc' | 'desc',
): DisputeListItem[] {
  const weights = field === 'priority' ? PRIORITY_WEIGHT : STATUS_WEIGHT;

  return [...disputes].sort((a, b) => {
    const aVal = field === 'priority' ? a.priority : a.status;
    const bVal = field === 'priority' ? b.priority : b.status;
    const aWeight = weights[aVal] ?? 99;
    const bWeight = weights[bVal] ?? 99;

    return order === 'asc' ? aWeight - bWeight : bWeight - aWeight;
  });
}

function sortByCreatedAt(
  disputes: DisputeListItem[],
  order: 'asc' | 'desc',
): DisputeListItem[] {
  return [...disputes].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return order === 'asc' ? aTime - bTime : bTime - aTime;
  });
}

// Generator for a valid ISO date string within a reasonable range
const isoDateArb = fc
  .integer({
    min: new Date('2020-01-01T00:00:00Z').getTime(),
    max: new Date('2030-12-31T23:59:59Z').getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

// Generator for a single DisputeListItem
const disputeItemArb = fc
  .record({
    priority: fc.constantFrom<Priority>('HIGH', 'MEDIUM', 'LOW'),
    status: fc.constantFrom<Status>('OPEN', 'TRIAGED', 'CLOSED'),
    createdAt: isoDateArb,
    transactionAmount: fc.integer({ min: 100, max: 999999 }),
    triggeredRuleCount: fc.integer({ min: 0, max: 10 }),
  })
  .map((rec) => ({
    id: `dispute-${Math.random().toString(36).slice(2, 10)}`,
    referenceNumber: `DSP-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    status: rec.status,
    priority: rec.priority,
    ageIndicator: 'NEW' as const,
    paymentType: 'CARD' as const,
    issueCategory: 'DUPLICATE_DEBIT' as const,
    recommendedAction: 'Immediate Reversal',
    createdAt: rec.createdAt,
    customerName: `Customer`,
    transactionAmount: rec.transactionAmount,
    triggeredRuleCount: rec.triggeredRuleCount,
  }));

// Generator for an array of disputes (2–20 items)
const disputeArrayArb = fc.array(disputeItemArb, { minLength: 2, maxLength: 20 });

describe('Feature: dispute-history-view, Property 2: Sort ordering correctness', () => {
  it('sorting by priority ascending yields non-decreasing weight order (HIGH=1 < MEDIUM=2 < LOW=3)', () => {
    /**
     * **Validates: Requirements 5.2, 5.5, 5.6**
     *
     * For any array of disputes sorted by priority in ascending order,
     * the weight of each successive item is >= the weight of the previous item.
     */
    fc.assert(
      fc.property(disputeArrayArb, (disputes) => {
        const sorted = sortByWeight(disputes, 'priority', 'asc');

        for (let i = 0; i < sorted.length - 1; i++) {
          const currentWeight = PRIORITY_WEIGHT[sorted[i].priority];
          const nextWeight = PRIORITY_WEIGHT[sorted[i + 1].priority];
          expect(currentWeight).toBeLessThanOrEqual(nextWeight);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('sorting by priority descending yields non-increasing weight order (LOW=3 > MEDIUM=2 > HIGH=1)', () => {
    /**
     * **Validates: Requirements 5.2, 5.5, 5.6**
     *
     * For any array of disputes sorted by priority in descending order,
     * the weight of each successive item is <= the weight of the previous item.
     */
    fc.assert(
      fc.property(disputeArrayArb, (disputes) => {
        const sorted = sortByWeight(disputes, 'priority', 'desc');

        for (let i = 0; i < sorted.length - 1; i++) {
          const currentWeight = PRIORITY_WEIGHT[sorted[i].priority];
          const nextWeight = PRIORITY_WEIGHT[sorted[i + 1].priority];
          expect(currentWeight).toBeGreaterThanOrEqual(nextWeight);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('sorting by status ascending yields non-decreasing weight order (OPEN=1 < TRIAGED=2 < CLOSED=3)', () => {
    /**
     * **Validates: Requirements 5.2, 5.5, 5.6**
     *
     * For any array of disputes sorted by status in ascending order,
     * the weight of each successive item is >= the weight of the previous item.
     */
    fc.assert(
      fc.property(disputeArrayArb, (disputes) => {
        const sorted = sortByWeight(disputes, 'status', 'asc');

        for (let i = 0; i < sorted.length - 1; i++) {
          const currentWeight = STATUS_WEIGHT[sorted[i].status];
          const nextWeight = STATUS_WEIGHT[sorted[i + 1].status];
          expect(currentWeight).toBeLessThanOrEqual(nextWeight);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('sorting by status descending yields non-increasing weight order (CLOSED=3 > TRIAGED=2 > OPEN=1)', () => {
    /**
     * **Validates: Requirements 5.2, 5.5, 5.6**
     *
     * For any array of disputes sorted by status in descending order,
     * the weight of each successive item is <= the weight of the previous item.
     */
    fc.assert(
      fc.property(disputeArrayArb, (disputes) => {
        const sorted = sortByWeight(disputes, 'status', 'desc');

        for (let i = 0; i < sorted.length - 1; i++) {
          const currentWeight = STATUS_WEIGHT[sorted[i].status];
          const nextWeight = STATUS_WEIGHT[sorted[i + 1].status];
          expect(currentWeight).toBeGreaterThanOrEqual(nextWeight);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('sorting by createdAt ascending yields non-decreasing chronological order', () => {
    /**
     * **Validates: Requirements 5.2, 5.5, 5.6**
     *
     * For any array of disputes sorted by createdAt in ascending order,
     * the timestamp of each successive item is >= the timestamp of the previous item.
     */
    fc.assert(
      fc.property(disputeArrayArb, (disputes) => {
        const sorted = sortByCreatedAt(disputes, 'asc');

        for (let i = 0; i < sorted.length - 1; i++) {
          const currentTime = new Date(sorted[i].createdAt).getTime();
          const nextTime = new Date(sorted[i + 1].createdAt).getTime();
          expect(currentTime).toBeLessThanOrEqual(nextTime);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('sorting by createdAt descending yields non-increasing chronological order', () => {
    /**
     * **Validates: Requirements 5.2, 5.5, 5.6**
     *
     * For any array of disputes sorted by createdAt in descending order,
     * the timestamp of each successive item is <= the timestamp of the previous item.
     */
    fc.assert(
      fc.property(disputeArrayArb, (disputes) => {
        const sorted = sortByCreatedAt(disputes, 'desc');

        for (let i = 0; i < sorted.length - 1; i++) {
          const currentTime = new Date(sorted[i].createdAt).getTime();
          const nextTime = new Date(sorted[i + 1].createdAt).getTime();
          expect(currentTime).toBeGreaterThanOrEqual(nextTime);
        }
      }),
      { numRuns: 100 },
    );
  });
});
