import express from 'express';

const router = express.Router();

router.get('/', (_, res) => {
  res.json({
    status: 'healty',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;
