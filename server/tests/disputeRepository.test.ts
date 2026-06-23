import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Prisma client before importing the repository
vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    $transaction: vi.fn(),
    dispute: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    triggeredRule: {
      create: vi.fn(),
    },
  },
}));

import { disputeRepository, CreateDisputeInput } from '../src/repositories/disputeRepository.js';
import { prisma } from '../src/lib/prisma.js';

const mockedPrisma = vi.mocked(prisma, true);

describe('disputeRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('uses a Prisma transaction to create dispute and triggered rules atomically', async () => {
      const input: CreateDisputeInput = {
        referenceNumber: 'DSP-001',
        customerId: 'cust-001',
        transactionId: 'txn-001',
        paymentType: 'CARD',
        issueCategory: 'DUPLICATE_DEBIT',
        status: 'TRIAGED',
        priority: 'HIGH',
        ageIndicator: 'NEW',
        recommendedAction: 'Immediate Reversal',
        resolvedAt: null,
        triggeredRules: [
          {
            ruleId: 'RULE-002',
            ruleName: 'Card + Duplicate Debit',
            conditions: { paymentType: 'CARD', issueCategory: 'DUPLICATE_DEBIT' },
          },
        ],
      };

      const createdDispute = {
        id: 'dispute-uuid-1',
        referenceNumber: 'DSP-001',
        customerId: 'cust-001',
        transactionId: 'txn-001',
        paymentType: 'CARD',
        issueCategory: 'DUPLICATE_DEBIT',
        status: 'TRIAGED',
        priority: 'HIGH',
        ageIndicator: 'NEW',
        recommendedAction: 'Immediate Reversal',
        resolvedAt: null,
        createdAt: new Date('2026-06-22T14:30:00.000Z'),
        updatedAt: new Date('2026-06-22T14:30:00.000Z'),
      };

      const createdRule = {
        id: 'rule-uuid-1',
        disputeId: 'dispute-uuid-1',
        ruleId: 'RULE-002',
        ruleName: 'Card + Duplicate Debit',
        conditions: JSON.stringify({ paymentType: 'CARD', issueCategory: 'DUPLICATE_DEBIT' }),
        createdAt: new Date('2026-06-22T14:30:00.000Z'),
        updatedAt: new Date('2026-06-22T14:30:00.000Z'),
      };

      // Mock $transaction to execute the callback with a mock tx
      mockedPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          dispute: { create: vi.fn().mockResolvedValue(createdDispute) },
          triggeredRule: { create: vi.fn().mockResolvedValue(createdRule) },
        };
        return cb(tx);
      });

      const fullDisputeFromDb = {
        ...createdDispute,
        customer: {
          id: 'cust-001',
          name: 'Thabo Molefe',
          email: 'thabo@example.com',
          accountNumber: 'ACC-001',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        transaction: {
          id: 'txn-001',
          customerId: 'cust-001',
          amount: 1250.0,
          paymentType: 'CARD',
          status: 'COMPLETED',
          description: 'Card payment',
          transactionDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        triggeredRules: [createdRule],
      };

      mockedPrisma.dispute.findUniqueOrThrow.mockResolvedValue(fullDisputeFromDb as any);

      const result = await disputeRepository.create(input);

      // Verify transaction was used
      expect(mockedPrisma.$transaction).toHaveBeenCalledOnce();

      // Verify findUniqueOrThrow was called to re-fetch with relations
      expect(mockedPrisma.dispute.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'dispute-uuid-1' },
        include: {
          triggeredRules: true,
          customer: true,
          transaction: true,
        },
      });

      // Verify result has parsed conditions
      expect(result.triggeredRules[0].conditions).toEqual({
        paymentType: 'CARD',
        issueCategory: 'DUPLICATE_DEBIT',
      });
      expect(result.referenceNumber).toBe('DSP-001');
      expect(result.status).toBe('TRIAGED');
    });
  });

  describe('findById', () => {
    it('returns dispute with parsed triggeredRules conditions', async () => {
      const disputeFromDb = {
        id: 'dispute-uuid-1',
        referenceNumber: 'DSP-001',
        customerId: 'cust-001',
        transactionId: 'txn-001',
        paymentType: 'CARD',
        issueCategory: 'DUPLICATE_DEBIT',
        status: 'TRIAGED',
        priority: 'HIGH',
        ageIndicator: 'NEW',
        recommendedAction: 'Immediate Reversal',
        resolvedAt: null,
        createdAt: new Date('2026-06-22T14:30:00.000Z'),
        updatedAt: new Date('2026-06-22T14:30:00.000Z'),
        customer: {
          id: 'cust-001',
          name: 'Thabo Molefe',
          email: 'thabo@example.com',
          accountNumber: 'ACC-001',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        transaction: {
          id: 'txn-001',
          customerId: 'cust-001',
          amount: 1250.0,
          paymentType: 'CARD',
          status: 'COMPLETED',
          description: 'Card payment',
          transactionDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        triggeredRules: [
          {
            id: 'rule-uuid-1',
            disputeId: 'dispute-uuid-1',
            ruleId: 'RULE-002',
            ruleName: 'Card + Duplicate Debit',
            conditions: JSON.stringify({ paymentType: 'CARD', issueCategory: 'DUPLICATE_DEBIT' }),
            createdAt: new Date('2026-06-22T14:30:00.000Z'),
            updatedAt: new Date('2026-06-22T14:30:00.000Z'),
          },
          {
            id: 'rule-uuid-2',
            disputeId: 'dispute-uuid-1',
            ruleId: 'RULE-005',
            ruleName: 'High Value Transaction',
            conditions: JSON.stringify({ amount: 15000, threshold: 10000 }),
            createdAt: new Date('2026-06-22T14:30:00.000Z'),
            updatedAt: new Date('2026-06-22T14:30:00.000Z'),
          },
        ],
      };

      mockedPrisma.dispute.findUnique.mockResolvedValue(disputeFromDb as any);

      const result = await disputeRepository.findById('dispute-uuid-1');

      expect(mockedPrisma.dispute.findUnique).toHaveBeenCalledWith({
        where: { id: 'dispute-uuid-1' },
        include: {
          triggeredRules: true,
          customer: true,
          transaction: true,
        },
      });

      expect(result).not.toBeNull();
      // Verify conditions are parsed from JSON strings to objects
      expect(result!.triggeredRules[0].conditions).toEqual({
        paymentType: 'CARD',
        issueCategory: 'DUPLICATE_DEBIT',
      });
      expect(result!.triggeredRules[1].conditions).toEqual({
        amount: 15000,
        threshold: 10000,
      });
      expect(result!.referenceNumber).toBe('DSP-001');
    });

    it('returns null when dispute is not found', async () => {
      mockedPrisma.dispute.findUnique.mockResolvedValue(null);

      const result = await disputeRepository.findById('non-existent-id');

      expect(result).toBeNull();
      expect(mockedPrisma.dispute.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        include: {
          triggeredRules: true,
          customer: true,
          transaction: true,
        },
      });
    });
  });

  describe('findAll', () => {
    const mockDisputes = [
      {
        id: 'dispute-1',
        referenceNumber: 'DSP-001',
        status: 'TRIAGED',
        priority: 'HIGH',
        ageIndicator: 'NEW',
        paymentType: 'CARD',
        issueCategory: 'DUPLICATE_DEBIT',
        recommendedAction: 'Immediate Reversal',
        createdAt: new Date('2026-06-22T14:30:00.000Z'),
        customer: { name: 'Thabo Molefe' },
        transaction: { amount: 1250.0 },
        _count: { triggeredRules: 2 },
      },
      {
        id: 'dispute-2',
        referenceNumber: 'DSP-002',
        status: 'OPEN',
        priority: 'LOW',
        ageIndicator: 'AGING',
        paymentType: 'EFT',
        issueCategory: 'FAILED_TRANSFER',
        recommendedAction: 'Investigate',
        createdAt: new Date('2026-06-21T10:00:00.000Z'),
        customer: { name: 'Nomsa Dlamini' },
        transaction: { amount: 500.0 },
        _count: { triggeredRules: 1 },
      },
    ];

    it('returns all disputes without filter, ordered by createdAt descending', async () => {
      mockedPrisma.dispute.findMany.mockResolvedValue(mockDisputes as any);

      const result = await disputeRepository.findAll();

      expect(mockedPrisma.dispute.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          transaction: { select: { amount: true } },
          _count: { select: { triggeredRules: true } },
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0].customerName).toBe('Thabo Molefe');
      expect(result[0].transactionAmount).toBe(1250.0);
      expect(result[0].triggeredRuleCount).toBe(2);
      expect(result[1].customerName).toBe('Nomsa Dlamini');
      expect(result[1].transactionAmount).toBe(500.0);
      expect(result[1].triggeredRuleCount).toBe(1);
    });

    it('applies status filter when provided', async () => {
      mockedPrisma.dispute.findMany.mockResolvedValue(
        [mockDisputes[0]] as any
      );

      const result = await disputeRepository.findAll({ status: 'TRIAGED' });

      expect(mockedPrisma.dispute.findMany).toHaveBeenCalledWith({
        where: { status: 'TRIAGED' },
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          transaction: { select: { amount: true } },
          _count: { select: { triggeredRules: true } },
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('TRIAGED');
    });

    it('passes orderBy createdAt desc to Prisma findMany', async () => {
      mockedPrisma.dispute.findMany.mockResolvedValue(mockDisputes as any);

      await disputeRepository.findAll();

      const callArgs = mockedPrisma.dispute.findMany.mock.calls[0][0];
      expect(callArgs).toHaveProperty('orderBy', { createdAt: 'desc' });
    });

    it('maps response to DisputeListItem shape correctly', async () => {
      mockedPrisma.dispute.findMany.mockResolvedValue(mockDisputes as any);

      const result = await disputeRepository.findAll();

      // Verify the shape matches DisputeListItem interface
      expect(result[0]).toEqual({
        id: 'dispute-1',
        referenceNumber: 'DSP-001',
        status: 'TRIAGED',
        priority: 'HIGH',
        ageIndicator: 'NEW',
        paymentType: 'CARD',
        issueCategory: 'DUPLICATE_DEBIT',
        recommendedAction: 'Immediate Reversal',
        createdAt: new Date('2026-06-22T14:30:00.000Z'),
        customerName: 'Thabo Molefe',
        transactionAmount: 1250.0,
        triggeredRuleCount: 2,
      });
    });

    it('returns empty array when no disputes match filter', async () => {
      mockedPrisma.dispute.findMany.mockResolvedValue([]);

      const result = await disputeRepository.findAll({ status: 'CLOSED' });

      expect(result).toEqual([]);
    });
  });
});
