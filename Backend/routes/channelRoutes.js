import express from 'express';
import { getDB, saveDB } from '../data/db.js';
import { authenticate, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/channels - List all channels
router.get('/', (req, res) => {
  const db = getDB();
  return res.json(db.channels);
});

// GET /api/channels/:id - Single channel
router.get('/:id', (req, res) => {
  const db = getDB();
  const channel = db.channels.find((c) => c.channelId === req.params.id);
  if (!channel) {
    return res.status(404).json({ message: 'Channel not found' });
  }
  return res.json(channel);
});

// GET /api/channels/:id/videos - Videos belonging to channel
router.get('/:id/videos', (req, res) => {
  const db = getDB();
  const channelId = req.params.id;
  const channel = db.channels.find((c) => c.channelId === channelId);

  const videos = db.videos.filter((v) => {
    if (v.channelId === channelId) return true;
    if (channel && Array.isArray(channel.videos) && channel.videos.includes(v.videoId)) {
      return true;
    }
    return false;
  });

  return res.json(videos);
});

// POST /api/channels - Create channel (requires authentication)
router.post('/', authenticate, (req, res) => {
  const { channelName, description, channelBanner, avatarUrl } = req.body;
  if (!channelName || !channelName.trim()) {
    return res.status(400).json({ message: 'Channel name is required' });
  }

  const db = getDB();
  const channelId = `channel_${Date.now()}`;
  const trimmedName = channelName.trim();

  const newChannel = {
    channelId,
    channelName: trimmedName,
    owner: req.user.userId,
    description: description?.trim() || `Welcome to ${trimmedName}! Official channel for videos and updates.`,
    channelBanner:
      channelBanner?.trim() ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
    avatarUrl:
      avatarUrl?.trim() ||
      req.user.avatar ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedName)}&backgroundColor=cc0000,0073e6`,
    subscribers: 0,
    videos: [],
    createdAt: new Date().toISOString()
  };

  db.channels.push(newChannel);

  // Link channel to user record
  const user = db.users.find((u) => u.userId === req.user.userId);
  if (user) {
    user.channels = Array.isArray(user.channels) ? [...user.channels, channelId] : [channelId];
  }

  saveDB();
  return res.status(201).json(newChannel);
});

// PUT /api/channels/:id - Update channel details
router.put('/:id', (req, res) => {
  const db = getDB();
  const index = db.channels.findIndex((c) => c.channelId === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Channel not found' });
  }

  const updatedChannel = {
    ...db.channels[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  db.channels[index] = updatedChannel;
  saveDB();
  return res.json(updatedChannel);
});

// DELETE /api/channels/:id - Delete channel
router.delete('/:id', (req, res) => {
  const db = getDB();
  db.channels = db.channels.filter((c) => c.channelId !== req.params.id);
  saveDB();
  return res.json({ success: true, message: 'Channel deleted successfully' });
});

// POST /api/channels/:id/subscribe - Toggle subscription
router.post('/:id/subscribe', (req, res) => {
  const db = getDB();
  const channelId = req.params.id;
  const currentSub = Boolean(db.subscriptions[channelId]);
  const newSub = !currentSub;

  if (newSub) {
    db.subscriptions[channelId] = true;
  } else {
    delete db.subscriptions[channelId];
  }

  saveDB();
  return res.json({ subscribed: newSub });
});

export default router;
