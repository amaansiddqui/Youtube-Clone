import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { getDB, saveDB } from '../data/db.js';
import { authenticate, JWT_SECRET } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Checks if MongoDB is currently connected and ready.
 * If true, route handlers use MongoDB models; otherwise they fallback to the JSON database.
 */
function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Helper: Validates user password.
 * In production with real hashing, this would call bcrypt.compare().
 * For this demo clone, we compare direct strings, with a friendly fallback
 * for the demo seed account (John Doe).
 */
function verifyPassword(storedPassword, providedPassword, userEmail) {
  if (storedPassword === providedPassword) {
    return true;
  }
  // Allow common demo password for the seeded John Doe test account
  if (userEmail === 'john@example.com' && (providedPassword === 'password123' || providedPassword === 'hashedPassword123')) {
    return true;
  }
  return false;
}

/**
 * Helper: Creates a signed JWT token containing safe public user claims.
 */
function createAuthToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      username: user.username,
      email: user.email,
      avatar: user.avatar
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Helper: Returns a sanitized user object without sensitive fields like password.
 */
function formatUserResponse(user) {
  return {
    userId: user.userId,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    channels: user.channels || [],
    likedVideos: user.likedVideos || [],
    dislikedVideos: user.dislikedVideos || []
  };
}

/**
 * POST /api/auth/register
 * Creates a new user profile, stores it in MongoDB or JSON fallback,
 * and returns an authentication token.
 */
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Validate required input fields
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields (username, email, password) are required.' });
  }

  const emailLower = email.trim().toLowerCase();
  const trimmedUsername = username.trim();

  // Basic email format check
  if (!emailLower.includes('@') || !emailLower.includes('.')) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  // Password length requirement
  if (password.length < 4) {
    return res.status(400).json({ message: 'Password must be at least 4 characters long.' });
  }

  try {
    // 1. Handle MongoDB persistence if available
    if (isMongoConnected()) {
      const existing = await User.findOne({
        $or: [{ email: emailLower }, { username: trimmedUsername }]
      });

      if (existing) {
        return res.status(400).json({ message: 'A user with that email or username already exists.' });
      }

      const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedUsername)}&backgroundColor=cc0000,0073e6,2ba640`;
      const newUser = new User({
        userId: req.body.userId || `user_${Date.now()}`,
        username: trimmedUsername,
        email: emailLower,
        password,
        avatar: defaultAvatar,
        channels: req.body.channels || [`channel_${Date.now()}`],
        likedVideos: [],
        dislikedVideos: []
      });

      await newUser.save();

      // Keep JSON DB fallback in sync
      const db = getDB();
      const existingDbIdx = db.users.findIndex((u) => u.userId === newUser.userId || u.email === newUser.email);
      if (existingDbIdx === -1) {
        db.users.push({
          userId: newUser.userId,
          username: newUser.username,
          email: newUser.email,
          password: newUser.password,
          avatar: newUser.avatar,
          channels: newUser.channels,
          likedVideos: [],
          dislikedVideos: []
        });
        saveDB();
      }

      const token = createAuthToken(newUser);

      return res.status(201).json({
        user: formatUserResponse(newUser),
        token
      });
    }

    // 2. Fallback to in-memory / JSON database
    const db = getDB();
    const existing = db.users.find(
      (u) => u.email.toLowerCase() === emailLower || u.username.toLowerCase() === trimmedUsername.toLowerCase()
    );

    if (existing) {
      return res.status(400).json({ message: 'A user with that email or username already exists.' });
    }

    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedUsername)}&backgroundColor=cc0000,0073e6,2ba640`;
    const newUser = {
      userId: req.body.userId || `user_${Date.now()}`,
      username: trimmedUsername,
      email: emailLower,
      password,
      avatar: defaultAvatar,
      channels: req.body.channels || [`channel_${Date.now()}`],
      likedVideos: [],
      dislikedVideos: []
    };

    db.users.push(newUser);
    saveDB();

    const token = createAuthToken(newUser);

    return res.status(201).json({
      user: formatUserResponse(newUser),
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticates a user by email/username and password, returning a JWT token.
 */
router.post('/login', async (req, res) => {
  const { identity, password } = req.body;

  if (!identity || !password) {
    return res.status(400).json({ message: 'Username/Email and Password are required.' });
  }

  const idLower = identity.trim().toLowerCase();

  try {
    // 1. Check MongoDB if active
    if (isMongoConnected()) {
      const user = await User.findOne({
        $or: [{ email: idLower }, { username: new RegExp(`^${idLower}$`, 'i') }]
      });

      if (!user || !verifyPassword(user.password, password, user.email)) {
        return res.status(401).json({ message: 'Invalid username/email or password.' });
      }

      const token = createAuthToken(user);
      return res.json({
        user: formatUserResponse(user),
        token
      });
    }

    // 2. Check JSON database fallback
    const db = getDB();
    const user = db.users.find(
      (u) =>
        (u.email.toLowerCase() === idLower || u.username.toLowerCase() === idLower) &&
        verifyPassword(u.password, password, u.email)
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid username/email or password.' });
    }

    const token = createAuthToken(user);
    return res.json({
      user: formatUserResponse(user),
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user's profile based on verified JWT token.
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    if (isMongoConnected()) {
      const user = await User.findOne({ userId: req.user.userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      return res.json({ user: formatUserResponse(user) });
    }

    const db = getDB();
    const user = db.users.find((u) => u.userId === req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json({ user: formatUserResponse(user) });
  } catch (err) {
    console.error('Fetch me error:', err);
    return res.status(500).json({ message: 'Internal server error retrieving user profile.' });
  }
});

/**
 * GET /api/auth/users
 * Returns list of all user profiles.
 */
router.get('/users', async (_req, res) => {
  try {
    if (isMongoConnected()) {
      const users = await User.find();
      return res.json(users.map(formatUserResponse));
    }
    const db = getDB();
    return res.json(db.users.map(formatUserResponse));
  } catch (err) {
    console.error('Fetch users error:', err);
    return res.status(500).json({ message: 'Internal server error fetching users.' });
  }
});

/**
 * PUT /api/auth/users/:id
 * Updates an existing user's profile details in MongoDB and JSON DB.
 */
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const updateFields = { ...req.body };
  delete updateFields.password; // Do not overwrite password directly here

  try {
    let updatedUser = null;

    if (isMongoConnected()) {
      updatedUser = await User.findOneAndUpdate(
        { userId: id },
        { $set: updateFields },
        { returnDocument: 'after' }
      );
    }

    const db = getDB();
    const idx = db.users.findIndex((u) => u.userId === id);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...updateFields };
      saveDB();
      if (!updatedUser) {
        updatedUser = db.users[idx];
      }
    }

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ user: formatUserResponse(updatedUser) });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ message: 'Internal server error updating user.' });
  }
});

export default router;

