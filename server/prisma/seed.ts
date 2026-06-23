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
  await prisma.triggeredRule.deleteMany();
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

  // ─── Seed Disputes ──────────────────────────────────────────────────────────
  // Cover all 3 statuses (OPEN, TRIAGED, CLOSED), varying priorities, age indicators,
  // and at least 7 different recommendationCode values.
  // REQ-005: Seed Script with Pre-Existing Dispute Records (5.1–5.6)

  const disputes = [
    // ── TRIAGED disputes ──
    {
      id: 'dispute-seed-001',
      referenceNumber: 'DSP-SEED-001',
      customerId: 'cust-001',
      transactionId: 'txn-002',
      paymentType: 'CARD',
      issueCategory: 'UNAUTHORISED',
      status: 'TRIAGED',
      priority: 'HIGH',
      ageIndicator: 'NEW',
      recommendedAction: 'Escalate to Fraud Team',
      resolvedAt: null,
    },
    {
      id: 'dispute-seed-002',
      referenceNumber: 'DSP-SEED-002',
      customerId: 'cust-001',
      transactionId: 'txn-001',
      paymentType: 'CARD',
      issueCategory: 'DUPLICATE_DEBIT',
      status: 'TRIAGED',
      priority: 'LOW',
      ageIndicator: 'NEW',
      recommendedAction: 'Immediate Reversal',
      resolvedAt: null,
    },

    // ── CLOSED disputes (resolvedAt set) ──
    {
      id: 'dispute-seed-003',
      referenceNumber: 'DSP-SEED-003',
      customerId: 'cust-003',
      transactionId: 'txn-009',
      paymentType: 'CARD',
      issueCategory: 'DUPLICATE_DEBIT',
      status: 'CLOSED',
      priority: 'LOW',
      ageIndicator: 'NEW',
      recommendedAction: 'Close Dispute — Resolved',
      resolvedAt: daysAgo(5),
    },
    {
      id: 'dispute-seed-004',
      referenceNumber: 'DSP-SEED-004',
      customerId: 'cust-006',
      transactionId: 'txn-019',
      paymentType: 'CARD',
      issueCategory: 'DUPLICATE_DEBIT',
      status: 'CLOSED',
      priority: 'MEDIUM',
      ageIndicator: 'AGING',
      recommendedAction: 'Close Dispute — Resolved',
      resolvedAt: daysAgo(3),
    },

    // ── OPEN disputes ──
    {
      id: 'dispute-seed-005',
      referenceNumber: 'DSP-SEED-005',
      customerId: 'cust-002',
      transactionId: 'txn-004',
      paymentType: 'EFT',
      issueCategory: 'FAILED_TRANSFER',
      status: 'OPEN',
      priority: 'MEDIUM',
      ageIndicator: 'AGING',
      recommendedAction: 'Monitor for 24 Hours',
      resolvedAt: null,
    },
    {
      id: 'dispute-seed-006',
      referenceNumber: 'DSP-SEED-006',
      customerId: 'cust-002',
      transactionId: 'txn-005',
      paymentType: 'EFT',
      issueCategory: 'UNAUTHORISED',
      status: 'OPEN',
      priority: 'HIGH',
      ageIndicator: 'OVERDUE',
      recommendedAction: 'Escalate to Senior Ops',
      resolvedAt: null,
    },

    // ── Additional TRIAGED dispute for INVESTIGATE coverage ──
    {
      id: 'dispute-seed-007',
      referenceNumber: 'DSP-SEED-007',
      customerId: 'cust-002',
      transactionId: 'txn-006',
      paymentType: 'EFT',
      issueCategory: 'MISSING_PAYMENT',
      status: 'TRIAGED',
      priority: 'LOW',
      ageIndicator: 'OVERDUE',
      recommendedAction: 'Investigate Further',
      resolvedAt: null,
    },

    // ── Additional OPEN dispute for REFER_PAYMENTS coverage ──
    {
      id: 'dispute-seed-008',
      referenceNumber: 'DSP-SEED-008',
      customerId: 'cust-003',
      transactionId: 'txn-007',
      paymentType: 'INTERNAL',
      issueCategory: 'FAILED_TRANSFER',
      status: 'OPEN',
      priority: 'MEDIUM',
      ageIndicator: 'AGING',
      recommendedAction: 'Refer to Payments Team',
      resolvedAt: null,
    },
  ];

  for (const dispute of disputes) {
    await prisma.dispute.create({ data: dispute });
  }
  console.log(`  ✓ Created ${disputes.length} disputes`);

  // ─── Seed Triggered Rules ────────────────────────────────────────────────────
  // At least 1 triggered rule per dispute, referencing realistic rule IDs
  // from the triage engine's decision matrix.

  const triggeredRules = [
    // dispute-seed-001: TRIAGED — Unauthorised → Escalate to Fraud (ESCALATE_FRAUD)
    {
      id: 'tr-seed-001',
      disputeId: 'dispute-seed-001',
      ruleId: 'RULE-001',
      ruleName: 'Unauthorised (Fraud)',
      conditions: JSON.stringify({ issueCategory: 'UNAUTHORISED' }),
    },
    // dispute-seed-002: TRIAGED — Card + Duplicate Debit → Immediate Reversal (IMMEDIATE_REVERSAL)
    {
      id: 'tr-seed-002',
      disputeId: 'dispute-seed-002',
      ruleId: 'RULE-002',
      ruleName: 'Card + Duplicate Debit',
      conditions: JSON.stringify({ paymentType: 'CARD', issueCategory: 'DUPLICATE_DEBIT' }),
    },
    // dispute-seed-003: CLOSED — Already Refunded → Close (CLOSE_RESOLVED)
    {
      id: 'tr-seed-003',
      disputeId: 'dispute-seed-003',
      ruleId: 'RULE-PRE-01',
      ruleName: 'Already Refunded',
      conditions: JSON.stringify({ transactionStatus: 'ALREADY_REFUNDED' }),
    },
    // dispute-seed-004: CLOSED — Already Refunded → Close (CLOSE_RESOLVED)
    {
      id: 'tr-seed-004',
      disputeId: 'dispute-seed-004',
      ruleId: 'RULE-PRE-01',
      ruleName: 'Already Refunded',
      conditions: JSON.stringify({ transactionStatus: 'ALREADY_REFUNDED' }),
    },
    // dispute-seed-005: OPEN — EFT + Pending → Monitor 24h (MONITOR_24H)
    {
      id: 'tr-seed-005',
      disputeId: 'dispute-seed-005',
      ruleId: 'RULE-003',
      ruleName: 'EFT + Pending',
      conditions: JSON.stringify({ paymentType: 'EFT', transactionStatus: 'PENDING' }),
    },
    // dispute-seed-006: OPEN — High Value → Escalate Senior (ESCALATE_SENIOR)
    {
      id: 'tr-seed-006a',
      disputeId: 'dispute-seed-006',
      ruleId: 'RULE-001',
      ruleName: 'Unauthorised (Fraud)',
      conditions: JSON.stringify({ issueCategory: 'UNAUTHORISED' }),
    },
    {
      id: 'tr-seed-006b',
      disputeId: 'dispute-seed-006',
      ruleId: 'RULE-004',
      ruleName: 'High Value (>R10,000)',
      conditions: JSON.stringify({ transactionAmount: 25000 }),
    },
    // dispute-seed-007: TRIAGED — EFT + Missing Payment → Investigate (INVESTIGATE)
    {
      id: 'tr-seed-007',
      disputeId: 'dispute-seed-007',
      ruleId: 'RULE-006',
      ruleName: 'EFT + Missing Payment',
      conditions: JSON.stringify({ paymentType: 'EFT', issueCategory: 'MISSING_PAYMENT' }),
    },
    // dispute-seed-008: OPEN — Internal + Failed Transfer → Refer to Payments (REFER_PAYMENTS)
    {
      id: 'tr-seed-008',
      disputeId: 'dispute-seed-008',
      ruleId: 'RULE-005',
      ruleName: 'Internal + Failed Transfer',
      conditions: JSON.stringify({ paymentType: 'INTERNAL', issueCategory: 'FAILED_TRANSFER' }),
    },
  ];

  for (const rule of triggeredRules) {
    await prisma.triggeredRule.create({ data: rule });
  }
  console.log(`  ✓ Created ${triggeredRules.length} triggered rules`);

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
