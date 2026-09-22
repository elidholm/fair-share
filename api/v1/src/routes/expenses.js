import express from 'express';
import db from '../db.js';
import { verifyToken } from '../utils/auth.js';

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
    res.status(500).json({ error: error.message });
  }
});

// Save user expenses data
router.post('/', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = verifyToken(token);
    const { expenses } = req.body;

    await db.run(
      'UPDATE users SET expenses = ? WHERE id = ?',
      [JSON.stringify(expenses), decoded.userId]
    );

    res.json({ message: 'Expenses data saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

export default router;
