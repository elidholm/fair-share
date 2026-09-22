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

jest.unstable_mockModule('../utils/auth.js', () => ({
  verifyToken: jest.fn(),
}));

describe('Expenses Routes', () => {
  let app;
  let mockDb;
  let mockAuthUtils;

  beforeAll(async () => {
    const { default: expensesRouter } = await import('./expenses.js');
    mockDb = (await import('../db.js')).default;
    mockAuthUtils = await import('../utils/auth.js');

    app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use('/', expensesRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Not authenticated' });
    });

    it('should return expenses for a valid token', async () => {
      const mockExpenses = [{ name: 'Rent', amount: 1000 }, { name: 'Utilities', amount: 200 }];
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      mockDb.get.mockResolvedValue({ expenses: JSON.stringify(mockExpenses) });

      const response = await request(app)
        .get('/')
        .set('Cookie', 'token=valid.token.here');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ expenses: mockExpenses });
    });

    it('should return an empty array when user has no expenses stored', async () => {
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      mockDb.get.mockResolvedValue({ expenses: null });

      const response = await request(app)
        .get('/')
        .set('Cookie', 'token=valid.token.here');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ expenses: [] });
    });

    it('should return 404 when user is not found', async () => {
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 999 });
      mockDb.get.mockResolvedValue(null);

      const response = await request(app)
        .get('/')
        .set('Cookie', 'token=valid.token.here');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    it('should return 500 on a database error', async () => {
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      mockDb.get.mockRejectedValue(new Error('DB read failure'));

      const response = await request(app)
        .get('/')
        .set('Cookie', 'token=valid.token.here');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post('/')
        .send({ expenses: [{ name: 'Rent', amount: 1000 }] });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Not authenticated' });
    });

    it('should save expenses and return a success message', async () => {
      const expenses = [{ name: 'Rent', amount: 1000 }, { name: 'Food', amount: 300 }];
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      mockDb.run.mockResolvedValue({ changes: 1 });

      const response = await request(app)
        .post('/')
        .set('Cookie', 'token=valid.token.here')
        .send({ expenses });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Expenses data saved successfully' });
      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE users SET expenses = ? WHERE id = ?',
        [JSON.stringify(expenses), 1]
      );
    });

    it('should return 500 on a database error', async () => {
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      mockDb.run.mockRejectedValue(new Error('DB write failure'));

      const response = await request(app)
        .post('/')
        .set('Cookie', 'token=valid.token.here')
        .send({ expenses: [] });

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).delete('/');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Not authenticated' });
    });

    it('should clear expenses and return a success message', async () => {
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      mockDb.run.mockResolvedValue({ changes: 1 });

      const response = await request(app)
        .delete('/')
        .set('Cookie', 'token=valid.token.here');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Expenses data cleared successfully' });
      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE users SET expenses = ? WHERE id = ?',
        ['[]', 1]
      );
    });

    it('should return 500 on a database error', async () => {
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      mockDb.run.mockRejectedValue(new Error('DB delete failure'));

      const response = await request(app)
        .delete('/')
        .set('Cookie', 'token=valid.token.here');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });
});
