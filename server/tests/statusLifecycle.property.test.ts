import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { determineInitialStatus } from '../src/services/statusLifecycle.js';

describe('Feature: dispute-persistence, Property 2: Status lifecycle is determined by recommendation code', () => {
  /**
   * Validates: Requirements 3.1, 3.2, 3.3
   *
   * Property: For any recommendationCode === 'CLOSE_RESOLVED', the status
   * must be CLOSED and resolvedAt must be a non-null Date. For any other
   * recommendationCode string, the status must be TRIAGED and resolvedAt
   * must be null.
   */

  it('CLOSE_RESOLVED always produces status=CLOSED with non-null resolvedAt', () => {
    fc.assert(
      fc.property(fc.constant('CLOSE_RESOLVED'), (code) => {
        const result = determineInitialStatus(code);
        expect(result.status).toBe('CLOSED');
        expect(result.resolvedAt).not.toBeNull();
        expect(result.resolvedAt).toBeInstanceOf(Date);
      }),
      { numRuns: 100 }
    );
  });

  it('any recommendationCode other than CLOSE_RESOLVED produces status=TRIAGED with resolvedAt=null', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'CLOSE_RESOLVED'),
        (code) => {
          const result = determineInitialStatus(code);
          expect(result.status).toBe('TRIAGED');
          expect(result.resolvedAt).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
