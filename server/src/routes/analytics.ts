import { Router, Request, Response, NextFunction } from 'express';
import { getAnalytics } from '../services/analyticsService.js';
import { AppError } from '../middleware/errorHandler.js';

export const analyticsRouter = Router();

/**
 * GET / — Aggregate dispute analytics
 * Requirements: 1.1–1.9
 */
analyticsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await getAnalytics();
    res.json(analytics);
  } catch (error) {
    const appError: AppError = new Error('Failed to retrieve analytics data') as AppError;
    appError.status = 500;
    appError.code = 'ANALYTICS_QUERY_FAILED';
    next(appError);
  }
});
