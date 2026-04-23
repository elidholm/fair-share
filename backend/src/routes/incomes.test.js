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

describe('Incomes Routes', () => {
  let app;
  let mockDb;
  let mockAuthUtils;

  beforeAll(async () => {
    const { default: incomesRouter } = await import('./incomes.js');
    mockDb = (await import('../db.js')).default;
    mockAuthUtils = await import('../utils/auth.js');

    app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use('/', incomesRouter);
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

    it('should return incomes for a valid token', async () => {
      const mockIncomes = [{ name: 'Salary', amount: 5000 }, { name: 'Freelance', amount: 1000 }];
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      mockDb.get.mockResolvedValue({ incomes: JSON.stringify(mockIncomes) });

      const response = await request(app)
        .get('/')
        .set('Cookie', 'token=valid.token.here');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ incomes: mockIncomes });
    });

    it('should return an empty array when user has no incomes stored', async () => {
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      mockDb.get.mockResolvedValue({ incomes: null });

      const response = await request(app)
        .get('/')
        .set('Cookie', 'token=valid.token.here');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ incomes: [] });
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
        .send({ incomes: [{ name: 'Salary', amount: 5000 }] });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Not authenticated' });
    });

    it('should save incomes and return a success message', async () => {
      const incomes = [{ name: 'Salary', amount: 5000 }, { name: 'Bonus', amount: 500 }];
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      mockDb.run.mockResolvedValue({ changes: 1 });

      const response = await request(app)
        .post('/')
        .set('Cookie', 'token=valid.token.here')
        .send({ incomes });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Income data saved successfully' });
      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE users SET incomes = ? WHERE id = ?',
        [JSON.stringify(incomes), 1]
      );
    });

    it('should return 500 on a database error', async () => {
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      mockDb.run.mockRejectedValue(new Error('DB write failure'));

      const response = await request(app)
        .post('/')
        .set('Cookie', 'token=valid.token.here')
        .send({ incomes: [] });

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

    it('should clear incomes and return a success message', async () => {
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      mockDb.run.mockResolvedValue({ changes: 1 });

      const response = await request(app)
        .delete('/')
        .set('Cookie', 'token=valid.token.here');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Income data cleared successfully' });
      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE users SET incomes = ? WHERE id = ?',
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
