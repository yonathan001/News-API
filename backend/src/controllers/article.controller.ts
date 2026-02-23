import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

export const createArticle = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, category, status } = req.body;
    const authorId = req.user!.userId;

    const article = await prisma.article.create({
      data: {
        title,
        content,
        category,
        status: status || 'Draft',
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return sendSuccess(res, 'Article created successfully', article, 201);
  } catch (error) {
    console.error('Create article error:', error);
    return sendError(res, 'Failed to create article', ['An error occurred'], 500);
  }
};

export const getMyArticles = async (req: AuthRequest, res: Response) => {
  try {
    const authorId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const skip = (page - 1) * size;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: { authorId },
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          status: true,
          createdAt: true,
          deletedAt: true,
        },
      }),
      prisma.article.count({ where: { authorId } }),
    ]);

    return sendPaginated(res, 'Articles retrieved successfully', articles, page, size, total);
  } catch (error) {
    console.error('Get my articles error:', error);
    return sendError(res, 'Failed to retrieve articles', ['An error occurred'], 500);
  }
};

export const updateArticle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const authorId = req.user!.userId;
    const { title, content, category, status } = req.body;

    const article = await prisma.article.findUnique({ where: { id } });
    
    if (!article) {
      return sendError(res, 'Article not found', ['Article does not exist'], 404);
    }

    if (article.authorId !== authorId) {
      return sendError(res, 'Forbidden', ['You can only edit your own articles'], 403);
    }

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        ...(status && { status }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return sendSuccess(res, 'Article updated successfully', updatedArticle);
  } catch (error) {
    console.error('Update article error:', error);
    return sendError(res, 'Failed to update article', ['An error occurred'], 500);
  }
};

export const deleteArticle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const authorId = req.user!.userId;

    const article = await prisma.article.findUnique({ where: { id } });
    
    if (!article) {
      return sendError(res, 'Article not found', ['Article does not exist'], 404);
    }

    if (article.authorId !== authorId) {
      return sendError(res, 'Forbidden', ['You can only delete your own articles'], 403);
    }

    await prisma.article.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return sendSuccess(res, 'Article deleted successfully', null);
  } catch (error) {
    console.error('Delete article error:', error);
    return sendError(res, 'Failed to delete article', ['An error occurred'], 500);
  }
};

export const getPublicArticles = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const skip = (page - 1) * size;
    const { category, author, q } = req.query;

    const where: any = {
      status: 'Published',
      deletedAt: null,
    };

    if (category) {
      where.category = category;
    }

    if (author) {
      where.author = {
        name: {
          contains: author as string,
          mode: 'insensitive',
        },
      };
    }

    if (q) {
      where.title = {
        contains: q as string,
        mode: 'insensitive',
      };
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return sendPaginated(res, 'Articles retrieved successfully', articles, page, size, total);
  } catch (error) {
    console.error('Get public articles error:', error);
    return sendError(res, 'Failed to retrieve articles', ['An error occurred'], 500);
  }
};

export const getArticleById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!article) {
      return sendError(res, 'Article not found', ['Article does not exist'], 404);
    }

    if (article.deletedAt) {
      return sendError(res, 'News article no longer available', ['This article has been deleted'], 404);
    }

    // Create read log entry (non-blocking)
    setImmediate(async () => {
      try {
        await prisma.readLog.create({
          data: {
            articleId: id,
            readerId: req.user?.userId || null,
          },
        });
      } catch (error) {
        console.error('Failed to create read log:', error);
      }
    });

    return sendSuccess(res, 'Article retrieved successfully', article);
  } catch (error) {
    console.error('Get article by id error:', error);
    return sendError(res, 'Failed to retrieve article', ['An error occurred'], 500);
  }
};
