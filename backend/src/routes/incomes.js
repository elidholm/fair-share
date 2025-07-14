import express from 'express';
import db from '../db.js';
import { verifyToken } from '../utils/auth.js';

const router = express.Router();

// Get user income data
router.get('/', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = verifyToken(token);
    const user = await db.get(
      'SELECT incomes FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      incomes: user.incomes ? JSON.parse(user.incomes) : []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save user income data
router.post('/', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = verifyToken(token);
    const { incomes } = req.body;

    await db.run(
      'UPDATE users SET incomes = ? WHERE id = ?',
      [JSON.stringify(incomes), decoded.userId]
    );

    res.json({ message: 'Income data saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear user income data
router.delete('/', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = verifyToken(token);

    await db.run(
      'UPDATE users SET incomes = ? WHERE id = ?',
      ['[]', decoded.userId]
    );

    res.json({ message: 'Income data cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
