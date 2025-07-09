import { expect, it, jest, describe, beforeEach } from '@jest/globals';
import { authenticate } from './auth.js';

// Mock the entire auth utils module
jest.unstable_mockModule('../utils/auth.js', () => ({
  verifyToken: jest.fn()
}));

describe('authenticate middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;
  let authUtils;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Import the mocked module
    authUtils = await import('../utils/auth.js');

    // Setup mock request, response, and next function
    mockRequest = {
      cookies: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  it('should return 401 if no token is provided', async () => {
    await authenticate(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid token', async () => {
    const mockToken = 'invalid.token.here';
    mockRequest.cookies.token = mockToken;
    authUtils.verifyToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authenticate(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
