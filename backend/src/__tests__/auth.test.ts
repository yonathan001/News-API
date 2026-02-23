import request from 'supertest';
import app from '../app';
import prisma from '../config/database';
import * as bcrypt from 'bcrypt';

// Mock Prisma
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock('bcrypt');

describe('Auth Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'author',
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'SecurePass123!',
          role: 'author',
        });

      expect(response.status).toBe(201);
      expect(response.body.Success).toBe(true);
      expect(response.body.Message).toBe('User registered successfully');
      expect(response.body.Object).toHaveProperty('email', 'john@example.com');
    });

    it('should return 409 if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '123',
        email: 'john@example.com',
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'SecurePass123!',
          role: 'author',
        });

      expect(response.status).toBe(409);
      expect(response.body.Success).toBe(false);
      expect(response.body.Errors).toContain('Email is already registered');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'weak',
          role: 'author',
        });

      expect(response.status).toBe(400);
      expect(response.body.Success).toBe(false);
      expect(response.body.Errors).toBeDefined();
    });

    it('should validate name contains only alphabets', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'John123',
          email: 'john@example.com',
          password: 'SecurePass123!',
          role: 'author',
        });

      expect(response.status).toBe(400);
      expect(response.body.Success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        password: '$2b$12$hashedpassword',
        role: 'author',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.Success).toBe(true);
      expect(response.body.Object).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'WrongPass123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.Success).toBe(false);
    });
  });
});
