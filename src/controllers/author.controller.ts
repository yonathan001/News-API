import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { sendPaginated, sendError } from '../utils/response';

export const getAuthorDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const authorId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const skip = (page - 1) * size;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: {
          authorId,
          deletedAt: null,
        },
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          dailyAnalytics: {
            select: {
              viewCount: true,
            },
          },
        },
      }),
      prisma.article.count({
        where: {
          authorId,
          deletedAt: null,
        },
      }),
    ]);

    const dashboardData = articles.map((article) => ({
      id: article.id,
      title: article.title,
      createdAt: article.createdAt,
      TotalViews: article.dailyAnalytics.reduce((sum, analytics) => sum + analytics.viewCount, 0),
    }));

    return sendPaginated(
      res,
      'Dashboard data retrieved successfully',
      dashboardData,
      page,
      size,
      total
    );
  } catch (error) {
    console.error('Get author dashboard error:', error);
    return sendError(res, 'Failed to retrieve dashboard data', ['An error occurred'], 500);
  }
};
