import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const transactionsRouter = Router();

transactionsRouter.get('/', async (req, res, next) => {
  try {
    const { customerId, status } = req.query;

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        id: true,
        customerId: true,
        amount: true,
        paymentType: true,
        status: true,
        description: true,
        transactionDate: true,
      },
    });

    res.json({ transactions });
  } catch (error) {
    next(error);
  }
});
