import { Router } from 'express';

export const apiRouter = Router();

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
