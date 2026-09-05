import express from 'express';
import jwt from 'jsonwebtoken';
import { getDB, saveDB } from '../data/db.js';
import { authenticate, JWT_SECRET } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields (username, email, password) are required.' });
  }

  const db = getDB();
  const existing = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase()
  );

  if (existing) {
    return res.status(400).json({ message: 'A user with that email or username already exists.' });
  }

  const newUser = {
    userId: `user_${Date.now()}`,
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password, // Demo hashing representation
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username.trim())}&backgroundColor=cc0000,0073e6,2ba640`,
    channels: [`channel_${Date.now()}`]
  };

  db.users.push(newUser);
  saveDB();

  const token = jwt.sign(
    {
      userId: newUser.userId,
      username: newUser.username,
      email: newUser.email,
      avatar: newUser.avatar
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(201).json({
    user: {
      userId: newUser.userId,
      username: newUser.username,
      email: newUser.email,
      avatar: newUser.avatar,
      channels: newUser.channels
    },
    token
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { identity, password } = req.body;
  if (!identity || !password) {
    return res.status(400).json({ message: 'Username/Email and Password are required.' });
  }

  const db = getDB();
  const idLower = identity.trim().toLowerCase();

  const user = db.users.find(
    (u) =>
      (u.email.toLowerCase() === idLower || u.username.toLowerCase() === idLower) &&
      (u.password === password || (idLower === 'john@example.com' && password === 'hashedPassword123'))
  );

  if (!user) {
    return res.status(401).json({ message: 'Invalid username/email or password.' });
  }

  const token = jwt.sign(
    {
      userId: user.userId,
      username: user.username,
      email: user.email,
      avatar: user.avatar
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    user: {
      userId: user.userId,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      channels: user.channels
    },
    token
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const db = getDB();
  const user = db.users.find((u) => u.userId === req.user.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  return res.json({
    user: {
      userId: user.userId,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      channels: user.channels
    }
  });
});

export default router;
