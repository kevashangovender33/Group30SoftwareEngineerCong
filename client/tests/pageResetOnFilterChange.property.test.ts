import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDisputeHistory } from '../src/hooks/useDisputeHistory';
import type { DisputeFilters, SortField, SortOrder } from '../src/types/index';

/**
 * Feature: dispute-history-view, Property 13: Filter or sort change resets pagination to page 1
 *
 * Validates: Requirements 6.5
 *
 * For any current page number > 1, when any filter value changes or the sort
 * field/direction changes, the pagination state SHALL reset to page 1 before
 * issuing the new API request.
 */

const DEFAULT_FILTERS: DisputeFilters = {
  customerName: '',
  paymentType: '',
  issueCategory: '',
  priority: '',
  status: '',
  startDate: '',
  endDate: '',
};

const mockApiResponse = {
  disputes: [],
  totalCount: 50,
  page: 1,
  totalPages: 5,
};

// Arbitrary for generating a page number > 1
const pageAboveOneArb = fc.integer({ min: 2, max: 50 });

// Arbitrary for generating filter changes (non-customerName since that has debounce)
const filterChangeArb = fc.oneof(
  fc.record({
    field: fc.constant('paymentType' as const),
    value: fc.constantFrom('CARD', 'EFT', 'INTERNAL'),
  }),
  fc.record({
    field: fc.constant('issueCategory' as const),
    value: fc.constantFrom(
      'DUPLICATE_DEBIT',
      'FAILED_TRANSFER',
      'MISSING_PAYMENT',
      'UNAUTHORISED',
      'INCORRECT_AMOUNT',
      'CARD_DISPUTE'
    ),
  }),
  fc.record({
    field: fc.constant('priority' as const),
    value: fc.constantFrom('HIGH', 'MEDIUM', 'LOW'),
  }),
  fc.record({
    field: fc.constant('status' as const),
    value: fc.constantFrom('OPEN', 'TRIAGED', 'CLOSED'),
  }),
  fc.record({
    field: fc.constant('startDate' as const),
    value: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(
      (d) => d.toISOString().slice(0, 10)
    ),
  }),
  fc.record({
    field: fc.constant('endDate' as const),
    value: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(
      (d) => d.toISOString().slice(0, 10)
    ),
  })
);

// Arbitrary for sort field changes
const sortFieldChangeArb = fc.constantFrom<SortField>('createdAt', 'priority', 'status');

// Arbitrary for sort order changes
const sortOrderChangeArb = fc.constantFrom<SortOrder>('asc', 'desc');

