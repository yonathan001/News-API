import { body, query } from 'express-validator';

export const createArticleValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 150 })
    .withMessage('Title must be between 1 and 150 characters'),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters'),
  
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  
  body('status')
    .optional()
    .isIn(['Draft', 'Published'])
    .withMessage('Status must be either Draft or Published'),
];

export const updateArticleValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Title must be between 1 and 150 characters'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters'),
  
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty'),
  
  body('status')
    .optional()
    .isIn(['Draft', 'Published'])
    .withMessage('Status must be either Draft or Published'),
];

export const articleQueryValidator = [
  query('category')
    .optional()
    .trim(),
  
  query('author')
    .optional()
    .trim(),
  
  query('q')
    .optional()
    .trim(),
  
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
