import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { analyticsRouter } from '../src/routes/analytics.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

/**
 * Integration test for the analytics endpoint.
 * Tests the full route → service → Prisma pipeline with various mock data scenarios.
 */

// Mock Prisma for integration-style tests (we test the full route→service chain)
vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    dispute: {
      groupBy: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from '../src/lib/prisma.js';

const mockGroupBy = vi.mocked(prisma.dispute.groupBy);
const mockCount = vi.mocked(prisma.dispute.count);

const app = express();
app.use('/api/disputes/analytics', analyticsRouter);
app.use(errorHandler);

describe('Analytics Endpoint Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return correct aggregated counts with seeded data', async () => {
    mockGroupBy
      .mockResolvedValueOnce([
        { paymentType: 'CARD', _count: { _all: 5 } },
        { paymentType: 'EFT', _count: { _all: 3 } },
        { paymentType: 'INTERNAL', _count: { _all: 2 } },
      ] as any)
      .mockResolvedValueOnce([
        { issueCategory: 'DUPLICATE_DEBIT', _count: { _all: 4 } },
        { issueCategory: 'FAILED_TRANSFER', _count: { _all: 3 } },
        { issueCategory: 'UNAUTHORISED', _count: { _all: 2 } },
        { issueCategory: 'MISSING_PAYMENT', _count: { _all: 1 } },
      ] as any)
      .mockResolvedValueOnce([
        { status: 'OPEN', _count: { _all: 4 } },
        { status: 'TRIAGED', _count: { _all: 3 } },
        { status: 'CLOSED', _count: { _all: 3 } },
      ] as any)
      .mockResolvedValueOnce([
        { priority: 'HIGH', _count: { _all: 3 } },
        { priority: 'MEDIUM', _count: { _all: 4 } },
        { priority: 'LOW', _count: { _all: 3 } },
      ] as any);

    mockCount
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(4)  // open
      .mockResolvedValueOnce(3)  // resolved
      .mockResolvedValueOnce(3); // high priority

    const response = await request(app).get('/api/disputes/analytics');

    expect(response.status).toBe(200);

    // Verify response shape
    expect(response.body).toHaveProperty('paymentType');
    expect(response.body).toHaveProperty('issueCategory');
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('priority');
    expect(response.body).toHaveProperty('summary');

    // Verify counts
    expect(response.body.paymentType).toEqual([
      { label: 'Card', count: 5 },
      { label: 'EFT', count: 3 },
      { label: 'Internal Transfer', count: 2 },
    ]);

    expect(response.body.issueCategory).toEqual([
      { label: 'Duplicate Debit', count: 4 },
      { label: 'Failed Transfer', count: 3 },
      { label: 'Unauthorised', count: 2 },
      { label: 'Missing Payment', count: 1 },
    ]);

    expect(response.body.summary).toEqual({
      totalDisputes: 10,
      openDisputes: 4,
      resolvedDisputes: 3,
      highPriorityDisputes: 3,
    });
  });

  it('should return all zeros with correct shape for empty database (HTTP 200)', async () => {
    mockGroupBy
      .mockResolvedValueOnce([]) // paymentType
      .mockResolvedValueOnce([]) // issueCategory
      .mockResolvedValueOnce([]) // status
      .mockResolvedValueOnce([]); // priority

    mockCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const response = await request(app).get('/api/disputes/analytics');

    expect(response.status).toBe(200);

    expect(response.body.paymentType).toEqual([
      { label: 'Card', count: 0 },
      { label: 'EFT', count: 0 },
      { label: 'Internal Transfer', count: 0 },
    ]);

    expect(response.body.status).toEqual([
      { label: 'Open', count: 0 },
      { label: 'Triaged', count: 0 },
      { label: 'Closed', count: 0 },
    ]);

    expect(response.body.priority).toEqual([
      { label: 'High', count: 0 },
      { label: 'Medium', count: 0 },
      { label: 'Low', count: 0 },
    ]);

    expect(response.body.issueCategory).toEqual([]);

    expect(response.body.summary).toEqual({
      totalDisputes: 0,
      openDisputes: 0,
      resolvedDisputes: 0,
      highPriorityDisputes: 0,
    });
  });

  it('should return updated counts after new dispute is added (freshness)', async () => {
    // First call: 10 disputes
    mockGroupBy
      .mockResolvedValueOnce([
        { paymentType: 'CARD', _count: { _all: 6 } },
        { paymentType: 'EFT', _count: { _all: 3 } },
        { paymentType: 'INTERNAL', _count: { _all: 2 } },
      ] as any)
      .mockResolvedValueOnce([
        { issueCategory: 'DUPLICATE_DEBIT', _count: { _all: 5 } },
      ] as any)
      .mockResolvedValueOnce([
        { status: 'OPEN', _count: { _all: 5 } },
        { status: 'TRIAGED', _count: { _all: 3 } },
        { status: 'CLOSED', _count: { _all: 3 } },
      ] as any)
      .mockResolvedValueOnce([
        { priority: 'HIGH', _count: { _all: 4 } },
        { priority: 'MEDIUM', _count: { _all: 4 } },
        { priority: 'LOW', _count: { _all: 3 } },
      ] as any);

    mockCount
      .mockResolvedValueOnce(11) // total (increased)
      .mockResolvedValueOnce(5)  // open (increased)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4); // high priority (increased)

    const response = await request(app).get('/api/disputes/analytics');

    expect(response.status).toBe(200);
    expect(response.body.summary.totalDisputes).toBe(11);
    expect(response.body.summary.openDisputes).toBe(5);
    expect(response.body.summary.highPriorityDisputes).toBe(4);
  });

  it('should return 500 with ANALYTICS_QUERY_FAILED on Prisma failure', async () => {
    mockGroupBy.mockRejectedValueOnce(new Error('Database connection lost'));

    const response = await request(app).get('/api/disputes/analytics');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('ANALYTICS_QUERY_FAILED');
    expect(response.body.error.message).toBe('Failed to retrieve analytics data');
  });
});
