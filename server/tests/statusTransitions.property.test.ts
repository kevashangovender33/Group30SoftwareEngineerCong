import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateStatusTransition, DisputeStatus } from '../src/services/statusLifecycle.js';

/**
 * Feature: dispute-persistence, Property 3: Status field is restricted to valid values and transitions
 * Validates: Requirements 3.4, 3.5
 */
describe('Feature: dispute-persistence, Property 3: Status field is restricted to valid values and transitions', () => {
  const VALID_STATUSES: DisputeStatus[] = ['OPEN', 'TRIAGED', 'CLOSED'];

  const VALID_TRANSITIONS: [DisputeStatus, DisputeStatus][] = [
    ['OPEN', 'TRIAGED'],
    ['OPEN', 'CLOSED'],
    ['TRIAGED', 'CLOSED'],
  ];

  it('should reject invalid status values passed as current status', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !VALID_STATUSES.includes(s as DisputeStatus)),
        fc.constantFrom(...VALID_STATUSES),
        (invalidCurrent, validNext) => {
          const result = validateStatusTransition(
            invalidCurrent as DisputeStatus,
            validNext,
          );
          expect(result).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should accept only the three valid transitions: OPEN→TRIAGED, OPEN→CLOSED, TRIAGED→CLOSED', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_TRANSITIONS),
        ([current, next]) => {
          const result = validateStatusTransition(current, next);
          expect(result).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should reject all invalid transitions between valid statuses (including self-transitions)', () => {
    // All pairs of valid statuses that are NOT in the valid transitions list
    const invalidPairs: [DisputeStatus, DisputeStatus][] = [];
    for (const current of VALID_STATUSES) {
      for (const next of VALID_STATUSES) {
        const isValid = VALID_TRANSITIONS.some(
          ([c, n]) => c === current && n === next,
        );
        if (!isValid) {
          invalidPairs.push([current, next]);
        }
      }
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...invalidPairs),
        ([current, next]) => {
          const result = validateStatusTransition(current, next);
          expect(result).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
