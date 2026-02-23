import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: 'author' | 'reader';
  };
}

export interface BaseResponse<T = any> {
  Success: boolean;
  Message: string;
  Object: T | null;
  Errors: string[] | null;
}

export interface PaginatedResponse<T = any> {
  Success: boolean;
  Message: string;
  Object: T[];
  PageNumber: number;
  PageSize: number;
  TotalSize: number;
  Errors: null;
}
