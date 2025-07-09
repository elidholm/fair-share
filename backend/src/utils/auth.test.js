import { expect, describe, it, jest, beforeAll, afterAll, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {
  generateToken,
  verifyToken,
  comparePasswords
} from './auth.js';

describe('Authentication Utilities', () => {
  // Test data
  const mockUserId = '12345';
  const mockPassword = 'securePassword123';
  let mockHashedPassword;
  let validToken;

  beforeAll(async () => {
    // Hash a password for comparison tests
    mockHashedPassword = await bcrypt.hash(mockPassword, 10);
    // Generate a valid token for verification tests
    validToken = generateToken(mockUserId);
  });

  describe('generateToken()', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUserId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify the token can be decoded
      const decoded = jwt.decode(token);
      expect(decoded.userId).toBe(mockUserId);
    });

    it('should include expiration in the token', () => {
      const token = generateToken(mockUserId);
      const decoded = jwt.decode(token);

      expect(decoded).toHaveProperty('exp');
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('verifyToken()', () => {
    it('should verify a valid token', () => {
      const result = verifyToken(validToken);

      expect(result).toHaveProperty('userId', mockUserId);
      expect(result).toHaveProperty('iat');
      expect(result).toHaveProperty('exp');
    });

    it('should throw an error for invalid tokens', () => {
      const invalidToken = 'invalid.token.string';

      expect(() => verifyToken(invalidToken)).toThrow();
    });

    it('should throw an error for expired tokens', () => {
      // Create an expired token (1 second in past)
      const expiredToken = jwt.sign(
        { userId: mockUserId },
        'deez',
        { expiresIn: '-1s' }
      );

      expect(() => verifyToken(expiredToken)).toThrow(/expired/);
    });
  });

  describe('comparePasswords()', () => {
    it('should return true for matching passwords', async () => {
      const result = await comparePasswords(mockPassword, mockHashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const result = await comparePasswords('wrongPassword', mockHashedPassword);
      expect(result).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const result = await comparePasswords('', mockHashedPassword);
      expect(result).toBe(false);
    });
  });

  describe('Environment Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should use default secret key when JWT_SECRET is not set', async () => {
      delete process.env.JWT_SECRET;
      const { generateToken } = await import('./auth.js');

      const token = generateToken(mockUserId);
      const decoded = jwt.verify(token, 'deez');

      expect(decoded.userId).toBe(mockUserId);
    });

    it('should use environment variable for secret key when set', async () => {
      process.env.JWT_SECRET = 'custom_secret_key';
      const { generateToken } = await import('./auth.js');

      const token = generateToken(mockUserId);
      const decoded = jwt.verify(token, 'custom_secret_key');

      expect(decoded.userId).toBe(mockUserId);
    });
  });
});
