import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.js';
import healthRouter from './routes/health.js';
import { authenticate } from './middlewares/auth.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

// Public routes
app.use('/auth', authRouter);
app.use('/health', healthRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
