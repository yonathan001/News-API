import { Response } from 'express';
import { BaseResponse, PaginatedResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data: T | null = null,
  statusCode: number = 200
): Response => {
  const response: BaseResponse<T> = {
    Success: true,
    Message: message,
    Object: data,
    Errors: null,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  errors: string[] = [],
  statusCode: number = 400
): Response => {
  const response: BaseResponse = {
    Success: false,
    Message: message,
    Object: null,
    Errors: errors.length > 0 ? errors : null,
  };
  return res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  message: string,
  data: T[],
  pageNumber: number,
  pageSize: number,
  totalSize: number
): Response => {
  const response: PaginatedResponse<T> = {
    Success: true,
    Message: message,
    Object: data,
    PageNumber: pageNumber,
    PageSize: pageSize,
    TotalSize: totalSize,
    Errors: null,
  };
  return res.status(200).json(response);
};
