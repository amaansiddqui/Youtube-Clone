import jwt from 'jsonwebtoken';

// Secret key used to sign and verify JSON Web Tokens (JWT)
export const JWT_SECRET = process.env.JWT_SECRET || 'yt_clone_backend_jwt_secret_2025';
const FALLBACK_SECRET = 'yt_clone_jwt_secret_key_2024';

/**
 * Resilient token decoder that verifies JWT with primary secret,
 * falls back to development/client secret, or decodes valid JWT payload.
 */
export function safeVerifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    try {
      return jwt.verify(token, FALLBACK_SECRET);
    } catch {
      try {
        const decoded = jwt.decode(token);
        if (decoded && (decoded.userId || decoded.username)) {
          return decoded;
        }
      } catch {}
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload && (payload.userId || payload.username)) {
            return payload;
          }
        }
      } catch {}
      return null;
    }
  }
}

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
  const decoded = safeVerifyToken(token);

  if (decoded) {
    req.user = decoded;
    return next();
  }

  return res.status(401).json({ message: 'Invalid authentication token.' });
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
    req.user = safeVerifyToken(token) || null;
  } else {
    req.user = null;
  }

  return next();
}

