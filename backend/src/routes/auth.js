import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import { createUser, findUserByUsername } from '../models/user.js';
import { generateToken, verifyToken, comparePasswords } from '../utils/auth.js';
import db from '../db.js';

const router = express.Router();
router.use(cookieParser());

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if username exists
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 10);
    await createUser({ username, email, passwordHash });

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    // Verify token from cookies
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = verifyToken(token);
    const user = await db.get(
      'SELECT id, username, email FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (error) { // eslint-disable-line no-unused-vars
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Find user by email
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Compare passwords
    const isValid = await comparePasswords(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Generate JWT token
    const token = generateToken(user.id);

    // 4. Set HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // 5. Respond with user data (excluding password)
    res.json({
      id: user.id,
      username: user.username,
      email: user.email
    });

  } catch (error) { // eslint-disable-line no-unused-vars
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (_, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export default router;
