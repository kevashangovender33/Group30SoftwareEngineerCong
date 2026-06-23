import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateDisputeQueryParams } from '../src/services/disputeQueryValidator.js';

/**
 * Feature: dispute-history-view, Property 9: Invalid enum parameter returns HTTP 400
 *
 * Validates: Requirements 10.5, 10.3
 *
 * For any string value that is NOT a member of the valid enum set for a given
 * parameter (status, priority, paymentType, issueCategory), the validator SHALL
 * return an error identifying the invalid parameter.
 */

const VALID_STATUSES = ['OPEN', 'TRIAGED', 'CLOSED'];
const VALID_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];
const VALID_PAYMENT_TYPES = ['CARD', 'EFT', 'INTERNAL'];
const VALID_ISSUE_CATEGORIES = [
  'DUPLICATE_DEBIT',
  'FAILED_TRANSFER',
  'MISSING_PAYMENT',
  'UNAUTHORISED',
  'INCORRECT_AMOUNT',
  'CARD_DISPUTE',
];

describe('Feature: dispute-history-view, Property 9: Invalid enum parameter returns HTTP 400', () => {
  it('any string not in {OPEN, TRIAGED, CLOSED} for status returns a validation error identifying the status field', () => {
    /**
     * Validates: Requirements 10.5, 10.3
     */
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1 })
          .filter((s) => !VALID_STATUSES.includes(s)),
        (invalidStatus) => {
          const result = validateDisputeQueryParams({ status: invalidStatus });
          expect(result.valid).toBe(false);
          if (!result.valid) {
            expect(result.error.field).toBe('status');
            expect(result.error.message).toContain('status');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('any string not in {HIGH, MEDIUM, LOW} for priority returns a validation error identifying the priority field', () => {
    /**
     * Validates: Requirements 10.5, 10.3
     */
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1 })
          .filter((s) => !VALID_PRIORITIES.includes(s)),
        (invalidPriority) => {
          const result = validateDisputeQueryParams({ priority: invalidPriority });
          expect(result.valid).toBe(false);
          if (!result.valid) {
            expect(result.error.field).toBe('priority');
            expect(result.error.message).toContain('priority');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('any string not in {CARD, EFT, INTERNAL} for paymentType returns a validation error identifying the paymentType field', () => {
    /**
     * Validates: Requirements 10.5, 10.3
     */
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1 })
          .filter((s) => !VALID_PAYMENT_TYPES.includes(s)),
        (invalidPaymentType) => {
          const result = validateDisputeQueryParams({ paymentType: invalidPaymentType });
          expect(result.valid).toBe(false);
          if (!result.valid) {
            expect(result.error.field).toBe('paymentType');
            expect(result.error.message).toContain('paymentType');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('any string not in the valid issue category set returns a validation error identifying the issueCategory field', () => {
    /**
     * Validates: Requirements 10.5, 10.3
     */
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1 })
          .filter((s) => !VALID_ISSUE_CATEGORIES.includes(s)),
        (invalidCategory) => {
          const result = validateDisputeQueryParams({ issueCategory: invalidCategory });
          expect(result.valid).toBe(false);
          if (!result.valid) {
            expect(result.error.field).toBe('issueCategory');
            expect(result.error.message).toContain('issueCategory');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('valid enum values for all parameters are accepted by the validator', () => {
    /**
     * Validates: Requirements 10.5, 10.3
     *
     * Counterpart property: valid enum values should always pass validation.
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_STATUSES),
        fc.constantFrom(...VALID_PRIORITIES),
        fc.constantFrom(...VALID_PAYMENT_TYPES),
        fc.constantFrom(...VALID_ISSUE_CATEGORIES),
        (status, priority, paymentType, issueCategory) => {
          const result = validateDisputeQueryParams({
            status,
            priority,
            paymentType,
            issueCategory,
          });
          expect(result.valid).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
