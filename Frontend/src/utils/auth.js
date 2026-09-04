// User Authentication service using JWT and localStorage

export const SAMPLE_USER = {
  userId: "user01",
  username: "JohnDoe",
  email: "john@example.com",
  password: "hashedPassword123",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
  channels: ["channel01"]
};

const STORAGE_USERS_KEY = 'yt_registered_users';
const STORAGE_TOKEN_KEY = 'yt_auth_token';

// JWT generation and verification in standard header.payload.signature format
function base64UrlEncode(str) {
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeURIComponent(escape(atob(base64)));
}

export function generateJWT(payload, secret = 'yt_clone_jwt_secret_key_2024') {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  const stringifiedHeader = JSON.stringify(header);
  const stringifiedPayload = JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
  });

  const encodedHeader = base64UrlEncode(stringifiedHeader);
  const encodedPayload = base64UrlEncode(stringifiedPayload);

  // Simple HMAC-like signature representation for client-side JWT demonstration
  const rawSignature = `${encodedHeader}.${encodedPayload}.${secret}`;
  const encodedSignature = base64UrlEncode(rawSignature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export function decodeJWT(token) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decodedPayloadStr = base64UrlDecode(parts[1]);
    const payload = JSON.parse(decodedPayloadStr);

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch (err) {
    console.error('Error decoding JWT:', err);
    return null;
  }
}

export function getUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      // Seed with sample user
      const initialUsers = [SAMPLE_USER];
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    return JSON.parse(raw);
  } catch {
    return [SAMPLE_USER];
  }
}

export function saveUsers(users) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users to storage', err);
  }
}

export function registerUser({ username, email, password }) {
  if (!username || !email || !password) {
    throw new Error('All fields (Username, Email, Password) are required.');
  }

  const users = getUsers();
  const existing = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase()
  );

  if (existing) {
    throw new Error('A user with that email or username already exists.');
  }

  const newUser = {
    userId: `user_${Date.now()}`,
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password: password, // In production this would be hashed on backend
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username.trim())}&backgroundColor=cc0000,0073e6,2ba640`,
    channels: [`channel_${Date.now()}`]
  };

  users.push(newUser);
  saveUsers(users);

  // Issue JWT token
  const token = generateJWT({
    userId: newUser.userId,
    username: newUser.username,
    email: newUser.email,
    avatar: newUser.avatar
  });

  localStorage.setItem(STORAGE_TOKEN_KEY, token);

  return { user: newUser, token };
}

export function loginUser({ identity, password }) {
  if (!identity || !password) {
    throw new Error('Username/Email and Password are required.');
  }

  const users = getUsers();
  const idLower = identity.trim().toLowerCase();

  const user = users.find(
    (u) =>
      (u.email.toLowerCase() === idLower || u.username.toLowerCase() === idLower) &&
      (u.password === password || (idLower === 'john@example.com' && password === 'hashedPassword123'))
  );

  if (!user) {
    throw new Error('Invalid username/email or password.');
  }

  // Issue JWT token
  const token = generateJWT({
    userId: user.userId,
    username: user.username,
    email: user.email,
    avatar: user.avatar
  });

  localStorage.setItem(STORAGE_TOKEN_KEY, token);

  return { user, token };
}

export function getCurrentUser() {
  try {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    if (!token) return null;
    const payload = decodeJWT(token);
    return payload;
  } catch {
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
}
