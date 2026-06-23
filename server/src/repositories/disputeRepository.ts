import { prisma } from '../lib/prisma.js';

export interface CreateDisputeInput {
  referenceNumber: string;
  customerId: string;
  transactionId: string;
  paymentType: string;
  issueCategory: string;
  status: 'OPEN' | 'TRIAGED' | 'CLOSED';
  priority: string;
  ageIndicator: string;
  recommendedAction: string;
  resolvedAt: Date | null;
  triggeredRules: {
    ruleId: string;
    ruleName: string;
    conditions: Record<string, string | number>;
  }[];
}

export interface DisputeListFilter {
  status?: 'OPEN' | 'TRIAGED' | 'CLOSED';
}

export interface DisputeWithRules {
  id: string;
  referenceNumber: string;
  customerId: string;
  transactionId: string;
  paymentType: string;
  issueCategory: string;
  status: string;
  priority: string;
  ageIndicator: string;
  recommendedAction: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  updatedAt: Date;
  customer: {
    id: string;
    name: string;
    email: string;
    accountNumber: string;
    createdAt: Date;
    updatedAt: Date;
  };
  transaction: {
    id: string;
    customerId: string;
    amount: number;
    paymentType: string;
    status: string;
    description: string;
    transactionDate: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  triggeredRules: {
    id: string;
    disputeId: string;
    ruleId: string;
    ruleName: string;
    conditions: Record<string, string | number>;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

export interface DisputeListItem {
  id: string;
  referenceNumber: string;
  status: string;
  priority: string;
  ageIndicator: string;
  paymentType: string;
  issueCategory: string;
  recommendedAction: string | null;
  createdAt: Date;
  customerName: string;
  transactionAmount: number;
  triggeredRuleCount: number;
}

class DisputeRepository {
  async create(input: CreateDisputeInput): Promise<DisputeWithRules> {
    const dispute = await prisma.$transaction(async (tx) => {
      const createdDispute = await tx.dispute.create({
        data: {
          referenceNumber: input.referenceNumber,
          customerId: input.customerId,
          transactionId: input.transactionId,
          paymentType: input.paymentType,
          issueCategory: input.issueCategory,
          status: input.status,
          priority: input.priority,
          ageIndicator: input.ageIndicator,
          recommendedAction: input.recommendedAction,
          resolvedAt: input.resolvedAt,
        },
      });

      const triggeredRules = await Promise.all(
        input.triggeredRules.map((rule) =>
          tx.triggeredRule.create({
            data: {
              disputeId: createdDispute.id,
              ruleId: rule.ruleId,
              ruleName: rule.ruleName,
              conditions: JSON.stringify(rule.conditions),
            },
          })
        )
      );

      return { ...createdDispute, triggeredRules };
    });

    // Re-fetch with all relations included and conditions parsed
    const fullDispute = await prisma.dispute.findUniqueOrThrow({
      where: { id: dispute.id },
      include: {
        triggeredRules: true,
        customer: true,
        transaction: true,
      },
    });

    return {
      ...fullDispute,
      triggeredRules: fullDispute.triggeredRules.map((rule) => ({
        ...rule,
        conditions: JSON.parse(rule.conditions) as Record<string, string | number>,
      })),
    };
  }

  async findById(id: string): Promise<DisputeWithRules | null> {
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        triggeredRules: true,
        customer: true,
        transaction: true,
      },
    });

    if (!dispute) {
      return null;
    }

    return {
      ...dispute,
      triggeredRules: dispute.triggeredRules.map((rule) => ({
        ...rule,
        conditions: JSON.parse(rule.conditions) as Record<string, string | number>,
      })),
    };
  }

  async findAll(filter?: DisputeListFilter): Promise<DisputeListItem[]> {
    const where = filter?.status ? { status: filter.status } : {};

    const disputes = await prisma.dispute.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true } },
        transaction: { select: { amount: true } },
        _count: { select: { triggeredRules: true } },
      },
    });

    return disputes.map((dispute) => ({
      id: dispute.id,
      referenceNumber: dispute.referenceNumber,
      status: dispute.status,
      priority: dispute.priority,
      ageIndicator: dispute.ageIndicator,
      paymentType: dispute.paymentType,
      issueCategory: dispute.issueCategory,
      recommendedAction: dispute.recommendedAction,
      createdAt: dispute.createdAt,
      customerName: dispute.customer.name,
      transactionAmount: dispute.transaction.amount,
      triggeredRuleCount: dispute._count.triggeredRules,
    }));
  }
}

export const disputeRepository = new DisputeRepository();
