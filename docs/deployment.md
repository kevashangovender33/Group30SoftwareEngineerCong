# Deployment & System Initialisation

This document defines the system-level initialisation journey that occurs on first deployment only. It is extracted from the user journeys to separate infrastructure concerns from user-facing behaviour.

Use this document to inform: seed scripts, database migration strategy, CI/CD pipeline configuration, and environment setup.

---

## Initialisation Journey

**Actor:** System (automated)
**Trigger:** Server process starts for the first time (initial deployment)
**Requirements:** REQ-001, REQ-002, REQ-003

---

### Precondition Check (Idempotent Seeding)

**Before** any seeding occurs, the system shall check whether mock data already exists in the database.

| Check | Query | Outcome |
|-------|-------|---------|
| Customers exist? | `SELECT COUNT(*) FROM Customer` | If count > 0 → skip customer seeding |
| Transactions exist? | `SELECT COUNT(*) FROM Transaction` | If count > 0 → skip transaction seeding |

**If** data is already present, **then** the system shall skip seeding entirely and proceed to normal server startup. *(REQ-003)*

This ensures:
- Re-deployments do not duplicate seed data.
- Database migrations can run independently of seeding.
- Manual test data added post-deployment is preserved.

---

### Steps (EARS)

1. **When** the server process starts, the system shall connect to the local SQLite database using the configured `DATABASE_URL`. *(REQ-001)*
2. **When** the system initialises, the system shall run pending database migrations (Prisma migrate). *(REQ-001)*
3. **If** no customer records exist in the database, **then** the system shall seed at least 10 mock customers. *(REQ-003)*
4. **If** no transaction records exist in the database, **then** the system shall seed at least 20 mock transactions. *(REQ-003)*
5. The system shall restrict all data access to localised mock sources with no outbound network calls to external banking or payment APIs. *(REQ-001)*
6. The system shall limit payment type values stored in seed data to exactly: `CARD`, `EFT`, `INTERNAL`. *(REQ-002)*
7. The system shall seed transactions with varying statuses (`COMPLETED`, `PENDING`, `FAILED`, `ALREADY_REFUNDED`), varying amounts (below and above R10,000), and varying dates (recent and aged beyond 14 days). *(REQ-003)*

---

### Seed Data Distribution Requirements

| Dimension | Minimum Coverage |
|-----------|-----------------|
| Payment types | At least 1 transaction per type (`CARD`, `EFT`, `INTERNAL`) |
| Statuses | At least 1 transaction per status (`COMPLETED`, `PENDING`, `FAILED`, `ALREADY_REFUNDED`) |
| Amounts | At least 1 below R5,000; at least 1 between R5,000–R10,000; at least 1 above R10,000 |
| Dates | At least 1 within 7 days; at least 1 between 8–14 days ago; at least 1 older than 14 days |

---

### Postconditions

- Database contains ≥10 customers, ≥20 transactions across all three payment types.
- Application is fully functional offline after initial `npm install`.
- Subsequent server restarts do not re-seed data.

---

### Implementation Guidance

```typescript
// server/prisma/seed.ts — idempotent guard pattern
async function seed() {
  const customerCount = await prisma.customer.count();
  if (customerCount > 0) {
    console.log('Seed data already exists — skipping.');
    return;
  }

  // Proceed with seeding...
}
```

---

### Test Implications

| Layer | What to verify |
|-------|---------------|
| Database | Seed runs on empty DB; seed skips on populated DB; counts match minimums |
| API | No external HTTP calls on startup; health endpoint responds after init |
| Architecture | `DATABASE_URL` points to local file (`file:./dev.db`); no external service dependencies |
| Idempotency | Running seed twice produces same record count (no duplicates) |

---

### Environment Requirements

| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | `file:./dev.db` | Local SQLite file path |
| `HIGH_VALUE_THRESHOLD` | `10000` | Configurable threshold for priority assignment (optional, can default in code) |

---

### Deployment Sequence

```
1. npm install              → Install all dependencies
2. npx prisma migrate deploy → Apply pending migrations
3. npx prisma db seed       → Seed mock data (idempotent — skips if data exists)
4. npm run dev / npm start  → Start server
```

The seed step is safe to include in CI/CD pipelines and container entrypoints because it self-guards against duplicate execution.
