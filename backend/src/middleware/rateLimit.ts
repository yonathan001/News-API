import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every minute
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000);

export const createRateLimiter = (windowMs: number, maxRequests: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Create a unique key based on IP and article ID (for read tracking)
    const identifier = req.params.id 
      ? `${req.ip}-${req.params.id}` 
      : req.ip || 'unknown';
    
    const now = Date.now();
    const record = store[identifier];

    if (!record || record.resetTime < now) {
      // Create new record
      store[identifier] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    if (record.count >= maxRequests) {
      return sendError(
        res,
        'Too many requests',
        ['You are making too many requests. Please try again later.'],
        429
      );
    }

    // Increment count
    record.count++;
    next();
  };
};

// Rate limiter specifically for article reads (prevents spam refreshing)
// Allows 3 reads per article per 10 seconds per user
export const articleReadLimiter = createRateLimiter(10000, 3);
