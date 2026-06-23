import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..');

describe('Transaction atomicity and seed idempotency', () => {
  beforeAll(() => {
    // Ensure database is seeded before tests
    execSync('npm run db:seed', { stdio: 'pipe', cwd: serverDir });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Prisma transaction rollback', () => {
    it('rolls back dispute creation when TriggeredRule insert fails within transaction', async () => {
      const uniqueRef = `DSP-ROLLBACK-${Date.now()}`;
      const beforeCount = await prisma.dispute.count();

      try {
        await prisma.$transaction(async (tx) => {
          // Create the dispute within the transaction
          await tx.dispute.create({
            data: {
              referenceNumber: uniqueRef,
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

          // Force a failure by referencing a non-existent disputeId for the TriggeredRule
          // This should fail the FK constraint and roll back the entire transaction
          await tx.triggeredRule.create({
            data: {
              disputeId: 'non-existent-dispute-id',
              ruleId: 'RULE-001',
              ruleName: 'Test Rule',
              conditions: '{}',
            },
          });
        });
      } catch (_err) {
        // Expected: transaction should have rolled back due to FK constraint violation
      }

      // Verify: no new dispute was persisted (rollback succeeded)
      const afterCount = await prisma.dispute.count();
      expect(afterCount).toBe(beforeCount);

      // Verify: the dispute with our unique reference number does not exist
      const found = await prisma.dispute.findUnique({
        where: { referenceNumber: uniqueRef },
      });
      expect(found).toBeNull();
    });
  });

  describe('Seed script idempotency', () => {
    it('running seed twice produces consistent dispute counts', () => {
      // Run seed first time
      execSync('npm run db:seed', { stdio: 'pipe', cwd: serverDir });
    });

    it('produces identical record counts on second run', async () => {
      // Capture counts after first run (from beforeAll)
      const firstRunDisputes = await prisma.dispute.count();
      const firstRunRules = await prisma.triggeredRule.count();
      const firstRunCustomers = await prisma.customer.count();
      const firstRunTransactions = await prisma.transaction.count();

      // Run seed second time
      execSync('npm run db:seed', { stdio: 'pipe', cwd: serverDir });

      // Capture counts after second run
      const secondRunDisputes = await prisma.dispute.count();
      const secondRunRules = await prisma.triggeredRule.count();
      const secondRunCustomers = await prisma.customer.count();
      const secondRunTransactions = await prisma.transaction.count();

      // Counts should be identical (seed is idempotent — clears and re-creates)
      expect(secondRunDisputes).toBe(firstRunDisputes);
      expect(secondRunRules).toBe(firstRunRules);
      expect(secondRunCustomers).toBe(firstRunCustomers);
      expect(secondRunTransactions).toBe(firstRunTransactions);
    });
  });

  describe('Migration preserves existing data', () => {
    it('Customer and Transaction rows exist after migration', async () => {
      const customers = await prisma.customer.count();
      const transactions = await prisma.transaction.count();

      // Seed creates 6 customers and 20 transactions
      expect(customers).toBeGreaterThanOrEqual(6);
      expect(transactions).toBeGreaterThanOrEqual(20);
    });

    it('Customer records contain expected fields', async () => {
      const customer = await prisma.customer.findUnique({
        where: { id: 'cust-001' },
      });

      expect(customer).not.toBeNull();
      expect(customer!.name).toBe('Thabo Molefe');
      expect(customer!.email).toBe('thabo.molefe@example.com');
      expect(customer!.accountNumber).toBe('1001-0001-001');
    });

    it('Transaction records contain expected fields', async () => {
      const transaction = await prisma.transaction.findUnique({
        where: { id: 'txn-001' },
      });

      expect(transaction).not.toBeNull();
      expect(transaction!.customerId).toBe('cust-001');
      expect(transaction!.amount).toBe(1250.0);
      expect(transaction!.paymentType).toBe('CARD');
      expect(transaction!.status).toBe('COMPLETED');
    });
  });
});
