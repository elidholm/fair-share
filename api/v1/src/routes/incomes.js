import express from 'express';
import db from '../db.js';
import { verifyToken } from '../utils/auth.js';
import { sendRouteError } from '../utils/http.js';

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
    sendRouteError(res, error, 'load incomes');
  }
});

// Save user income data
router.post('/', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = verifyToken(token);
    const { incomes } = req.body ?? {};
    if (!Array.isArray(incomes)) {
      return res.status(400).json({ error: 'incomes must be an array' });
    }

    const result = await db.run(
      'UPDATE users SET incomes = ? WHERE id = ?',
      [JSON.stringify(incomes), decoded.userId]
    );
    if (result?.changes === 0) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'Income data saved successfully' });
  } catch (error) {
    sendRouteError(res, error, 'save incomes');
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
    sendRouteError(res, error, 'clear incomes');
  }
});

export default router;
