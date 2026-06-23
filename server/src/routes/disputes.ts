import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { evaluate } from '../services/triageEngine.js';
import { VALID_PAYMENT_TYPES, VALID_ISSUE_CATEGORIES } from '../constants.js';
import { AppError } from '../middleware/errorHandler.js';

export const disputesRouter = Router();

/**
 * POST / — Create dispute and triage
 * REQ-004, REQ-005, REQ-006, REQ-010, REQ-011
 */
disputesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId, paymentType, issueCategory } = req.body;

    // Validate required fields
    const missingFields: string[] = [];
    if (!transactionId) missingFields.push('transactionId');
    if (!paymentType) missingFields.push('paymentType');
    if (!issueCategory) missingFields.push('issueCategory');

    if (missingFields.length > 0) {
      const error: AppError = new Error('Missing required fields') as AppError;
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      error.fields = missingFields;
      throw error;
    }

    // Validate paymentType
    if (!VALID_PAYMENT_TYPES.includes(paymentType)) {
      const error: AppError = new Error(`Invalid payment type: ${paymentType}`) as AppError;
      error.status = 422;
      error.code = 'INVALID_PAYMENT_TYPE';
      throw error;
    }

    // Validate issueCategory
    if (!VALID_ISSUE_CATEGORIES.includes(issueCategory)) {
      const error: AppError = new Error(`Invalid issue category: ${issueCategory}`) as AppError;
      error.status = 422;
      error.code = 'INVALID_ISSUE_CATEGORY';
      throw error;
    }

    // Look up transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { customer: true },
    });

    if (!transaction) {
      const error: AppError = new Error('Transaction not found') as AppError;
      error.status = 404;
      error.code = 'TRANSACTION_NOT_FOUND';
      throw error;
    }

    // Evaluate triage
    const triageResult = evaluate({
      paymentType: paymentType as 'CARD' | 'EFT' | 'INTERNAL',
      issueCategory,
      transactionStatus: transaction.status,
      transactionAmount: transaction.amount,
      transactionDate: new Date(transaction.transactionDate),
    });

    // Generate reference number (use a retry loop to handle concurrent inserts)
    let dispute;
    let referenceNumber: string;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      attempts++;
      const disputeCount = await prisma.dispute.count();
      referenceNumber = `DSP-${String(disputeCount + 1).padStart(3, '0')}`;

      try {
        dispute = await prisma.dispute.create({
          data: {
            referenceNumber,
            customerId: transaction.customerId,
            transactionId,
            paymentType,
            issueCategory,
            status: 'TRIAGED',
            priority: triageResult.priority,
            ageIndicator: triageResult.ageIndicator,
            recommendedAction: triageResult.recommendation,
            triggeredRules: JSON.stringify(triageResult.rulesTriggered),
          },
        });
        break;
      } catch (err: unknown) {
        // If unique constraint on referenceNumber, retry with a new count
        if (
          err &&
          typeof err === 'object' &&
          'code' in err &&
          (err as { code: string }).code === 'P2002' &&
          attempts < maxAttempts
        ) {
          continue;
        }
        throw err;
      }
    }

    if (!dispute) {
      const error: AppError = new Error('Failed to generate unique reference number') as AppError;
      error.status = 500;
      error.code = 'REFERENCE_NUMBER_CONFLICT';
      throw error;
    }

    // Return response
    res.status(201).json({
      disputeId: dispute.id,
      referenceNumber: dispute.referenceNumber,
      status: dispute.status,
      triage: {
        recommendation: triageResult.recommendation,
        recommendationCode: triageResult.recommendationCode,
        priority: triageResult.priority,
        ageIndicator: triageResult.ageIndicator,
        rulesTriggered: triageResult.rulesTriggered,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /:id — Get dispute details
 * REQ-011, REQ-012, REQ-015, REQ-016, REQ-021
 */
disputesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        transaction: true,
        customer: true,
      },
    });

    if (!dispute) {
      const error: AppError = new Error('Dispute not found') as AppError;
      error.status = 404;
      error.code = 'DISPUTE_NOT_FOUND';
      throw error;
    }

    // Parse triggeredRules from JSON string
    const rulesTriggered = dispute.triggeredRules
      ? JSON.parse(dispute.triggeredRules)
      : [];

    res.json({
      disputeId: dispute.id,
      referenceNumber: dispute.referenceNumber,
      status: dispute.status,
      paymentType: dispute.paymentType,
      issueCategory: dispute.issueCategory,
      priority: dispute.priority,
      ageIndicator: dispute.ageIndicator,
      recommendation: dispute.recommendedAction,
      rulesTriggered,
      transaction: {
        id: dispute.transaction.id,
        amount: dispute.transaction.amount,
        paymentType: dispute.transaction.paymentType,
        status: dispute.transaction.status,
        description: dispute.transaction.description,
        transactionDate: dispute.transaction.transactionDate.toISOString(),
      },
      customer: {
        id: dispute.customer.id,
        name: dispute.customer.name,
        accountNumber: dispute.customer.accountNumber,
      },
      createdAt: dispute.createdAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /:id/acknowledge — Acknowledge dispute
 */
disputesRouter.post('/:id/acknowledge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const dispute = await prisma.dispute.findUnique({
      where: { id },
    });

    if (!dispute) {
      const error: AppError = new Error('Dispute not found') as AppError;
      error.status = 404;
      error.code = 'DISPUTE_NOT_FOUND';
      throw error;
    }

    res.json({
      disputeId: dispute.id,
      acknowledged: true,
      nextAction: 'RETURN_TO_CAPTURE',
    });
  } catch (error) {
    next(error);
  }
});
