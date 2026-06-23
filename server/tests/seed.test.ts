import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

describe('Seed script integrity', () => {
  beforeAll(() => {
    // Run the seed script to populate the database
    execSync('node --import tsx prisma/seed.ts', {
      stdio: 'pipe',
      cwd: process.cwd(),
      env: { ...process.env, PATH: process.env.PATH },
      shell: '/bin/bash',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('produces at least 6 disputes with correct status distribution (at least 2 per status)', async () => {
    const disputes = await prisma.dispute.findMany();
    expect(disputes.length).toBeGreaterThanOrEqual(6);

    const openCount = disputes.filter((d) => d.status === 'OPEN').length;
    const triagedCount = disputes.filter((d) => d.status === 'TRIAGED').length;
    const closedCount = disputes.filter((d) => d.status === 'CLOSED').length;

    expect(openCount).toBeGreaterThanOrEqual(2);
    expect(triagedCount).toBeGreaterThanOrEqual(2);
    expect(closedCount).toBeGreaterThanOrEqual(2);
  });

  it('each dispute has at least 1 associated TriggeredRule record', async () => {
    const disputes = await prisma.dispute.findMany({
      include: { _count: { select: { triggeredRules: true } } },
    });

    for (const dispute of disputes) {
      expect(
        dispute._count.triggeredRules,
        `Dispute ${dispute.referenceNumber} should have at least 1 triggered rule`
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('all dispute customerIds reference valid seeded customers', async () => {
    const disputes = await prisma.dispute.findMany({ select: { customerId: true, referenceNumber: true } });
    const customers = await prisma.customer.findMany({ select: { id: true } });
    const customerIds = new Set(customers.map((c) => c.id));

    for (const dispute of disputes) {
      expect(
        customerIds.has(dispute.customerId),
        `Dispute ${dispute.referenceNumber} references invalid customerId: ${dispute.customerId}`
      ).toBe(true);
    }
  });

  it('all dispute transactionIds reference valid seeded transactions', async () => {
    const disputes = await prisma.dispute.findMany({ select: { transactionId: true, referenceNumber: true } });
    const transactions = await prisma.transaction.findMany({ select: { id: true } });
    const transactionIds = new Set(transactions.map((t) => t.id));

    for (const dispute of disputes) {
      expect(
        transactionIds.has(dispute.transactionId),
        `Dispute ${dispute.referenceNumber} references invalid transactionId: ${dispute.transactionId}`
      ).toBe(true);
    }
  });
});
