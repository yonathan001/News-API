import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  return sendError(
    res,
    'Internal server error',
    process.env.NODE_ENV === 'development' ? [err.message] : ['An unexpected error occurred'],
    500
  );
};
