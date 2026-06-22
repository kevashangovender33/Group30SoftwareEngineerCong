---
inclusion: fileMatch
fileMatchPattern: "server/prisma/**"
---

# Prisma Guide

These guidelines apply when working with the Prisma schema and database layer.

## Schema Reference

#[[server/prisma/schema.prisma]]

## Conventions

- Use `String @id @default(uuid())` for primary keys (UUID format).
- Include `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` on all models.
- Use `@unique` for fields that must be unique (emails, reference numbers, account numbers).
- Define relations explicitly with `@relation`.
- Store enum-like values as `String` with valid values documented in comments.

## Current Models

- **Customer** — bank account holder (id, name, email, accountNumber)
- **Transaction** — payment record (id, customerId, amount, paymentType, status, transactionDate)
- **Dispute** — triage record (id, referenceNumber, customerId, transactionId, paymentType, issueCategory, priority, ageIndicator, recommendedAction, triggeredRules)

## Workflow

1. Edit `server/prisma/schema.prisma` to add/change models.
2. Run `npm run db:migrate --workspace=server` to create a migration.
3. Run `npm run db:generate --workspace=server` to regenerate the Prisma client.
4. Import and use the client in route handlers or service modules.

## Usage Pattern

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Example: find all customers
const customers = await prisma.customer.findMany();

// Example: create a dispute
const dispute = await prisma.dispute.create({
  data: {
    referenceNumber: 'DSP-001',
    customerId: 'cust-001',
    transactionId: 'txn-001',
    paymentType: 'CARD',
    issueCategory: 'DUPLICATE_DEBIT',
    status: 'TRIAGED',
    priority: 'LOW',
    ageIndicator: 'NEW',
    recommendedAction: 'Immediate Reversal',
    triggeredRules: JSON.stringify([{ ruleId: 'RULE-002', ruleName: 'Card + Duplicate Debit' }]),
  },
});
```

## Tips

- Use a singleton Prisma client instance (create in a shared module, import everywhere).
- Use `select` or `include` to limit fields returned and avoid over-fetching.
- Use transactions (`prisma.$transaction`) for operations that must be atomic.
- The `triggeredRules` field stores a JSON string array — parse it when reading.
