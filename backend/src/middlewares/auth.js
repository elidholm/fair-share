import { verifyToken } from '../utils/auth.js';

export const authenticate = (req, res, next) => {
  try {
    // 1. Get token from cookies
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // 2. Verify token
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    next();

  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
