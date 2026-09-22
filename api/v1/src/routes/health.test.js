import { it, expect, describe, beforeAll, beforeEach, jest, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import healthRouter from './health.js';

describe('Health Check Endpoint', () => {
  let app;
  const originalEnv = process.env;

  beforeAll(() => {
    // Create express app and mount the router
    app = express();
    app.use('/health', healthRouter);
  });

  beforeEach(() => {
    // Reset process.env before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should return 200 OK with health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
      environment: 'test'
    });
    expect(new Date(response.body.timestamp)).toBeValidDate();
  });

  it('should reflect the current NODE_ENV', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.environment).toBe('production');
  });

  it('should return valid ISO timestamp', async () => {
    const response = await request(app).get('/health');
    const timestamp = new Date(response.body.timestamp);

    expect(timestamp.toISOString()).toBe(response.body.timestamp);
    expect(timestamp.getTime()).not.toBeNaN();
  });
});

// Custom matcher for date validation
expect.extend({
  toBeValidDate(received) {
    const pass = !isNaN(new Date(received).getTime());
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid date`,
      pass
    };
  }
});
