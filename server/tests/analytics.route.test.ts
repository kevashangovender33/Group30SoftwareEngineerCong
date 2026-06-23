import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { analyticsRouter } from '../src/routes/analytics.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

// Mock the analytics service
vi.mock('../src/services/analyticsService.js', () => ({
  getAnalytics: vi.fn(),
}));

import { getAnalytics } from '../src/services/analyticsService.js';

const mockGetAnalytics = vi.mocked(getAnalytics);

const app = express();
app.use('/api/disputes/analytics', analyticsRouter);
app.use(errorHandler);

describe('GET /api/disputes/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with correct JSON shape on success', async () => {
    const mockData = {
      paymentType: [
        { label: 'Card', count: 5 },
        { label: 'EFT', count: 3 },
        { label: 'Internal Transfer', count: 2 },
      ],
      issueCategory: [
        { label: 'Duplicate Debit', count: 4 },
      ],
      status: [
        { label: 'Open', count: 4 },
        { label: 'Triaged', count: 3 },
        { label: 'Closed', count: 3 },
      ],
      priority: [
        { label: 'High', count: 3 },
        { label: 'Medium', count: 4 },
        { label: 'Low', count: 3 },
      ],
      summary: {
        totalDisputes: 10,
        openDisputes: 4,
        resolvedDisputes: 3,
        highPriorityDisputes: 3,
      },
    };

    mockGetAnalytics.mockResolvedValue(mockData);

    const response = await request(app).get('/api/disputes/analytics');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockData);
    expect(response.body.paymentType).toHaveLength(3);
    expect(response.body.status).toHaveLength(3);
    expect(response.body.priority).toHaveLength(3);
    expect(response.body.summary.totalDisputes).toBe(10);
  });

  it('should return 500 with ANALYTICS_QUERY_FAILED code on database error', async () => {
    mockGetAnalytics.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app).get('/api/disputes/analytics');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('ANALYTICS_QUERY_FAILED');
    expect(response.body.error.message).toBe('Failed to retrieve analytics data');
  });
});
