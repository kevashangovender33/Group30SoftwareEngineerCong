import { Router } from 'express';
import { referenceDataRouter } from './reference-data.js';
import { customersRouter } from './customers.js';
import { transactionsRouter } from './transactions.js';
import { disputesRouter } from './disputes.js';
import { triageRouter } from './triage.js';

export const apiRouter = Router();

apiRouter.use('/reference-data', referenceDataRouter);
apiRouter.use('/customers', customersRouter);
apiRouter.use('/transactions', transactionsRouter);
apiRouter.use('/disputes', disputesRouter);
apiRouter.use('/triage', triageRouter);

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

apiRouter.post('/echo', (req, res) => {
  res.json({
    echo: req.body,
    receivedAt: new Date().toISOString(),
  });
});

apiRouter.get('/info', (_req, res) => {
  res.json({
    name: 'Node Conf Starter API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});
