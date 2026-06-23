import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

/**
 * **Validates: Requirements 1.2, 10.4**
 *
 * Property 11: Response shape completeness
 * For any successful API response from GET /api/disputes, every item in the disputes array
 * SHALL contain all required fields (id, referenceNumber, status, priority, ageIndicator,
 * paymentType, issueCategory, recommendedAction, createdAt, customerName, transactionAmount,
 * triggeredRuleCount) as non-null values, and the response SHALL include totalCount (integer >= 0),
 * page (integer >= 1), and totalPages (integer >= 0).
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

// Generators for valid dispute field values
const statusArb = fc.constantFrom('OPEN', 'TRIAGED', 'CLOSED');
const priorityArb = fc.constantFrom('HIGH', 'MEDIUM', 'LOW');
const ageIndicatorArb = fc.constantFrom('NEW', 'AGING', 'OVERDUE');
const paymentTypeArb = fc.constantFrom('CARD', 'EFT', 'INTERNAL');
const issueCategoryArb = fc.constantFrom(
  'DUPLICATE_DEBIT',
  'FAILED_TRANSFER',
  'MISSING_PAYMENT',
  'UNAUTHORISED',
  'INCORRECT_AMOUNT',
  'CARD_DISPUTE',
);
const recommendedActionArb = fc.constantFrom(
  'Immediate Reversal',
  'Escalate to Fraud Team',
  'Manual Review Required',
  'Standard Processing',
  'Charge Back Initiated',
);

function createMockDisputeArb(index: number) {
  return fc.record({
    id: fc.uuid(),
    referenceNumber: fc.string({ minLength: 5, maxLength: 15 }).map((s) => `DSP-${s}`),
    status: statusArb,
    priority: priorityArb,
    ageIndicator: ageIndicatorArb,
    paymentType: paymentTypeArb,
    issueCategory: issueCategoryArb,
    recommendedAction: recommendedActionArb,
    createdAt: fc.date({ min: new Date(2020, 0, 1), max: new Date(2026, 11, 31) }),
    customerName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    transactionAmount: fc.double({ min: 0.01, max: 999999.99, noNaN: true }),
    triggeredRuleCount: fc.integer({ min: 0, max: 10 }),
  });
}

function mockDisputeToDbShape(dispute: {
  id: string;
  referenceNumber: string;
  status: string;
  priority: string;
  ageIndicator: string;
  paymentType: string;
  issueCategory: string;
  recommendedAction: string;
  createdAt: Date;
  customerName: string;
  transactionAmount: number;
  triggeredRuleCount: number;
}) {
  return {
    id: dispute.id,
    referenceNumber: dispute.referenceNumber,
    status: dispute.status,
    priority: dispute.priority,
    ageIndicator: dispute.ageIndicator,
    paymentType: dispute.paymentType,
    issueCategory: dispute.issueCategory,
    recommendedAction: dispute.recommendedAction,
    createdAt: dispute.createdAt,
    customer: { name: dispute.customerName },
    transaction: { amount: dispute.transactionAmount },
    _count: { triggeredRules: dispute.triggeredRuleCount },
  };
}

describe('Feature: dispute-history-view, Property 11: Response shape completeness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('every dispute item in a successful response contains all required fields as non-null values', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // number of disputes
        fc.array(createMockDisputeArb(0), { minLength: 1, maxLength: 10 }),
        async (_count, mockDisputes) => {
          const totalCount = mockDisputes.length;
          const dbDisputes = mockDisputes.map(mockDisputeToDbShape);

          mockedPrisma.dispute.count.mockResolvedValue(totalCount);
          mockedPrisma.dispute.findMany.mockResolvedValue(dbDisputes as any);

          const params: DisputeQueryParams = {
            sortBy: 'createdAt',
            sortOrder: 'desc',
            page: 1,
            pageSize: 10,
          };

          const result = await queryDisputes(params);

          // Verify every item has all required fields as non-null
          for (const dispute of result.disputes) {
            expect(dispute.id).not.toBeNull();
            expect(dispute.id).toBeDefined();
            expect(typeof dispute.id).toBe('string');

            expect(dispute.referenceNumber).not.toBeNull();
            expect(dispute.referenceNumber).toBeDefined();
            expect(typeof dispute.referenceNumber).toBe('string');

            expect(dispute.status).not.toBeNull();
            expect(dispute.status).toBeDefined();
            expect(typeof dispute.status).toBe('string');

            expect(dispute.priority).not.toBeNull();
            expect(dispute.priority).toBeDefined();
            expect(typeof dispute.priority).toBe('string');

            expect(dispute.ageIndicator).not.toBeNull();
            expect(dispute.ageIndicator).toBeDefined();
            expect(typeof dispute.ageIndicator).toBe('string');

            expect(dispute.paymentType).not.toBeNull();
            expect(dispute.paymentType).toBeDefined();
            expect(typeof dispute.paymentType).toBe('string');

            expect(dispute.issueCategory).not.toBeNull();
            expect(dispute.issueCategory).toBeDefined();
            expect(typeof dispute.issueCategory).toBe('string');

            expect(dispute.recommendedAction).not.toBeNull();
            expect(dispute.recommendedAction).toBeDefined();
            expect(typeof dispute.recommendedAction).toBe('string');

            expect(dispute.createdAt).not.toBeNull();
            expect(dispute.createdAt).toBeDefined();
            expect(typeof dispute.createdAt).toBe('string');

            expect(dispute.customerName).not.toBeNull();
            expect(dispute.customerName).toBeDefined();
            expect(typeof dispute.customerName).toBe('string');

            expect(dispute.transactionAmount).not.toBeNull();
            expect(dispute.transactionAmount).toBeDefined();
            expect(typeof dispute.transactionAmount).toBe('number');

            expect(dispute.triggeredRuleCount).not.toBeNull();
            expect(dispute.triggeredRuleCount).toBeDefined();
            expect(typeof dispute.triggeredRuleCount).toBe('number');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('response includes totalCount (integer >= 0), page (integer >= 1), and totalPages (integer >= 0)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 50 }), // totalCount
        fc.integer({ min: 1, max: 100 }), // pageSize
        fc.integer({ min: 1, max: 20 }), // page
        fc.constantFrom('createdAt' as const, 'priority' as const, 'status' as const),
        fc.constantFrom('asc' as const, 'desc' as const),
        async (totalCount, pageSize, page, sortBy, sortOrder) => {
          const totalPages = Math.ceil(totalCount / pageSize);
          const skip = (page - 1) * pageSize;

          // Determine how many items for this page
          let expectedLength: number;
          if (page > totalPages || totalCount === 0) {
            expectedLength = 0;
          } else {
            expectedLength = Math.min(pageSize, totalCount - skip);
          }

          // Create mock disputes
          const mockDisputes = Array.from({ length: expectedLength }, (_, i) => ({
            id: `dispute-${skip + i}`,
            referenceNumber: `DSP-${String(skip + i + 1).padStart(3, '0')}`,
            status: 'OPEN',
            priority: 'HIGH',
            ageIndicator: 'NEW',
            paymentType: 'CARD',
            issueCategory: 'DUPLICATE_DEBIT',
            recommendedAction: 'Immediate Reversal',
            createdAt: new Date(2024, 0, 1, 0, 0, 0, skip + i),
            customer: { name: `Customer ${skip + i}` },
            transaction: { amount: 1000 + skip + i },
            _count: { triggeredRules: 1 },
          }));

          mockedPrisma.dispute.count.mockResolvedValue(totalCount);

          if (sortBy === 'createdAt') {
            mockedPrisma.dispute.findMany.mockResolvedValue(mockDisputes as any);
          } else {
            // For priority/status sorting, service fetches all then slices
            const allDisputes = Array.from({ length: totalCount }, (_, i) => ({
              id: `dispute-${i}`,
              referenceNumber: `DSP-${String(i + 1).padStart(3, '0')}`,
              status: 'OPEN',
              priority: 'HIGH',
              ageIndicator: 'NEW',
              paymentType: 'CARD',
              issueCategory: 'DUPLICATE_DEBIT',
              recommendedAction: 'Immediate Reversal',
              createdAt: new Date(2024, 0, 1, 0, 0, 0, i),
              customer: { name: `Customer ${i}` },
              transaction: { amount: 1000 + i },
              _count: { triggeredRules: 1 },
            }));
            mockedPrisma.dispute.findMany.mockResolvedValue(allDisputes as any);
          }

          const params: DisputeQueryParams = {
            sortBy,
            sortOrder,
            page,
            pageSize,
          };

          const result = await queryDisputes(params);

          // Property: totalCount is an integer >= 0
          expect(result.totalCount).toBeDefined();
          expect(Number.isInteger(result.totalCount)).toBe(true);
          expect(result.totalCount).toBeGreaterThanOrEqual(0);

          // Property: page is an integer >= 1
          expect(result.page).toBeDefined();
          expect(Number.isInteger(result.page)).toBe(true);
          expect(result.page).toBeGreaterThanOrEqual(1);

          // Property: totalPages is an integer >= 0
          expect(result.totalPages).toBeDefined();
          expect(Number.isInteger(result.totalPages)).toBe(true);
          expect(result.totalPages).toBeGreaterThanOrEqual(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('response shape completeness holds with various filter combinations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 8 }), // number of disputes
        fc.option(fc.constantFrom('OPEN', 'TRIAGED', 'CLOSED'), { nil: undefined }),
        fc.option(fc.constantFrom('HIGH', 'MEDIUM', 'LOW'), { nil: undefined }),
        fc.option(fc.constantFrom('CARD', 'EFT', 'INTERNAL'), { nil: undefined }),
        fc.option(
          fc.constantFrom(
            'DUPLICATE_DEBIT',
            'FAILED_TRANSFER',
            'MISSING_PAYMENT',
            'UNAUTHORISED',
            'INCORRECT_AMOUNT',
            'CARD_DISPUTE',
          ),
          { nil: undefined },
        ),
        async (numDisputes, status, priority, paymentType, issueCategory) => {
          const mockDisputes = Array.from({ length: numDisputes }, (_, i) => ({
            id: `dispute-${i}`,
            referenceNumber: `DSP-${String(i + 1).padStart(3, '0')}`,
            status: status || 'OPEN',
            priority: priority || 'HIGH',
            ageIndicator: 'NEW',
            paymentType: paymentType || 'CARD',
            issueCategory: issueCategory || 'DUPLICATE_DEBIT',
            recommendedAction: 'Immediate Reversal',
            createdAt: new Date(2024, 0, 1 + i),
            customer: { name: `Customer ${i}` },
            transaction: { amount: 1000 + i * 100 },
            _count: { triggeredRules: i + 1 },
          }));

          mockedPrisma.dispute.count.mockResolvedValue(numDisputes);
          mockedPrisma.dispute.findMany.mockResolvedValue(mockDisputes as any);

          const params: DisputeQueryParams = {
            sortBy: 'createdAt',
            sortOrder: 'desc',
            page: 1,
            pageSize: 10,
            ...(status && { status }),
            ...(priority && { priority }),
            ...(paymentType && { paymentType }),
            ...(issueCategory && { issueCategory }),
          };

          const result = await queryDisputes(params);

          // Verify response metadata shape
          expect(result.totalCount).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(result.totalCount)).toBe(true);
          expect(result.page).toBeGreaterThanOrEqual(1);
          expect(Number.isInteger(result.page)).toBe(true);
          expect(result.totalPages).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(result.totalPages)).toBe(true);

          // Verify every dispute item has complete shape
          for (const dispute of result.disputes) {
            const requiredFields = [
              'id',
              'referenceNumber',
              'status',
              'priority',
              'ageIndicator',
              'paymentType',
              'issueCategory',
              'recommendedAction',
              'createdAt',
              'customerName',
              'transactionAmount',
              'triggeredRuleCount',
            ] as const;

            for (const field of requiredFields) {
              expect(dispute[field]).not.toBeNull();
              expect(dispute[field]).not.toBeUndefined();
            }

            // Verify correct types
            expect(typeof dispute.id).toBe('string');
            expect(typeof dispute.referenceNumber).toBe('string');
            expect(typeof dispute.status).toBe('string');
            expect(typeof dispute.priority).toBe('string');
            expect(typeof dispute.ageIndicator).toBe('string');
            expect(typeof dispute.paymentType).toBe('string');
            expect(typeof dispute.issueCategory).toBe('string');
            expect(typeof dispute.recommendedAction).toBe('string');
            expect(typeof dispute.createdAt).toBe('string');
            expect(typeof dispute.customerName).toBe('string');
            expect(typeof dispute.transactionAmount).toBe('number');
            expect(typeof dispute.triggeredRuleCount).toBe('number');
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
