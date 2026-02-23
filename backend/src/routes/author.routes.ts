import { Router } from 'express';
import { getAuthorDashboard } from '../controllers/author.controller';
import { authenticate, authorizeRole } from '../middleware/auth';
import { query } from 'express-validator';
import { validate } from '../middleware/validation';

const router = Router();

const dashboardQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('size')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Size must be between 1 and 100')
    .toInt(),
];

router.get(
  '/dashboard',
  authenticate,
  authorizeRole('author'),
  validate(dashboardQueryValidator),
  getAuthorDashboard
);

export default router;
