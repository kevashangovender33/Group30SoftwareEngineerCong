---
inclusion: fileMatch
fileMatchPattern: "server/prisma/**"
---

# Prisma Guide

These guidelines apply when working with the Prisma schema and database layer.

## Schema Reference

#[[server/prisma/schema.prisma]]

## Conventions

- Use `Int @id @default(autoincrement())` for primary keys.
- Include `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` on all models.
- Use `@unique` for fields that must be unique (emails, slugs, etc.).
- Define relations explicitly with `@relation`.

## Workflow

1. Edit `server/prisma/schema.prisma` to add/change models.
2. Run `npm run db:migrate --workspace=server` to create a migration.
3. Run `npm run db:generate --workspace=server` to regenerate the Prisma client.
4. Import and use the client in route handlers or service modules.

## Usage Pattern

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Example: find all users
const users = await prisma.user.findMany();

// Example: create a user
const user = await prisma.user.create({
  data: { email: 'test@example.com', name: 'Test' },
});
```

## Tips

- Use a singleton Prisma client instance rather than creating a new one per request.
- Use `select` or `include` to limit fields returned and avoid over-fetching.
- Use transactions (`prisma.$transaction`) for operations that must be atomic.
