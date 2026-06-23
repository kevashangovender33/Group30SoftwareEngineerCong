import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { computePageRange } from '../src/components/PaginationControls';

describe('Feature: dispute-history-view, Property 7: Pagination page buttons computation', () => {
  /**
   * Validates: Requirements 6.2
   *
   * For any values of currentPage (≥ 1) and totalPages (≥ 1), the pagination control
   * SHALL display at most 5 page number buttons, centered around currentPage.
   * The first displayed page SHALL be max(1, currentPage - 2) and the last SHALL be
   * min(totalPages, firstPage + 4), with the range adjusted to always show up to 5
   * pages when totalPages ≥ 5.
   */

  it('should return at most 5 page buttons for any currentPage and totalPages', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (currentPage, totalPages) => {
          const result = computePageRange(currentPage, totalPages);
          expect(result.length).toBeLessThanOrEqual(5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return all elements between 1 and totalPages inclusive', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (currentPage, totalPages) => {
          const result = computePageRange(currentPage, totalPages);
          for (const page of result) {
            expect(page).toBeGreaterThanOrEqual(1);
            expect(page).toBeLessThanOrEqual(totalPages);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return exactly 5 elements when totalPages >= 5', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 5, max: 1000 }),
        (currentPage, totalPages) => {
          // Ensure currentPage is within valid bounds
          const clampedCurrentPage = Math.min(currentPage, totalPages);
          const result = computePageRange(clampedCurrentPage, totalPages);
          expect(result.length).toBe(5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include currentPage in the range when currentPage <= totalPages', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (currentPage, totalPages) => {
          // Only test when currentPage is valid (within totalPages)
          if (currentPage <= totalPages) {
            const result = computePageRange(currentPage, totalPages);
            expect(result).toContain(currentPage);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return consecutive page numbers (each one more than the previous)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (currentPage, totalPages) => {
          const result = computePageRange(currentPage, totalPages);
          for (let i = 1; i < result.length; i++) {
            expect(result[i]).toBe(result[i - 1] + 1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
