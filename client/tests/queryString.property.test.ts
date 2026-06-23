import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildQueryString, UseDisputeHistoryParams } from '../src/hooks/useDisputeHistory';

describe('Feature: dispute-history-view, Property 12: Query string omits unset parameters', () => {
  /**
   * Validates: Requirements 10.2
   *
   * For any client filter state, the constructed API request URL SHALL include only
   * parameters whose values are non-empty strings or non-default values. Parameters
   * with empty string values, null, or undefined SHALL be omitted from the query string entirely.
   */

  // Arbitraries for generating filter states
  const paymentTypeArb = fc.constantFrom('', 'CARD', 'EFT', 'INTERNAL');
  const issueCategoryArb = fc.constantFrom(
    '',
    'DUPLICATE_DEBIT',
    'FAILED_TRANSFER',
    'MISSING_PAYMENT',
    'UNAUTHORISED',
    'INCORRECT_AMOUNT',
    'CARD_DISPUTE'
  );
  const priorityArb = fc.constantFrom('', 'HIGH', 'MEDIUM', 'LOW');
  const statusArb = fc.constantFrom('', 'OPEN', 'TRIAGED', 'CLOSED');
  const sortFieldArb = fc.constantFrom('createdAt' as const, 'priority' as const, 'status' as const);
  const sortOrderArb = fc.constantFrom('asc' as const, 'desc' as const);
  const dateStringArb = fc.constantFrom('', '2024-01-01', '2024-06-15', '2025-12-31');
  const customerNameArb = fc.constantFrom('', '  ', 'John', 'Jane Doe', ' Alice ');
  const pageArb = fc.integer({ min: 1, max: 50 });
  const pageSizeArb = fc.constantFrom(5, 10, 20, 50, 100);
  const customerIdArb = fc.constantFrom(undefined, '', 'cust-123', 'cust-456');

  const paramsArb: fc.Arbitrary<UseDisputeHistoryParams> = fc.record({
    filters: fc.record({
      customerName: customerNameArb,
      paymentType: paymentTypeArb,
      issueCategory: issueCategoryArb,
      priority: priorityArb,
      status: statusArb,
      startDate: dateStringArb,
      endDate: dateStringArb,
    }),
    sortBy: sortFieldArb,
    sortOrder: sortOrderArb,
    page: pageArb,
    pageSize: pageSizeArb,
    customerId: customerIdArb,
  });

  it('should never include parameters with empty string values in the query string', () => {
    fc.assert(
      fc.property(paramsArb, (params) => {
        const qs = buildQueryString(params);

        if (qs === '') return; // No query string at all — valid

        const searchParams = new URLSearchParams(qs.replace(/^\?/, ''));

        // Every parameter present in the query string must have a non-empty value
        for (const [key, value] of searchParams.entries()) {
          expect(value.trim()).not.toBe('');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should omit customerName when it is empty or whitespace-only', () => {
    fc.assert(
      fc.property(paramsArb, (params) => {
        const qs = buildQueryString(params);
        const searchParams = new URLSearchParams(qs.replace(/^\?/, ''));

        if (!params.filters.customerName.trim()) {
          expect(searchParams.has('customerName')).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should omit enum filters when they are empty strings', () => {
    fc.assert(
      fc.property(paramsArb, (params) => {
        const qs = buildQueryString(params);
        const searchParams = new URLSearchParams(qs.replace(/^\?/, ''));

        if (!params.filters.paymentType) {
          expect(searchParams.has('paymentType')).toBe(false);
        }
        if (!params.filters.issueCategory) {
          expect(searchParams.has('issueCategory')).toBe(false);
        }
        if (!params.filters.priority) {
          expect(searchParams.has('priority')).toBe(false);
        }
        if (!params.filters.status) {
          expect(searchParams.has('status')).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should omit date filters when they are empty strings', () => {
    fc.assert(
      fc.property(paramsArb, (params) => {
        const qs = buildQueryString(params);
        const searchParams = new URLSearchParams(qs.replace(/^\?/, ''));

        if (!params.filters.startDate) {
          expect(searchParams.has('startDate')).toBe(false);
        }
        if (!params.filters.endDate) {
          expect(searchParams.has('endDate')).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should omit sortBy when it equals the default "createdAt"', () => {
    fc.assert(
      fc.property(paramsArb, (params) => {
        const qs = buildQueryString(params);
        const searchParams = new URLSearchParams(qs.replace(/^\?/, ''));

        if (params.sortBy === 'createdAt') {
          expect(searchParams.has('sortBy')).toBe(false);
        } else {
          expect(searchParams.get('sortBy')).toBe(params.sortBy);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should omit sortOrder when it equals the default "desc"', () => {
    fc.assert(
      fc.property(paramsArb, (params) => {
        const qs = buildQueryString(params);
        const searchParams = new URLSearchParams(qs.replace(/^\?/, ''));

        if (params.sortOrder === 'desc') {
          expect(searchParams.has('sortOrder')).toBe(false);
        } else {
          expect(searchParams.get('sortOrder')).toBe(params.sortOrder);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should omit page when it equals the default value of 1', () => {
    fc.assert(
      fc.property(paramsArb, (params) => {
        const qs = buildQueryString(params);
        const searchParams = new URLSearchParams(qs.replace(/^\?/, ''));

        if (params.page === 1) {
          expect(searchParams.has('page')).toBe(false);
        } else {
          expect(searchParams.get('page')).toBe(String(params.page));
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should omit pageSize when it equals the default value of 10', () => {
    fc.assert(
      fc.property(paramsArb, (params) => {
        const qs = buildQueryString(params);
        const searchParams = new URLSearchParams(qs.replace(/^\?/, ''));

        if (params.pageSize === 10) {
          expect(searchParams.has('pageSize')).toBe(false);
        } else {
          expect(searchParams.get('pageSize')).toBe(String(params.pageSize));
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should omit customerId when it is undefined or empty', () => {
    fc.assert(
      fc.property(paramsArb, (params) => {
        const qs = buildQueryString(params);
        const searchParams = new URLSearchParams(qs.replace(/^\?/, ''));

        if (!params.customerId) {
          expect(searchParams.has('customerId')).toBe(false);
        } else {
          expect(searchParams.get('customerId')).toBe(params.customerId);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should include only non-empty, non-default parameters (comprehensive check)', () => {
    fc.assert(
      fc.property(paramsArb, (params) => {
        const qs = buildQueryString(params);
        const searchParams = new URLSearchParams(qs.replace(/^\?/, ''));

        // Count expected parameters
        let expectedCount = 0;
        if (params.filters.customerName.trim()) expectedCount++;
        if (params.filters.paymentType) expectedCount++;
        if (params.filters.issueCategory) expectedCount++;
        if (params.filters.priority) expectedCount++;
        if (params.filters.status) expectedCount++;
        if (params.filters.startDate) expectedCount++;
        if (params.filters.endDate) expectedCount++;
        if (params.sortBy !== 'createdAt') expectedCount++;
        if (params.sortOrder !== 'desc') expectedCount++;
        if (params.page > 1) expectedCount++;
        if (params.pageSize !== 10) expectedCount++;
        if (params.customerId) expectedCount++;

        // Actual parameter count should match expected
        const actualKeys = Array.from(searchParams.keys());
        expect(actualKeys.length).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });
});
