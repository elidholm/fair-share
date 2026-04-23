import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

jest.unstable_mockModule('../db.js', () => ({
  default: {
    get: jest.fn(),
    run: jest.fn(),
  }
}));

jest.unstable_mockModule('../models/user.js', () => ({
  createUser: jest.fn(),
  findUserByUsername: jest.fn(),
}));

jest.unstable_mockModule('../utils/auth.js', () => ({
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
  comparePasswords: jest.fn(),
}));

describe('Auth Routes', () => {
  let app;
  let mockDb;
  let mockUserModel;
  let mockAuthUtils;

  beforeAll(async () => {
    const { default: authRouter } = await import('./auth.js');
    mockDb = (await import('../db.js')).default;
    mockUserModel = await import('../models/user.js');
    mockAuthUtils = await import('../utils/auth.js');

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/', authRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      mockUserModel.findUserByUsername.mockResolvedValue(null);
      mockUserModel.createUser.mockResolvedValue({ lastID: 1 });

      const response = await request(app)
        .post('/register')
        .send({ username: 'newuser', email: 'new@example.com', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: 'User created successfully' });
      expect(mockUserModel.findUserByUsername).toHaveBeenCalledWith('newuser');
      expect(mockUserModel.createUser).toHaveBeenCalled();
    });

    it('should return 400 when username already exists', async () => {
      mockUserModel.findUserByUsername.mockResolvedValue({ id: 1, username: 'existinguser' });

      const response = await request(app)
        .post('/register')
        .send({ username: 'existinguser', email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Username already exists' });
      expect(mockUserModel.createUser).not.toHaveBeenCalled();
    });

    it('should return 500 on server error', async () => {
      mockUserModel.findUserByUsername.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/register')
        .send({ username: 'newuser', email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /me', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get('/me');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Not authenticated' });
    });

    it('should return current user data for a valid token', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      mockDb.get.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/me')
        .set('Cookie', 'token=valid.token.here');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
    });

    it('should return 404 when user is not found', async () => {
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 999 });
      mockDb.get.mockResolvedValue(null);

      const response = await request(app)
        .get('/me')
        .set('Cookie', 'token=valid.token.here');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    it('should return 401 for an invalid token', async () => {
      mockAuthUtils.verifyToken.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      const response = await request(app)
        .get('/me')
        .set('Cookie', 'token=invalid.token');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid token' });
    });
  });

  describe('POST /login', () => {
    it('should return 401 when user is not found', async () => {
      mockUserModel.findUserByUsername.mockResolvedValue(null);

      const response = await request(app)
        .post('/login')
        .send({ username: 'unknownuser', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid credentials' });
    });

    it('should return 401 for a wrong password', async () => {
      mockUserModel.findUserByUsername.mockResolvedValue({
        id: 1,
        username: 'testuser',
        password_hash: 'hashedpw'
      });
      mockAuthUtils.comparePasswords.mockResolvedValue(false);

      const response = await request(app)
        .post('/login')
        .send({ username: 'testuser', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid credentials' });
    });

    it('should login successfully and set an auth cookie', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', password_hash: 'hash' };
      mockUserModel.findUserByUsername.mockResolvedValue(mockUser);
      mockAuthUtils.comparePasswords.mockResolvedValue(true);
      mockAuthUtils.generateToken.mockReturnValue('mock.jwt.token');

      const response = await request(app)
        .post('/login')
        .send({ username: 'testuser', password: 'correctpassword' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 1, username: 'testuser', email: 'test@example.com' });
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token=');
    });

    it('should return 500 on server error', async () => {
      mockUserModel.findUserByUsername.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/login')
        .send({ username: 'testuser', password: 'password123' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Login failed' });
    });
  });

  describe('POST /logout', () => {
    it('should logout successfully and clear the auth cookie', async () => {
      const response = await request(app).post('/logout');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Logged out successfully' });
      const cookie = response.headers['set-cookie']?.[0] ?? '';
      expect(cookie).toContain('token=;');
    });
  });
});
