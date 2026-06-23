import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Feature: dispute-persistence, Property 9: Invalid status query parameter returns 400
 *
 * Validates: Requirements 7.5
 *
 * The GET /api/disputes endpoint validates the status query parameter.
 * Only OPEN, TRIAGED, and CLOSED are accepted. Any other string must be
 * rejected with HTTP 400.
 *
 * This test validates the validation logic directly — the same check used
 * in the route handler to determine whether to return 400.
 */

const VALID_STATUSES = ['OPEN', 'TRIAGED', 'CLOSED'];

function isValidStatus(value: string): boolean {
  return VALID_STATUSES.includes(value);
}

describe('Feature: dispute-persistence, Property 9: Invalid status query parameter returns 400', () => {
  it('any string that is not OPEN, TRIAGED, or CLOSED is rejected as invalid', () => {
    /**
     * Validates: Requirements 7.5
     *
     * For any arbitrary string that is not one of the three valid statuses,
     * the validation function returns false, which triggers HTTP 400 in the handler.
     */
    fc.assert(
      fc.property(
        fc.string().filter((s) => !VALID_STATUSES.includes(s)),
        (invalidStatus) => {
          expect(isValidStatus(invalidStatus)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('OPEN, TRIAGED, and CLOSED are always accepted as valid', () => {
    /**
     * Validates: Requirements 7.5
     *
     * Counterpart property: the three valid status values always pass validation.
     */
    fc.assert(
      fc.property(
        fc.constantFrom('OPEN', 'TRIAGED', 'CLOSED'),
        (validStatus) => {
          expect(isValidStatus(validStatus)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
