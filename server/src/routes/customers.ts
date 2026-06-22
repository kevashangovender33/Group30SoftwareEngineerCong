import { Router, NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const customersRouter = Router();

customersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string | undefined;

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { accountNumber: { contains: search } },
          ],
        }
      : undefined;

    const customers = await prisma.customer.findMany({
      where,
      select: { id: true, name: true, email: true, accountNumber: true },
    });

    res.json({ customers });
  } catch (error) {
    next(error);
  }
});
