import { describe, it, expect } from 'vitest';
import { validateDisputeQueryParams } from '../src/services/disputeQueryValidator.js';

describe('validateDisputeQueryParams', () => {
  describe('defaults', () => {
    it('returns valid with defaults when no params provided', () => {
      const result = validateDisputeQueryParams({});
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.params.sortBy).toBe('createdAt');
        expect(result.params.sortOrder).toBe('desc');
        expect(result.params.page).toBe(1);
        expect(result.params.pageSize).toBe(10);
      }
    });

    it('returns valid with defaults when empty strings provided', () => {
      const result = validateDisputeQueryParams({
        status: '',
        priority: '',
        paymentType: '',
        issueCategory: '',
        startDate: '',
        endDate: '',
        page: '',
        pageSize: '',
        sortBy: '',
        sortOrder: '',
        customerName: '',
      });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.params.status).toBeUndefined();
        expect(result.params.priority).toBeUndefined();
        expect(result.params.paymentType).toBeUndefined();
        expect(result.params.issueCategory).toBeUndefined();
        expect(result.params.startDate).toBeUndefined();
        expect(result.params.endDate).toBeUndefined();
        expect(result.params.customerName).toBeUndefined();
        expect(result.params.sortBy).toBe('createdAt');
        expect(result.params.sortOrder).toBe('desc');
        expect(result.params.page).toBe(1);
        expect(result.params.pageSize).toBe(10);
      }
    });
  });

  describe('enum validation', () => {
    it('accepts valid status values', () => {
      for (const status of ['OPEN', 'TRIAGED', 'CLOSED']) {
        const result = validateDisputeQueryParams({ status });
        expect(result.valid).toBe(true);
        if (result.valid) expect(result.params.status).toBe(status);
      }
    });

    it('rejects invalid status', () => {
      const result = validateDisputeQueryParams({ status: 'INVALID' });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('status');
        expect(result.error.message).toContain('OPEN, TRIAGED, or CLOSED');
      }
    });

    it('accepts valid priority values', () => {
      for (const priority of ['HIGH', 'MEDIUM', 'LOW']) {
        const result = validateDisputeQueryParams({ priority });
        expect(result.valid).toBe(true);
        if (result.valid) expect(result.params.priority).toBe(priority);
      }
    });

    it('rejects invalid priority', () => {
      const result = validateDisputeQueryParams({ priority: 'CRITICAL' });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('priority');
        expect(result.error.message).toContain('HIGH, MEDIUM, or LOW');
      }
    });

    it('accepts valid paymentType values', () => {
      for (const paymentType of ['CARD', 'EFT', 'INTERNAL']) {
        const result = validateDisputeQueryParams({ paymentType });
        expect(result.valid).toBe(true);
        if (result.valid) expect(result.params.paymentType).toBe(paymentType);
      }
    });

    it('rejects invalid paymentType', () => {
      const result = validateDisputeQueryParams({ paymentType: 'CASH' });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('paymentType');
        expect(result.error.message).toContain('CARD, EFT, or INTERNAL');
      }
    });

    it('accepts valid issueCategory values', () => {
      const categories = [
        'DUPLICATE_DEBIT',
        'FAILED_TRANSFER',
        'MISSING_PAYMENT',
        'UNAUTHORISED',
        'INCORRECT_AMOUNT',
        'CARD_DISPUTE',
      ];
      for (const issueCategory of categories) {
        const result = validateDisputeQueryParams({ issueCategory });
        expect(result.valid).toBe(true);
        if (result.valid) expect(result.params.issueCategory).toBe(issueCategory);
      }
    });

    it('rejects invalid issueCategory', () => {
      const result = validateDisputeQueryParams({ issueCategory: 'FRAUD' });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('issueCategory');
        expect(result.error.message).toContain('issueCategory');
      }
    });
  });

  describe('date validation', () => {
    it('accepts valid ISO date format', () => {
      const result = validateDisputeQueryParams({ startDate: '2024-06-15' });
      expect(result.valid).toBe(true);
      if (result.valid) expect(result.params.startDate).toBe('2024-06-15');
    });

    it('rejects invalid date format', () => {
      const result = validateDisputeQueryParams({ startDate: '15/06/2024' });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('startDate');
        expect(result.error.message).toContain('YYYY-MM-DD');
      }
    });

    it('rejects invalid date values (e.g., Feb 30)', () => {
      const result = validateDisputeQueryParams({ startDate: '2024-02-30' });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('startDate');
      }
    });

    it('rejects invalid endDate format', () => {
      const result = validateDisputeQueryParams({ endDate: 'not-a-date' });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('endDate');
        expect(result.error.message).toContain('YYYY-MM-DD');
      }
    });

    it('accepts startDate equal to endDate', () => {
      const result = validateDisputeQueryParams({
        startDate: '2024-06-15',
        endDate: '2024-06-15',
      });
      expect(result.valid).toBe(true);
    });

    it('accepts startDate before endDate', () => {
      const result = validateDisputeQueryParams({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      expect(result.valid).toBe(true);
    });

    it('rejects startDate after endDate', () => {
      const result = validateDisputeQueryParams({
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('startDate');
        expect(result.error.message).toContain('before or equal to endDate');
      }
    });
  });

  describe('pagination validation', () => {
    it('accepts valid page number', () => {
      const result = validateDisputeQueryParams({ page: '5' });
      expect(result.valid).toBe(true);
      if (result.valid) expect(result.params.page).toBe(5);
    });

    it('rejects page less than 1', () => {
      const result = validateDisputeQueryParams({ page: '0' });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('page');
        expect(result.error.message).toContain('>= 1');
      }
    });

    it('rejects non-integer page', () => {
      const result = validateDisputeQueryParams({ page: '1.5' });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('page');
      }
    });

    it('rejects negative page', () => {
      const result = validateDisputeQueryParams({ page: '-1' });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('page');
      }
    });

    it('accepts valid pageSize', () => {
      const result = validateDisputeQueryParams({ pageSize: '50' });
      expect(result.valid).toBe(true);
      if (result.valid) expect(result.params.pageSize).toBe(50);
    });

    it('accepts pageSize of 1', () => {
      const result = validateDisputeQueryParams({ pageSize: '1' });
      expect(result.valid).toBe(true);
      if (result.valid) expect(result.params.pageSize).toBe(1);
    });

    it('accepts pageSize of 100', () => {
      const result = validateDisputeQueryParams({ pageSize: '100' });
      expect(result.valid).toBe(true);
      if (result.valid) expect(result.params.pageSize).toBe(100);
    });

    it('rejects pageSize of 0', () => {
      const result = validateDisputeQueryParams({ pageSize: '0' });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('pageSize');
        expect(result.error.message).toContain('between 1 and 100');
      }
    });

    it('rejects pageSize over 100', () => {
      const result = validateDisputeQueryParams({ pageSize: '101' });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('pageSize');
        expect(result.error.message).toContain('between 1 and 100');
      }
    });

    it('rejects non-numeric page', () => {
      const result = validateDisputeQueryParams({ page: 'abc' });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('page');
      }
    });
  });

  describe('sort validation', () => {
    it('accepts valid sortBy values', () => {
      for (const sortBy of ['createdAt', 'priority', 'status']) {
        const result = validateDisputeQueryParams({ sortBy });
        expect(result.valid).toBe(true);
        if (result.valid) expect(result.params.sortBy).toBe(sortBy);
      }
    });

    it('rejects invalid sortBy', () => {
      const result = validateDisputeQueryParams({ sortBy: 'amount' });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('sortBy');
        expect(result.error.message).toContain('createdAt, priority, or status');
      }
    });

    it('accepts valid sortOrder values', () => {
      for (const sortOrder of ['asc', 'desc']) {
        const result = validateDisputeQueryParams({ sortOrder });
        expect(result.valid).toBe(true);
        if (result.valid) expect(result.params.sortOrder).toBe(sortOrder);
      }
    });

    it('rejects invalid sortOrder', () => {
      const result = validateDisputeQueryParams({ sortOrder: 'random' });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('sortOrder');
        expect(result.error.message).toContain('asc or desc');
      }
    });
  });

  describe('customerName validation', () => {
    it('accepts valid customer name', () => {
      const result = validateDisputeQueryParams({ customerName: 'John' });
      expect(result.valid).toBe(true);
      if (result.valid) expect(result.params.customerName).toBe('John');
    });

    it('trims whitespace from customer name', () => {
      const result = validateDisputeQueryParams({ customerName: '  Jane  ' });
      expect(result.valid).toBe(true);
      if (result.valid) expect(result.params.customerName).toBe('Jane');
    });

    it('rejects customer name that is only whitespace', () => {
      const result = validateDisputeQueryParams({ customerName: '   ' });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('customerName');
        expect(result.error.message).toContain('at least 1 character');
      }
    });
  });

  describe('combined valid params', () => {
    it('accepts all valid params together', () => {
      const result = validateDisputeQueryParams({
        customerName: 'Jane',
        status: 'OPEN',
        priority: 'HIGH',
        paymentType: 'CARD',
        issueCategory: 'DUPLICATE_DEBIT',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        sortBy: 'priority',
        sortOrder: 'asc',
        page: '2',
        pageSize: '25',
      });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.params).toEqual({
          customerName: 'Jane',
          status: 'OPEN',
          priority: 'HIGH',
          paymentType: 'CARD',
          issueCategory: 'DUPLICATE_DEBIT',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          sortBy: 'priority',
          sortOrder: 'asc',
          page: 2,
          pageSize: 25,
        });
      }
    });
  });
});
