// Status lifecycle service for dispute management
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5

export type DisputeStatus = 'OPEN' | 'TRIAGED' | 'CLOSED';

/**
 * Determines the initial status and resolvedAt timestamp for a dispute
 * based on the triage recommendation code.
 *
 * - CLOSE_RESOLVED → status=CLOSED, resolvedAt=now
 * - Any other code → status=TRIAGED, resolvedAt=null
 */
export function determineInitialStatus(recommendationCode: string): {
  status: DisputeStatus;
  resolvedAt: Date | null;
} {
  if (recommendationCode === 'CLOSE_RESOLVED') {
    return { status: 'CLOSED', resolvedAt: new Date() };
  }

  return { status: 'TRIAGED', resolvedAt: null };
}

// Valid status transitions: OPEN→TRIAGED, OPEN→CLOSED, TRIAGED→CLOSED
const VALID_TRANSITIONS: ReadonlyMap<DisputeStatus, ReadonlySet<DisputeStatus>> = new Map([
  ['OPEN', new Set<DisputeStatus>(['TRIAGED', 'CLOSED'])],
  ['TRIAGED', new Set<DisputeStatus>(['CLOSED'])],
  ['CLOSED', new Set<DisputeStatus>([])],
]);

/**
 * Validates whether a status transition from `current` to `next` is allowed.
 *
 * Allowed transitions:
 * - OPEN → TRIAGED
 * - OPEN → CLOSED
 * - TRIAGED → CLOSED
 *
 * All other transitions (including self-transitions) are rejected.
 */
export function validateStatusTransition(
  current: DisputeStatus,
  next: DisputeStatus
): boolean {
  const allowedNextStates = VALID_TRANSITIONS.get(current);

  if (!allowedNextStates) {
    return false;
  }

  return allowedNextStates.has(next);
}
