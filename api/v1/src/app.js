import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.js';
import healthRouter from './routes/health.js';
import incomesRouter from './routes/incomes.js';
import expensesRouter from './routes/expenses.js';
import {
  createAccountLimiter,
  createLoginLimiter,
  createRegisterLimiter,
  createUserDataLimiter,
} from './middlewares/rateLimit.js';

const app = express();

// In production the API is reached through Traefik and the web service's nginx, so the
// socket peer is always nginx. Trusting those private hops lets `req.ip` resolve to the
// real client, which is what the rate limiters key on. Traefik replaces any client-sent
// X-Forwarded-For, so this can't be spoofed from the internet. Left off by default
// elsewhere, because the dev stack publishes the API directly.
const defaultTrustProxy = process.env.NODE_ENV === 'production'
  ? 'loopback, linklocal, uniquelocal'
  : '';
const trustProxy = process.env.TRUST_PROXY ?? defaultTrustProxy;
if (trustProxy) {
  app.set('trust proxy', /^\d+$/.test(trustProxy.trim()) ? Number(trustProxy) : trustProxy);
}

app.use(express.json());
app.use(cookieParser());

// Rate limits, mounted before the routers. /health is deliberately unlimited: it serves
// the container healthcheck.
// Each endpoint gets exactly one limiter, so the advertised RateLimit header always
// describes the limit that actually applies to that request.
app.use('/auth/login', createLoginLimiter());
app.use('/auth/register', createRegisterLimiter());
app.use('/auth/me', createAccountLimiter());
app.use('/auth/logout', createAccountLimiter());
app.use('/incomes', createUserDataLimiter());
app.use('/expenses', createUserDataLimiter());

// Public routes
app.use('/auth', authRouter);
app.use('/health', healthRouter);
app.use('/incomes', incomesRouter);
app.use('/expenses', expensesRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
