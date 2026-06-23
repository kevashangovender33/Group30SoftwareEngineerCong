import { describe, it, expect, afterAll, afterEach } from 'vitest';
import fc from 'fast-check';
import { PrismaClient } from '@prisma/client';

/**
 * **Validates: Requirements 2.4, 4.5**
 *
 * Property 5: Cascade delete removes all associated triggered rules
 * For any dispute with N associated TriggeredRule records (where N >= 1),
 * deleting the dispute SHALL result in zero TriggeredRule records remaining
 * with that disputeId.
 */

const prisma = new PrismaClient();

describe('Feature: dispute-persistence, Property 5: Cascade delete removes all associated triggered rules', () => {
  afterEach(async () => {
    // Clean up any remaining test data
    await prisma.triggeredRule.deleteMany({
      where: { disputeId: { startsWith: 'test-cascade-' } },
    });
    await prisma.dispute.deleteMany({
      where: { id: { startsWith: 'test-cascade-' } },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('deleting a dispute removes all its associated TriggeredRule records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        fc.uuid(),
        async (ruleCount, uniqueId) => {
          const disputeId = `test-cascade-${uniqueId}`;
          const refNum = `DSP-CAS-${uniqueId.substring(0, 8)}`;

          // Create a dispute using known seeded customer and transaction
          const dispute = await prisma.dispute.create({
            data: {
              id: disputeId,
              referenceNumber: refNum,
              customerId: 'cust-001',
              transactionId: 'txn-001',
              paymentType: 'CARD',
              issueCategory: 'DUPLICATE_DEBIT',
              status: 'TRIAGED',
              priority: 'LOW',
              ageIndicator: 'NEW',
              recommendedAction: 'Immediate Reversal',
            },
          });

          // Create N triggered rules associated with the dispute
          for (let i = 0; i < ruleCount; i++) {
            await prisma.triggeredRule.create({
              data: {
                disputeId: dispute.id,
                ruleId: `RULE-${String(i + 1).padStart(3, '0')}`,
                ruleName: `Test Rule ${i + 1}`,
                conditions: JSON.stringify({ testKey: `value-${i}` }),
              },
            });
          }

          // Verify rules were created
          const beforeCount = await prisma.triggeredRule.count({
            where: { disputeId: dispute.id },
          });
          expect(beforeCount).toBe(ruleCount);

          // Delete the dispute — cascade should remove all triggered rules
          await prisma.dispute.delete({ where: { id: dispute.id } });

          // Verify zero TriggeredRule records remain for that disputeId
          const afterCount = await prisma.triggeredRule.count({
            where: { disputeId: dispute.id },
          });
          expect(afterCount).toBe(0);
        }
      ),
      { numRuns: 10 }
    );
  });
});
