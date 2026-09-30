import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { verifyToken } from '../utils/auth.js';

const SECOND = 1000;
const MINUTE = 60 * SECOND;

/**
 * Builds the response sent once a client runs out of budget.
 *
 * @param {string} message Guidance shown to the client.
 * @returns {import('express').RequestHandler} Handler for exhausted limits.
 */
function limitReached(message) {
  return (req, res) => res.status(429).json({ error: message });
}

const shared = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
};

/**
 * Identifies the caller by IP, normalising IPv6 addresses to a /56 subnet so a single
 * client can't sidestep the limit by rotating through its address range.
 *
 * @param {import('express').Request} req Incoming request.
 * @returns {string} Rate-limit key.
 */
function ipKey(req) {
  return ipKeyGenerator(req.ip ?? '');
}

/**
 * Identifies the caller by account when signed in, falling back to IP otherwise.
 *
 * Signed-in users share an IP surprisingly often (households, offices, carrier NAT), so
 * keying saves by account keeps one heavy user from locking out everyone behind that IP.
 *
 * @param {import('express').Request} req Incoming request.
 * @returns {string} Rate-limit key.
 */
function userKey(req) {
  const token = req.cookies?.token;
  if (token) {
    try {
      return `user:${verifyToken(token).userId}`;
    } catch {
      // Unusable token: fall back to the IP bucket.
    }
  }
  return `ip:${ipKey(req)}`;
}

/**
 * Limits password guessing. Only failed attempts count, so people who simply sign in a
 * lot are never affected, while an attacker gets 10 guesses per 15 minutes per IP.
 *
 * @returns {import('express').RequestHandler} Login rate limiter.
 */
export function createLoginLimiter() {
  return rateLimit({
    ...shared,
    windowMs: 15 * MINUTE,
    limit: 10,
    keyGenerator: ipKey,
    skipSuccessfulRequests: true,
    handler: limitReached('Too many sign-in attempts. Try again in a few minutes.'),
  });
}

/**
 * Limits bulk account creation, which would otherwise let one client fill the database.
 *
 * @returns {import('express').RequestHandler} Registration rate limiter.
 */
export function createRegisterLimiter() {
  return rateLimit({
    ...shared,
    windowMs: 60 * MINUTE,
    limit: 5,
    keyGenerator: ipKey,
    handler: limitReached('Too many accounts created from this network. Try again later.'),
  });
}

/**
 * Baseline limit for the remaining account endpoints (`/me`, `/logout`), which the web
 * client calls about once per page load.
 *
 * @returns {import('express').RequestHandler} Account rate limiter.
 */
export function createAccountLimiter() {
  return rateLimit({
    ...shared,
    windowMs: 5 * MINUTE,
    limit: 120,
    keyGenerator: userKey,
    handler: limitReached('Too many requests. Try again in a few minutes.'),
  });
}

/**
 * Limits income/expense reads and writes.
 *
 * The calculator syncs on every keystroke, so a single edit can be a short burst of
 * requests. The budget is deliberately generous: it exists to stop a runaway client or
 * scripted abuse from hammering SQLite, not to police ordinary typing.
 *
 * @returns {import('express').RequestHandler} User-data rate limiter.
 */
export function createUserDataLimiter() {
  return rateLimit({
    ...shared,
    windowMs: 5 * MINUTE,
    limit: 300,
    keyGenerator: userKey,
    handler: limitReached('Too many updates. Your changes are safe on this device; try again shortly.'),
  });
}
