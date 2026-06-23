import { describe, it, expect } from 'vitest';
import {
  determineInitialStatus,
  validateStatusTransition,
} from '../src/services/statusLifecycle.js';

describe('statusLifecycle — determineInitialStatus()', () => {
  it('CLOSE_RESOLVED → status CLOSED with non-null resolvedAt', () => {
    const result = determineInitialStatus('CLOSE_RESOLVED');
    expect(result.status).toBe('CLOSED');
    expect(result.resolvedAt).toBeInstanceOf(Date);
  });

  it('ESCALATE_FRAUD → status TRIAGED with null resolvedAt', () => {
    const result = determineInitialStatus('ESCALATE_FRAUD');
    expect(result.status).toBe('TRIAGED');
    expect(result.resolvedAt).toBeNull();
  });

  it('IMMEDIATE_REVERSAL → status TRIAGED with null resolvedAt', () => {
    const result = determineInitialStatus('IMMEDIATE_REVERSAL');
    expect(result.status).toBe('TRIAGED');
    expect(result.resolvedAt).toBeNull();
  });

  it('MONITOR_24H → status TRIAGED with null resolvedAt', () => {
    const result = determineInitialStatus('MONITOR_24H');
    expect(result.status).toBe('TRIAGED');
    expect(result.resolvedAt).toBeNull();
  });

  it('ESCALATE_SENIOR → status TRIAGED with null resolvedAt', () => {
    const result = determineInitialStatus('ESCALATE_SENIOR');
    expect(result.status).toBe('TRIAGED');
    expect(result.resolvedAt).toBeNull();
  });

  it('INVESTIGATE → status TRIAGED with null resolvedAt', () => {
    const result = determineInitialStatus('INVESTIGATE');
    expect(result.status).toBe('TRIAGED');
    expect(result.resolvedAt).toBeNull();
  });

  it('REFER_PAYMENTS → status TRIAGED with null resolvedAt', () => {
    const result = determineInitialStatus('REFER_PAYMENTS');
    expect(result.status).toBe('TRIAGED');
    expect(result.resolvedAt).toBeNull();
  });
});

describe('statusLifecycle — validateStatusTransition()', () => {
  describe('transitions from OPEN', () => {
    it('OPEN → OPEN → false (self-transition not allowed)', () => {
      expect(validateStatusTransition('OPEN', 'OPEN')).toBe(false);
    });

    it('OPEN → TRIAGED → true', () => {
      expect(validateStatusTransition('OPEN', 'TRIAGED')).toBe(true);
    });

    it('OPEN → CLOSED → true', () => {
      expect(validateStatusTransition('OPEN', 'CLOSED')).toBe(true);
    });
  });

  describe('transitions from TRIAGED', () => {
    it('TRIAGED → OPEN → false (backward transition not allowed)', () => {
      expect(validateStatusTransition('TRIAGED', 'OPEN')).toBe(false);
    });

    it('TRIAGED → TRIAGED → false (self-transition not allowed)', () => {
      expect(validateStatusTransition('TRIAGED', 'TRIAGED')).toBe(false);
    });

    it('TRIAGED → CLOSED → true', () => {
      expect(validateStatusTransition('TRIAGED', 'CLOSED')).toBe(true);
    });
  });

  describe('transitions from CLOSED', () => {
    it('CLOSED → OPEN → false (terminal state)', () => {
      expect(validateStatusTransition('CLOSED', 'OPEN')).toBe(false);
    });

    it('CLOSED → TRIAGED → false (terminal state)', () => {
      expect(validateStatusTransition('CLOSED', 'TRIAGED')).toBe(false);
    });

    it('CLOSED → CLOSED → false (terminal state)', () => {
      expect(validateStatusTransition('CLOSED', 'CLOSED')).toBe(false);
    });
  });
});
