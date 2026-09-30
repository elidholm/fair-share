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

    it('should return 401 when the token is invalid or expired', async () => {
      const expired = new Error('jwt expired');
      expired.name = 'TokenExpiredError';
      mockAuthUtils.verifyToken.mockImplementation(() => { throw expired; });

      const response = await request(app)
        .post('/')
        .set('Cookie', 'token=expired.token.here')
        .send({ expenses: [] });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Not authenticated' });
      expect(mockDb.run).not.toHaveBeenCalled();
    });

    it.each([
      ['missing', {}],
      ['an object', { expenses: { name: 'x' } }],
      ['a string', { expenses: 'nope' }],
    ])('should return 400 without writing when expenses is %s', async (_label, body) => {
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });

      const response = await request(app)
        .post('/')
        .set('Cookie', 'token=valid.token.here')
        .send(body);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'expenses must be an array' });
      expect(mockDb.run).not.toHaveBeenCalled();
    });

    it('should return 404 when the user no longer exists', async () => {
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 999 });
      mockDb.run.mockResolvedValue({ changes: 0 });

      const response = await request(app)
        .post('/')
        .set('Cookie', 'token=valid.token.here')
        .send({ expenses: [] });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    it('should log a read-only database and return a generic 500 without leaking internals', async () => {
      const readonly = Object.assign(
        new Error('SQLITE_READONLY: attempt to write a readonly database'),
        { errno: 8, code: 'SQLITE_READONLY' }
      );
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      mockDb.run.mockRejectedValue(readonly);
      const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const response = await request(app)
        .post('/')
        .set('Cookie', 'token=valid.token.here')
        .send({ expenses: [{ name: 'A', amount: 1 }] });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to save expenses' });
      expect(logSpy).toHaveBeenCalledWith('Failed to save expenses:', readonly);
      logSpy.mockRestore();
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
