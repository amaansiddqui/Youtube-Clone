import jwt from 'jsonwebtoken';

// Secret key used to sign and verify JSON Web Tokens (JWT)
export const JWT_SECRET = process.env.JWT_SECRET || 'yt_clone_backend_jwt_secret_2025';

/**
 * Middleware: Requires a valid JWT in the Authorization header (Bearer <token>).
 * If valid, attaches the decoded user payload to `req.user`.
 * If missing or invalid, blocks the request with a 401 Unauthorized status.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check if Authorization header is present and properly formatted
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Access denied. No authentication token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using our secret key
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authentication token has expired. Please sign in again.' });
    }
    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
}

/**
 * Middleware: Optional authentication.
 * Checks for a Bearer token; if present and valid, attaches `req.user`.
 * If missing or invalid, it still allows the request to continue as a guest user.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch {
      // If the token is invalid or expired, we simply proceed without req.user
      req.user = null;
    }
  } else {
    req.user = null;
  }

  return next();
}

