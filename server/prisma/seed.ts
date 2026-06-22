/**
 * Prisma Seed Script — Payment Dispute Triage System
 *
 * REQ-003: When the system initializes, the system shall load a predefined
 * baseline set of mock customer and transaction records.
 *
 * Provides 6 customers and ~20 transactions covering all rule paths in the
 * decision matrix. Transaction dates are relative to today so age indicators
 * remain accurate across demos.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(10, 0, 0, 0); // Normalize to 10:00 AM
  return date;
}

// ─── Mock Customers ────────────────────────────────────────────────────────────

const customers = [
  {
    id: 'cust-001',
    name: 'Thabo Molefe',
    email: 'thabo.molefe@example.com',
    accountNumber: '1001-0001-001',
  },
  {
    id: 'cust-002',
    name: 'Naledi Khumalo',
    email: 'naledi.khumalo@example.com',
    accountNumber: '1001-0002-002',
  },
  {
    id: 'cust-003',
    name: 'James van der Merwe',
    email: 'james.vdm@example.com',
    accountNumber: '1001-0003-003',
  },
  {
    id: 'cust-004',
    name: 'Priya Naidoo',
    email: 'priya.naidoo@example.com',
    accountNumber: '1001-0004-004',
  },
  {
    id: 'cust-005',
    name: 'Sipho Dlamini',
    email: 'sipho.dlamini@example.com',
    accountNumber: '1001-0005-005',
  },
  {
    id: 'cust-006',
    name: 'Fatima Ismail',
    email: 'fatima.ismail@example.com',
    accountNumber: '1001-0006-006',
  },
];

// ─── Mock Transactions ─────────────────────────────────────────────────────────
// Each transaction is designed to exercise specific rule paths in the decision matrix.

const transactions = [
  // ── Customer 1: Thabo Molefe ──
  {
    id: 'txn-001',
    customerId: 'cust-001',
    amount: 1250.0,
    paymentType: 'CARD',
    status: 'COMPLETED',
    description: 'POS purchase at Woolworths - duplicated',
    transactionDate: daysAgo(2),
    // Purpose: RULE-002 — Card + Duplicate Debit → Immediate Reversal
  },
  {
    id: 'txn-002',
    customerId: 'cust-001',
    amount: 8000.0,
    paymentType: 'CARD',
    status: 'COMPLETED',
    description: 'Online purchase - not authorised by cardholder',
    transactionDate: daysAgo(5),
    // Purpose: RULE-001 — Unauthorised → Escalate to Fraud Team
  },
  {
    id: 'txn-003',
    customerId: 'cust-001',
    amount: 450.0,
    paymentType: 'CARD',
    status: 'COMPLETED',
    description: 'Subscription renewal - Netflix',
    transactionDate: daysAgo(1),
    // Purpose: Normal transaction, no dispute expected
  },

  // ── Customer 2: Naledi Khumalo ──
  {
    id: 'txn-004',
    customerId: 'cust-002',
    amount: 3500.0,
    paymentType: 'EFT',
    status: 'PENDING',
    description: 'EFT to landlord - rent payment',
    transactionDate: daysAgo(1),
    // Purpose: RULE-003 — EFT + Pending → Monitor 24h
  },
  {
    id: 'txn-005',
    customerId: 'cust-002',
    amount: 25000.0,
    paymentType: 'EFT',
    status: 'COMPLETED',
    description: 'EFT to vehicle dealer - deposit',
    transactionDate: daysAgo(3),
    // Purpose: RULE-004 — High value (>R10k) → Escalate to Senior Ops
  },
  {
    id: 'txn-006',
    customerId: 'cust-002',
    amount: 4500.0,
    paymentType: 'EFT',
    status: 'COMPLETED',
    description: 'EFT from employer - salary expected but missing',
    transactionDate: daysAgo(16),
    // Purpose: RULE-006 — EFT + Missing Payment → Investigate + Overdue age
  },

  // ── Customer 3: James van der Merwe ──
  {
    id: 'txn-007',
    customerId: 'cust-003',
    amount: 2000.0,
    paymentType: 'INTERNAL',
    status: 'FAILED',
    description: 'Internal transfer to savings account - failed',
    transactionDate: daysAgo(10),
    // Purpose: RULE-005 — Internal + Failed Transfer → Refer to Payments Team + Aging
  },
  {
    id: 'txn-008',
    customerId: 'cust-003',
    amount: 6500.0,
    paymentType: 'CARD',
    status: 'COMPLETED',
    description: 'Online order - electronics store (goods not received)',
    transactionDate: daysAgo(9),
    // Purpose: RULE-007 — Card + Card Dispute → Investigate + Medium priority
  },
  {
    id: 'txn-009',
    customerId: 'cust-003',
    amount: 1800.0,
    paymentType: 'CARD',
    status: 'ALREADY_REFUNDED',
    description: 'Refunded purchase - returned item',
    transactionDate: daysAgo(6),
    // Purpose: RULE-PRE-01 — Already Refunded → Close Dispute
  },

  // ── Customer 4: Priya Naidoo ──
  {
    id: 'txn-010',
    customerId: 'cust-004',
    amount: 900.0,
    paymentType: 'INTERNAL',
    status: 'COMPLETED',
    description: 'Transfer to fixed deposit - incorrect amount debited',
    transactionDate: daysAgo(4),
    // Purpose: RULE-008 — Incorrect Amount → Investigate
  },
  {
    id: 'txn-011',
    customerId: 'cust-004',
    amount: 500.0,
    paymentType: 'INTERNAL',
    status: 'COMPLETED',
    description: 'Internal transfer to credit card account',
    transactionDate: daysAgo(1),
    // Purpose: Default fallback — no specific rule matches → Investigate (Manual Review)
  },
  {
    id: 'txn-012',
    customerId: 'cust-004',
    amount: 12500.0,
    paymentType: 'CARD',
    status: 'COMPLETED',
    description: 'Large purchase at furniture store',
    transactionDate: daysAgo(12),
    // Purpose: RULE-004 — High value (>R10k) + Aging age indicator
  },

  // ── Customer 5: Sipho Dlamini ──
  {
    id: 'txn-013',
    customerId: 'cust-005',
    amount: 7500.0,
    paymentType: 'EFT',
    status: 'COMPLETED',
    description: 'EFT payment for building materials',
    transactionDate: daysAgo(8),
    // Purpose: Medium priority (R5k-R10k) + Aging (8 days)
  },
  {
    id: 'txn-014',
    customerId: 'cust-005',
    amount: 15000.0,
    paymentType: 'EFT',
    status: 'PENDING',
    description: 'EFT to contractor - large pending transfer',
    transactionDate: daysAgo(2),
    // Purpose: RULE-003 — EFT + Pending (also high value, but pending rule fires first)
  },
  {
    id: 'txn-015',
    customerId: 'cust-005',
    amount: 320.0,
    paymentType: 'CARD',
    status: 'COMPLETED',
    description: 'Grocery purchase - Pick n Pay',
    transactionDate: daysAgo(20),
    // Purpose: Low-value but Overdue (20 days)
  },

  // ── Customer 6: Fatima Ismail ──
  {
    id: 'txn-016',
    customerId: 'cust-006',
    amount: 5500.0,
    paymentType: 'INTERNAL',
    status: 'COMPLETED',
    description: 'Transfer between cheque and savings',
    transactionDate: daysAgo(7),
    // Purpose: Medium priority (R5k-R10k), border of New/Aging
  },
  {
    id: 'txn-017',
    customerId: 'cust-006',
    amount: 2200.0,
    paymentType: 'EFT',
    status: 'FAILED',
    description: 'EFT to insurance company - payment failed',
    transactionDate: daysAgo(15),
    // Purpose: EFT + Failed + Overdue — RULE-006 path variant
  },
  {
    id: 'txn-018',
    customerId: 'cust-006',
    amount: 18000.0,
    paymentType: 'CARD',
    status: 'COMPLETED',
    description: 'Unauthorised online purchase - jewellery store',
    transactionDate: daysAgo(3),
    // Purpose: RULE-001 — Unauthorised + High value (both High Priority triggers)
  },
  {
    id: 'txn-019',
    customerId: 'cust-006',
    amount: 1100.0,
    paymentType: 'CARD',
    status: 'ALREADY_REFUNDED',
    description: 'Duplicate charge at restaurant - already refunded',
    transactionDate: daysAgo(4),
    // Purpose: RULE-PRE-01 — Already Refunded → Close Dispute
  },
  {
    id: 'txn-020',
    customerId: 'cust-006',
    amount: 3000.0,
    paymentType: 'INTERNAL',
    status: 'COMPLETED',
    description: 'Scheduled transfer to investment account',
    transactionDate: daysAgo(0),
    // Purpose: Normal transaction, recent, low priority
  },
];

// ─── Seed Function ─────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (in reverse FK order)
  await prisma.dispute.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.customer.deleteMany();

  // Seed customers
  for (const customer of customers) {
    await prisma.customer.create({ data: customer });
  }
  console.log(`  ✓ Created ${customers.length} customers`);

  // Seed transactions
  for (const transaction of transactions) {
    await prisma.transaction.create({ data: transaction });
  }
  console.log(`  ✓ Created ${transactions.length} transactions`);

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
