import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required', ['No token provided'], 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    req.user = {
      userId: decoded.sub,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token', ['Authentication failed'], 401);
  }
};

export const authorizeRole = (...roles: ('author' | 'reader')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', ['User not authenticated'], 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Forbidden', ['You do not have permission to access this resource'], 403);
    }

    next();
  };
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      req.user = {
        userId: decoded.sub,
        role: decoded.role,
      };
    }
    
    next();
  } catch (error) {
    next();
  }
};
