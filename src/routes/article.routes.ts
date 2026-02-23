import { Router } from 'express';
import {
  createArticle,
  getMyArticles,
  updateArticle,
  deleteArticle,
  getPublicArticles,
  getArticleById,
} from '../controllers/article.controller';
import { authenticate, authorizeRole, optionalAuth } from '../middleware/auth';
import {
  createArticleValidator,
  updateArticleValidator,
  articleQueryValidator,
} from '../validators/article.validator';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/', validate(articleQueryValidator), getPublicArticles);
router.get('/:id', optionalAuth, getArticleById);

// Author-only routes
router.post(
  '/',
  authenticate,
  authorizeRole('author'),
  validate(createArticleValidator),
  createArticle
);

router.get(
  '/me',
  authenticate,
  authorizeRole('author'),
  validate(articleQueryValidator),
  getMyArticles
);

router.put(
  '/:id',
  authenticate,
  authorizeRole('author'),
  validate(updateArticleValidator),
  updateArticle
);

router.delete('/:id', authenticate, authorizeRole('author'), deleteArticle);

export default router;
