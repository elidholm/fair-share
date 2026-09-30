import express from 'express';
import db from '../db.js';
import { verifyToken } from '../utils/auth.js';
import { sendRouteError } from '../utils/http.js';

const router = express.Router();

// Get user expenses data
router.get('/', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = verifyToken(token);
    const user = await db.get(
      'SELECT expenses FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      expenses: user.expenses ? JSON.parse(user.expenses) : []
    });
  } catch (error) {
    sendRouteError(res, error, 'load expenses');
  }
});

// Save user expenses data
router.post('/', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = verifyToken(token);
    const { expenses } = req.body ?? {};
    if (!Array.isArray(expenses)) {
      return res.status(400).json({ error: 'expenses must be an array' });
    }

    const result = await db.run(
      'UPDATE users SET expenses = ? WHERE id = ?',
      [JSON.stringify(expenses), decoded.userId]
    );
    if (result?.changes === 0) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'Expenses data saved successfully' });
  } catch (error) {
    sendRouteError(res, error, 'save expenses');
  }
});

// Clear user expenses data
router.delete('/', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = verifyToken(token);

    await db.run(
      'UPDATE users SET expenses = ? WHERE id = ?',
      ['[]', decoded.userId]
    );

    res.json({ message: 'Expenses data cleared successfully' });
  } catch (error) {
    sendRouteError(res, error, 'clear expenses');
  }
});

export default router;
