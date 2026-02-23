import request from 'supertest';
import app from '../app';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    article: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    readLog: {
      create: jest.fn(),
    },
  },
}));

describe('Article Endpoints', () => {
  const authorToken = generateToken('author-id-123', 'author');
  const readerToken = generateToken('reader-id-456', 'reader');

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/articles', () => {
    it('should create article as author', async () => {
      const mockArticle = {
        id: 'article-123',
        title: 'Test Article',
        content: 'This is a test article with more than 50 characters of content.',
        category: 'Tech',
        status: 'Published',
        authorId: 'author-id-123',
        createdAt: new Date(),
        deletedAt: null,
        author: {
          id: 'author-id-123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      (prisma.article.create as jest.Mock).mockResolvedValue(mockArticle);

      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'Test Article',
          content: 'This is a test article with more than 50 characters of content.',
          category: 'Tech',
          status: 'Published',
        });

      expect(response.status).toBe(201);
      expect(response.body.Success).toBe(true);
      expect(response.body.Object).toHaveProperty('title', 'Test Article');
    });

    it('should reject article creation by reader', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${readerToken}`)
        .send({
          title: 'Test Article',
          content: 'This is a test article with more than 50 characters of content.',
          category: 'Tech',
        });

      expect(response.status).toBe(403);
      expect(response.body.Success).toBe(false);
    });

    it('should validate article content length', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'Test Article',
          content: 'Too short',
          category: 'Tech',
        });

      expect(response.status).toBe(400);
      expect(response.body.Success).toBe(false);
    });
  });

  describe('GET /api/articles', () => {
    it('should return published articles', async () => {
      const mockArticles = [
        {
          id: 'article-1',
          title: 'Article 1',
          content: 'Content 1',
          category: 'Tech',
          createdAt: new Date(),
          author: { id: '1', name: 'Author 1' },
        },
      ];

      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (prisma.article.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app).get('/api/articles');

      expect(response.status).toBe(200);
      expect(response.body.Success).toBe(true);
      expect(response.body.Object).toHaveLength(1);
      expect(response.body).toHaveProperty('PageNumber');
      expect(response.body).toHaveProperty('TotalSize');
    });

    it('should filter articles by category', async () => {
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.article.count as jest.Mock).mockResolvedValue(0);

      const response = await request(app).get('/api/articles?category=Tech');

      expect(response.status).toBe(200);
      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'Tech',
          }),
        })
      );
    });
  });

  describe('GET /api/articles/:id', () => {
    it('should return article and create read log', async () => {
      const mockArticle = {
        id: 'article-123',
        title: 'Test Article',
        content: 'Content',
        deletedAt: null,
        author: { id: '1', name: 'Author' },
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.readLog.create as jest.Mock).mockResolvedValue({});

      const response = await request(app).get('/api/articles/article-123');

      expect(response.status).toBe(200);
      expect(response.body.Success).toBe(true);
      expect(response.body.Object).toHaveProperty('title', 'Test Article');
    });

    it('should return error for deleted article', async () => {
      const mockArticle = {
        id: 'article-123',
        deletedAt: new Date(),
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);

      const response = await request(app).get('/api/articles/article-123');

      expect(response.status).toBe(404);
      expect(response.body.Success).toBe(false);
      expect(response.body.Message).toBe('News article no longer available');
    });
  });

  describe('DELETE /api/articles/:id', () => {
    it('should soft delete article', async () => {
      const mockArticle = {
        id: 'article-123',
        authorId: 'author-id-123',
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.article.update as jest.Mock).mockResolvedValue({
        ...mockArticle,
        deletedAt: new Date(),
      });

      const response = await request(app)
        .delete('/api/articles/article-123')
        .set('Authorization', `Bearer ${authorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.Success).toBe(true);
      expect(prisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should prevent deleting another author\'s article', async () => {
      const mockArticle = {
        id: 'article-123',
        authorId: 'different-author-id',
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);

      const response = await request(app)
        .delete('/api/articles/article-123')
        .set('Authorization', `Bearer ${authorToken}`);

      expect(response.status).toBe(403);
      expect(response.body.Success).toBe(false);
    });
  });
});
