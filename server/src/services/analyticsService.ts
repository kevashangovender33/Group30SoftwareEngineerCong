import { prisma } from '../lib/prisma.js';

export interface AnalyticsBreakdown {
  label: string;
  count: number;
}

export interface AnalyticsSummary {
  totalDisputes: number;
  openDisputes: number;
  resolvedDisputes: number;
  highPriorityDisputes: number;
}

export interface AnalyticsResponse {
  paymentType: AnalyticsBreakdown[];
  issueCategory: AnalyticsBreakdown[];
  status: AnalyticsBreakdown[];
  priority: AnalyticsBreakdown[];
  summary: AnalyticsSummary;
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  CARD: 'Card',
  EFT: 'EFT',
  INTERNAL: 'Internal Transfer',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  TRIAGED: 'Triaged',
  CLOSED: 'Closed',
};

const PRIORITY_LABELS: Record<string, string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

/**
 * Converts an UPPER_SNAKE_CASE string to Title Case with spaces.
 * e.g. "DUPLICATE_DEBIT" → "Duplicate Debit"
 */
export function formatIssueCategoryLabel(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Builds a complete breakdown for a fixed-enum dimension, ensuring all labels
 * are present even if their count is 0.
 */
function buildFixedBreakdown(
  groupedData: { _count: { _all: number }; [key: string]: unknown }[],
  field: string,
  labelMap: Record<string, string>
): AnalyticsBreakdown[] {
  const countMap = new Map<string, number>();

  for (const entry of groupedData) {
    const key = entry[field] as string;
    countMap.set(key, entry._count._all);
  }

  return Object.entries(labelMap).map(([dbValue, label]) => ({
    label,
    count: countMap.get(dbValue) ?? 0,
  }));
}

/**
 * Retrieves aggregated dispute analytics from the database.
 * Computes all counts fresh on each request (no caching).
 */
export async function getAnalytics(): Promise<AnalyticsResponse> {
  // Run all queries in parallel for performance
  const [
    paymentTypeGroups,
    issueCategoryGroups,
    statusGroups,
    priorityGroups,
    totalDisputes,
    openDisputes,
    resolvedDisputes,
    highPriorityDisputes,
  ] = await Promise.all([
    prisma.dispute.groupBy({
      by: ['paymentType'],
      _count: { _all: true },
    }),
    prisma.dispute.groupBy({
      by: ['issueCategory'],
      _count: { _all: true },
    }),
    prisma.dispute.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.dispute.groupBy({
      by: ['priority'],
      _count: { _all: true },
    }),
    prisma.dispute.count(),
    prisma.dispute.count({ where: { status: 'OPEN' } }),
    prisma.dispute.count({ where: { status: 'CLOSED' } }),
    prisma.dispute.count({ where: { priority: 'HIGH' } }),
  ]);

  // Build fixed-enum breakdowns (always include all labels)
  const paymentType = buildFixedBreakdown(
    paymentTypeGroups as unknown as { _count: { _all: number }; [key: string]: unknown }[],
    'paymentType',
    PAYMENT_TYPE_LABELS
  );

  const status = buildFixedBreakdown(
    statusGroups as unknown as { _count: { _all: number }; [key: string]: unknown }[],
    'status',
    STATUS_LABELS
  );

  const priority = buildFixedBreakdown(
    priorityGroups as unknown as { _count: { _all: number }; [key: string]: unknown }[],
    'priority',
    PRIORITY_LABELS
  );

  // Build issue category breakdown (only include categories with count > 0)
  const issueCategory: AnalyticsBreakdown[] = (
    issueCategoryGroups as unknown as { _count: { _all: number }; issueCategory: string }[]
  ).map((entry) => ({
    label: formatIssueCategoryLabel(entry.issueCategory),
    count: entry._count._all,
  }));

  return {
    paymentType,
    issueCategory,
    status,
    priority,
    summary: {
      totalDisputes,
      openDisputes,
      resolvedDisputes,
      highPriorityDisputes,
    },
  };
}
