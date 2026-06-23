import { prisma } from '../lib/prisma.js';
import type { DisputeQueryParams } from './disputeQueryValidator.js';

export interface DisputeListItem {
  id: string;
  referenceNumber: string;
  status: string;
  priority: string;
  ageIndicator: string;
  paymentType: string;
  issueCategory: string;
  recommendedAction: string | null;
  createdAt: string;
  customerName: string;
  transactionAmount: number;
  triggeredRuleCount: number;
}

export interface DisputeListResponse {
  disputes: DisputeListItem[];
  totalCount: number;
  page: number;
  totalPages: number;
}

const PRIORITY_WEIGHT: Record<string, number> = { HIGH: 1, MEDIUM: 2, LOW: 3 };
const STATUS_WEIGHT: Record<string, number> = { OPEN: 1, TRIAGED: 2, CLOSED: 3 };

function buildWhereClause(params: DisputeQueryParams) {
  const where: Record<string, unknown> = {};

  if (params.customerName) {
    where.customer = {
      name: { contains: params.customerName, mode: 'insensitive' },
    };
  }

  if (params.paymentType) {
    where.paymentType = params.paymentType;
  }

  if (params.issueCategory) {
    where.issueCategory = params.issueCategory;
  }

  if (params.priority) {
    where.priority = params.priority;
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.startDate || params.endDate) {
    const createdAt: Record<string, Date> = {};
    if (params.startDate) {
      createdAt.gte = new Date(params.startDate + 'T00:00:00.000Z');
    }
    if (params.endDate) {
      createdAt.lte = new Date(params.endDate + 'T23:59:59.999Z');
    }
    where.createdAt = createdAt;
  }

  return where;
}

function sortByWeight(
  disputes: DisputeListItem[],
  field: 'priority' | 'status',
  order: 'asc' | 'desc',
): DisputeListItem[] {
  const weights = field === 'priority' ? PRIORITY_WEIGHT : STATUS_WEIGHT;

  return [...disputes].sort((a, b) => {
    const aVal = field === 'priority' ? a.priority : a.status;
    const bVal = field === 'priority' ? b.priority : b.status;
    const aWeight = weights[aVal] ?? 99;
    const bWeight = weights[bVal] ?? 99;

    return order === 'asc' ? aWeight - bWeight : bWeight - aWeight;
  });
}

export async function queryDisputes(
  params: DisputeQueryParams,
): Promise<DisputeListResponse> {
  const where = buildWhereClause(params);
  const { page, pageSize, sortBy, sortOrder } = params;

  // Get total count for pagination metadata
  const totalCount = await prisma.dispute.count({ where });
  const totalPages = Math.ceil(totalCount / pageSize);

  // For createdAt sorting, use Prisma's native orderBy with pagination
  if (sortBy === 'createdAt') {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const disputes = await prisma.dispute.findMany({
      where,
      orderBy: { createdAt: sortOrder },
      skip,
      take,
      include: {
        customer: { select: { name: true } },
        transaction: { select: { amount: true } },
        _count: { select: { triggeredRules: true } },
      },
    });

    return {
      disputes: disputes.map(mapDisputeToListItem),
      totalCount,
      page,
      totalPages,
    };
  }

  // For priority/status sorting, fetch all matching results, sort in-memory, then paginate
  const allDisputes = await prisma.dispute.findMany({
    where,
    include: {
      customer: { select: { name: true } },
      transaction: { select: { amount: true } },
      _count: { select: { triggeredRules: true } },
    },
  });

  const mappedDisputes = allDisputes.map(mapDisputeToListItem);
  const sortedDisputes = sortByWeight(mappedDisputes, sortBy, sortOrder);

  // Apply pagination
  const skip = (page - 1) * pageSize;
  const paginatedDisputes = sortedDisputes.slice(skip, skip + pageSize);

  return {
    disputes: paginatedDisputes,
    totalCount,
    page,
    totalPages,
  };
}

function mapDisputeToListItem(dispute: {
  id: string;
  referenceNumber: string;
  status: string;
  priority: string;
  ageIndicator: string;
  paymentType: string;
  issueCategory: string;
  recommendedAction: string | null;
  createdAt: Date;
  customer: { name: string };
  transaction: { amount: number };
  _count: { triggeredRules: number };
}): DisputeListItem {
  return {
    id: dispute.id,
    referenceNumber: dispute.referenceNumber,
    status: dispute.status,
    priority: dispute.priority,
    ageIndicator: dispute.ageIndicator,
    paymentType: dispute.paymentType,
    issueCategory: dispute.issueCategory,
    recommendedAction: dispute.recommendedAction,
    createdAt: dispute.createdAt.toISOString(),
    customerName: dispute.customer.name,
    transactionAmount: dispute.transaction.amount,
    triggeredRuleCount: dispute._count.triggeredRules,
  };
}
