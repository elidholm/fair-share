import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'Backend API is up and running',
    timestamp: new Date().toISOString()
  });
});

export default router;
