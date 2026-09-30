const AUTH_ERRORS = new Set(['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError']);

/**
 * Sends a safe error response for a failed user-data request.
 *
 * Invalid or expired tokens are client errors (401). Anything else is logged with its
 * details and answered with a generic 500, so database internals are not exposed.
 *
 * @param {import('express').Response} res Express response.
 * @param {Error} error Error thrown while handling the request.
 * @param {string} action Short description used in the log and response, e.g. "save incomes".
 * @returns {import('express').Response} The sent response.
 */
export function sendRouteError(res, error, action) {
  if (AUTH_ERRORS.has(error?.name)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  console.error(`Failed to ${action}:`, error);
  return res.status(500).json({ error: `Failed to ${action}` });
}
