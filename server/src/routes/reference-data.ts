import { Router } from 'express';
import {
  PAYMENT_TYPE_LABELS,
  ISSUE_CATEGORY_LABELS,
} from '../constants.js';

export const referenceDataRouter = Router();

referenceDataRouter.get('/', (_req, res) => {
  res.json({
    paymentTypes: Object.values(PAYMENT_TYPE_LABELS),
    issueCategories: Object.values(ISSUE_CATEGORY_LABELS),
    dataSource: 'MOCK',
  });
});
