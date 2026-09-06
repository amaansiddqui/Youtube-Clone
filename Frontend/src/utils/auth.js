/**
 * User Authentication service using client-side tokens and localStorage persistence.
 * Provides login, registration, and active session management with graceful offline fallback.
 */

// Default demo user seeded for instant testing
export const SAMPLE_USER = {
  userId: "user01",
  username: "JohnDoe",
  email: "john@example.com",
  password: "hashedPassword123",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
  channels: ["channel01"]
};

// Local storage cache keys
const STORAGE_USERS_KEY = 'yt_registered_users';
const STORAGE_TOKEN_KEY = 'yt_auth_token';

/**
 * Encodes a string into a URL-safe Base64 representation.
 * Handles UTF-8 characters cleanly without deprecated unescape().
 */
function base64UrlEncode(str) {
  const utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  return btoa(utf8Bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes a URL-safe Base64 string back into a standard UTF-8 string.
 */
function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '=' to make length a multiple of 4
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const percentEncoded = Array.from(binary, (c) =>
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  ).join('');
  return decodeURIComponent(percentEncoded);
}

/**
 * Creates a standard 3-part JWT (header.payload.signature) for client-side demo sessions.
 */
export function generateJWT(payload, secret = 'yt_clone_jwt_secret_key_2024') {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const stringifiedHeader = JSON.stringify(header);
  const stringifiedPayload = JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days lifespan
  });

  const encodedHeader = base64UrlEncode(stringifiedHeader);
  const encodedPayload = base64UrlEncode(stringifiedPayload);

  // Client-side representation of signature
  const rawSignature = `${encodedHeader}.${encodedPayload}.${secret}`;
  const encodedSignature = base64UrlEncode(rawSignature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Parses and verifies an active JWT token.
 * Validates expiration timestamp and returns the payload claims if valid.
 */
export function decodeJWT(token) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decodedPayloadStr = base64UrlDecode(parts[1]);
    const payload = JSON.parse(decodedPayloadStr);

    // Verify token expiration
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTimestamp) {
      return null;
    }

    return payload;
  } catch (err) {
    console.error('Error decoding JWT token:', err);
    return null;
  }
}

/**
 * Reads the list of registered users from localStorage.
 * Seeds with the default sample user if storage is empty.
 */
export function getUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      const initialUsers = [SAMPLE_USER];
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    return JSON.parse(raw);
  } catch {
    return [SAMPLE_USER];
  }
}

/**
 * Saves the users list to localStorage.
 */
export function saveUsers(users) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users to storage:', err);
  }
}

/**
 * Registers a new user account locally.
 */
export function registerUser({ username, email, password }) {
  if (!username || !email || !password) {
    throw new Error('All fields (Username, Email, Password) are required.');
  }

  const emailLower = email.trim().toLowerCase();
  const trimmedUsername = username.trim();

  const users = getUsers();
  const existing = users.find(
    (u) => u.email.toLowerCase() === emailLower || u.username.toLowerCase() === trimmedUsername.toLowerCase()
  );

  if (existing) {
    throw new Error('A user with that email or username already exists.');
  }

  const newUser = {
    userId: `user_${Date.now()}`,
    username: trimmedUsername,
    email: emailLower,
    password: password,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedUsername)}&backgroundColor=cc0000,0073e6,2ba640`,
    channels: [`channel_${Date.now()}`]
  };

  users.push(newUser);
  saveUsers(users);

  // Issue session token
  const token = generateJWT({
    userId: newUser.userId,
    username: newUser.username,
    email: newUser.email,
    avatar: newUser.avatar
  });

  localStorage.setItem(STORAGE_TOKEN_KEY, token);

  return { user: newUser, token };
}

/**
 * Helper: Validates user password against stored credentials.
 * Supports the demo seed account password variations (password123 / hashedPassword123).
 */
function verifyPassword(storedPassword, enteredPassword, userEmail) {
  if (storedPassword === enteredPassword) return true;
  if (userEmail === 'john@example.com' && (enteredPassword === 'password123' || enteredPassword === 'hashedPassword123')) {
    return true;
  }
  return false;
}

/**
 * Logs in a user by matching their email/username and password.
 */
export function loginUser({ identity, password }) {
  if (!identity || !password) {
    throw new Error('Username/Email and Password are required.');
  }

  const users = getUsers();
  const idLower = identity.trim().toLowerCase();

  const user = users.find(
    (u) =>
      (u.email.toLowerCase() === idLower || u.username.toLowerCase() === idLower) &&
      verifyPassword(u.password, password, u.email)
  );

  if (!user) {
    throw new Error('Invalid username/email or password.');
  }

  // Issue session token
  const token = generateJWT({
    userId: user.userId,
    username: user.username,
    email: user.email,
    avatar: user.avatar
  });

  localStorage.setItem(STORAGE_TOKEN_KEY, token);

  return { user, token };
}

/**
 * Retrieves the currently signed-in user by decoding the stored JWT token.
 * Returns null if not logged in or token is expired.
 */
export function getCurrentUser() {
  try {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    if (!token) return null;
    return decodeJWT(token);
  } catch {
    return null;
  }
}

/**
 * Clears the user's active session token on sign out.
 */
export function logoutUser() {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
}