describe('Feature: dispute-history-view, Property 13: Filter or sort change resets pagination to page 1', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let fetchCalls: string[];

  beforeEach(() => {
    vi.useFakeTimers();
    fetchCalls = [];
    fetchMock = vi.fn((url: string) => {
      fetchCalls.push(url);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      } as Response);
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should reset page to 1 when any filter value changes (100 iterations)', () => {
    fc.assert(
      fc.property(
        pageAboveOneArb,
        filterChangeArb,
        (initialPage, filterChange) => {
          fetchCalls = [];
          fetchMock.mockClear();

          // Render hook starting at page > 1
          const { result, rerender, unmount } = renderHook(
            (props: {
              filters: DisputeFilters;
              sortBy: SortField;
              sortOrder: SortOrder;
              page: number;
              pageSize: number;
            }) => useDisputeHistory(props),
            {
              initialProps: {
                filters: DEFAULT_FILTERS,
                sortBy: 'createdAt' as SortField,
                sortOrder: 'desc' as SortOrder,
                page: initialPage,
                pageSize: 10,
              },
            }
          );

          // Flush the initial fetch (advance timers past debounce)
          act(() => {
            vi.runAllTimers();
          });

          // Clear fetch calls to track only the next request
          fetchCalls = [];
          fetchMock.mockClear();

          // Apply a filter change while keeping the same page
          const updatedFilters: DisputeFilters = {
            ...DEFAULT_FILTERS,
            [filterChange.field]: filterChange.value,
          };

          rerender({
            filters: updatedFilters,
            sortBy: 'createdAt' as SortField,
            sortOrder: 'desc' as SortOrder,
            page: initialPage, // Parent still passes old page
            pageSize: 10,
          });

          // Flush timers to trigger effects and fetch
          act(() => {
            vi.runAllTimers();
          });

          // The fetch URL should NOT contain a page parameter > 1
          // (page=1 is omitted as it's the default) — confirms page was reset
          expect(fetchCalls.length).toBeGreaterThan(0);
          const lastFetchUrl = fetchCalls[fetchCalls.length - 1];
          const urlParams = new URLSearchParams(lastFetchUrl.split('?')[1] || '');
          const pageParam = urlParams.get('page');

          // Page should be either absent (default=1) or explicitly "1"
          expect(
            pageParam === null || pageParam === '1',
            `Expected page to be reset to 1, but got page=${pageParam} in URL: ${lastFetchUrl}`
          ).toBe(true);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reset page to 1 when sort field changes (100 iterations)', () => {
    fc.assert(
      fc.property(
        pageAboveOneArb,
        sortFieldChangeArb,
        (initialPage, newSortField) => {
          fetchCalls = [];
          fetchMock.mockClear();

          // Start with a different sort field to guarantee a change
          const initialSortBy: SortField =
            newSortField === 'createdAt' ? 'priority' : 'createdAt';

          const { rerender, unmount } = renderHook(
            (props: {
              filters: DisputeFilters;
              sortBy: SortField;
              sortOrder: SortOrder;
              page: number;
              pageSize: number;
            }) => useDisputeHistory(props),
            {
              initialProps: {
                filters: DEFAULT_FILTERS,
                sortBy: initialSortBy,
                sortOrder: 'desc' as SortOrder,
                page: initialPage,
                pageSize: 10,
              },
            }
          );

          // Flush the initial fetch
          act(() => {
            vi.runAllTimers();
          });

          // Clear fetch calls
          fetchCalls = [];
          fetchMock.mockClear();

          // Change sort field
          rerender({
            filters: DEFAULT_FILTERS,
            sortBy: newSortField,
            sortOrder: 'desc' as SortOrder,
            page: initialPage, // Parent still passes old page
            pageSize: 10,
          });

          // Flush timers
          act(() => {
            vi.runAllTimers();
          });

          // Verify page was reset to 1
          expect(fetchCalls.length).toBeGreaterThan(0);
          const lastFetchUrl = fetchCalls[fetchCalls.length - 1];
          const urlParams = new URLSearchParams(lastFetchUrl.split('?')[1] || '');
          const pageParam = urlParams.get('page');

          expect(
            pageParam === null || pageParam === '1',
            `Expected page to be reset to 1 after sort field change, but got page=${pageParam} in URL: ${lastFetchUrl}`
          ).toBe(true);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reset page to 1 when sort order changes (100 iterations)', () => {
    fc.assert(
      fc.property(
        pageAboveOneArb,
        sortOrderChangeArb,
        (initialPage, newSortOrder) => {
          fetchCalls = [];
          fetchMock.mockClear();

          // Start with the opposite sort order to ensure a change
          const initialSortOrder: SortOrder = newSortOrder === 'asc' ? 'desc' : 'asc';

          const { rerender, unmount } = renderHook(
            (props: {
              filters: DisputeFilters;
              sortBy: SortField;
              sortOrder: SortOrder;
              page: number;
              pageSize: number;
            }) => useDisputeHistory(props),
            {
              initialProps: {
                filters: DEFAULT_FILTERS,
                sortBy: 'createdAt' as SortField,
                sortOrder: initialSortOrder,
                page: initialPage,
                pageSize: 10,
              },
            }
          );

          // Flush the initial fetch
          act(() => {
            vi.runAllTimers();
          });

          // Clear fetch calls
          fetchCalls = [];
          fetchMock.mockClear();

          // Change sort order
          rerender({
            filters: DEFAULT_FILTERS,
            sortBy: 'createdAt' as SortField,
            sortOrder: newSortOrder,
            page: initialPage, // Parent still passes old page
            pageSize: 10,
          });

          // Flush timers
          act(() => {
            vi.runAllTimers();
          });

          // Verify page was reset to 1
          expect(fetchCalls.length).toBeGreaterThan(0);
          const lastFetchUrl = fetchCalls[fetchCalls.length - 1];
          const urlParams = new URLSearchParams(lastFetchUrl.split('?')[1] || '');
          const pageParam = urlParams.get('page');

          expect(
            pageParam === null || pageParam === '1',
            `Expected page to be reset to 1 after sort order change, but got page=${pageParam} in URL: ${lastFetchUrl}`
          ).toBe(true);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
