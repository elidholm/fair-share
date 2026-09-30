import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

jest.unstable_mockModule('../utils/auth.js', () => ({
  verifyToken: jest.fn(),
}));

describe('Rate limiting', () => {
  let limiters;
  let mockAuthUtils;

  beforeAll(async () => {
    limiters = await import('./rateLimit.js');
    mockAuthUtils = await import('../utils/auth.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** Builds an app whose single route reports the status the test asks for. */
  function buildApp(limiter, status = 200) {
    const app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use(limiter);
    app.all('/', (req, res) => res.status(status).json({ ok: status < 400 }));
    return app;
  }

  async function hit(app, times, headers = {}) {
    const responses = [];
    for (let i = 0; i < times; i += 1) {
      responses.push(await request(app).get('/').set(headers));
    }
    return responses;
  }

  describe('login', () => {
    it('allows 10 failed attempts, then answers 429 with guidance', async () => {
      const app = buildApp(limiters.createLoginLimiter(), 401);

      const allowed = await hit(app, 10);
      expect(allowed.every((res) => res.status === 401)).toBe(true);

      const blocked = await request(app).get('/');
      expect(blocked.status).toBe(429);
      expect(blocked.body).toEqual({ error: 'Too many sign-in attempts. Try again in a few minutes.' });
    });

    it('does not count successful sign-ins, so normal use is never blocked', async () => {
      const app = buildApp(limiters.createLoginLimiter(), 200);

      const responses = await hit(app, 25);

      expect(responses.every((res) => res.status === 200)).toBe(true);
    });

    it('advertises the limit with standard headers instead of legacy ones', async () => {
      const app = buildApp(limiters.createLoginLimiter(), 401);

      const response = await request(app).get('/');

      expect(response.headers).toHaveProperty('ratelimit');
      expect(response.headers).toHaveProperty('ratelimit-policy');
      expect(response.headers['x-ratelimit-limit']).toBeUndefined();
    });
  });

  describe('registration', () => {
    it('allows 5 new accounts per window, then answers 429', async () => {
      const app = buildApp(limiters.createRegisterLimiter(), 201);

      const allowed = await hit(app, 5);
      expect(allowed.every((res) => res.status === 201)).toBe(true);

      const blocked = await request(app).get('/');
      expect(blocked.status).toBe(429);
      expect(blocked.body.error).toMatch(/Too many accounts/);
    });
  });

  describe('user data', () => {
    it('allows a long burst of saves before limiting, since the client syncs per keystroke', async () => {
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      const app = buildApp(limiters.createUserDataLimiter());

      const allowed = await hit(app, 300, { Cookie: 'token=user-one' });
      expect(allowed.every((res) => res.status === 200)).toBe(true);

      const blocked = await request(app).get('/').set('Cookie', 'token=user-one');
      expect(blocked.status).toBe(429);
      expect(blocked.body.error).toMatch(/Too many updates/);
    });

    it('keys by account, so one heavy user cannot block another sharing the same IP', async () => {
      mockAuthUtils.verifyToken.mockImplementation((token) => ({ userId: token === 'a' ? 1 : 2 }));
      const app = buildApp(limiters.createUserDataLimiter());

      await hit(app, 300, { Cookie: 'token=a' });
      expect((await request(app).get('/').set('Cookie', 'token=a')).status).toBe(429);

      const other = await request(app).get('/').set('Cookie', 'token=b');
      expect(other.status).toBe(200);
    });

    it('falls back to the IP bucket when the token is missing or unusable', async () => {
      mockAuthUtils.verifyToken.mockImplementation(() => { throw new Error('jwt malformed'); });
      const app = buildApp(limiters.createUserDataLimiter());

      const anonymous = await request(app).get('/');
      const broken = await request(app).get('/').set('Cookie', 'token=garbage');

      expect(anonymous.status).toBe(200);
      expect(broken.status).toBe(200);
      // Both fell back to the same IP key, so they drew from one shared budget.
      expect(broken.headers.ratelimit).toMatch(/remaining=298/);
    });
  });

  describe('account endpoints', () => {
    it('allows routine /me polling and limits runaway clients', async () => {
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 7 });
      const app = buildApp(limiters.createAccountLimiter());

      const allowed = await hit(app, 120, { Cookie: 'token=user-seven' });
      expect(allowed.every((res) => res.status === 200)).toBe(true);

      const blocked = await request(app).get('/').set('Cookie', 'token=user-seven');
      expect(blocked.status).toBe(429);
    });
  });
});
