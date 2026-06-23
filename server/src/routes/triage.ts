import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { evaluate } from '../services/triageEngine.js';
import { VALID_PAYMENT_TYPES, VALID_ISSUE_CATEGORIES } from '../constants.js';
import { AppError } from '../middleware/errorHandler.js';

export const triageRouter = Router();

// POST /evaluate — Dry-run triage evaluation (REQ-006, REQ-007, REQ-008, REQ-009, REQ-010)
triageRouter.post('/evaluate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId, paymentType, issueCategory } = req.body;

    // Validate required fields
    const missingFields: string[] = [];
    if (!transactionId) missingFields.push('transactionId');
    if (!paymentType) missingFields.push('paymentType');
    if (!issueCategory) missingFields.push('issueCategory');

    if (missingFields.length > 0) {
      const error: AppError = new Error(
        `Missing required fields: ${missingFields.join(', ')}`,
      );
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      error.fields = missingFields;
      throw error;
    }

    // Validate paymentType value
    if (!VALID_PAYMENT_TYPES.includes(paymentType)) {
      const error: AppError = new Error(
        `Invalid paymentType: ${paymentType}. Must be one of: ${VALID_PAYMENT_TYPES.join(', ')}`,
      );
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      error.fields = ['paymentType'];
      throw error;
    }

    // Validate issueCategory value
    if (!VALID_ISSUE_CATEGORIES.includes(issueCategory)) {
      const error: AppError = new Error(
        `Invalid issueCategory: ${issueCategory}. Must be one of: ${VALID_ISSUE_CATEGORIES.join(', ')}`,
      );
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      error.fields = ['issueCategory'];
      throw error;
    }

    // Look up transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      const error: AppError = new Error(
        `Transaction not found: ${transactionId}`,
      );
      error.status = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Evaluate using the triage engine
    const result = evaluate({
      paymentType,
      issueCategory,
      transactionStatus: transaction.status,
      transactionAmount: transaction.amount,
      transactionDate: new Date(transaction.transactionDate),
    });

    // Return dry-run result (no dispute record created)
    res.json({
      recommendation: result.recommendation,
      recommendationCode: result.recommendationCode,
      priority: result.priority,
      ageIndicator: result.ageIndicator,
      rulesTriggered: result.rulesTriggered,
    });
  } catch (error) {
    next(error);
  }
});
