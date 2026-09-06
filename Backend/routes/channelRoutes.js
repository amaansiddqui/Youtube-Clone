import express from 'express';
import mongoose from 'mongoose';
import Channel from '../models/Channel.js';
import Video from '../models/Video.js';
import User from '../models/User.js';
import { getDB, saveDB } from '../data/db.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Checks whether MongoDB is active and connected.
 */
function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * GET /api/channels
 * Returns a list of all creators and channels.
 */
router.get('/', async (_req, res) => {
  try {
    if (isMongoConnected()) {
      const channels = await Channel.find();
      return res.json(channels);
    }
    const db = getDB();
    return res.json(db.channels);
  } catch (err) {
    console.error('Fetch channels error:', err);
    return res.status(500).json({ message: 'Internal server error fetching channels.' });
  }
});

/**
 * GET /api/channels/:id
 * Retrieves a single channel profile by its unique channelId.
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (isMongoConnected()) {
      const channel = await Channel.findOne({ channelId: id });
      if (!channel) {
        return res.status(404).json({ message: 'Channel not found.' });
      }
      return res.json(channel);
    }

    const db = getDB();
    const channel = db.channels.find((c) => c.channelId === id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found.' });
    }
    return res.json(channel);
  } catch (err) {
    console.error('Fetch channel error:', err);
    return res.status(500).json({ message: 'Internal server error fetching channel.' });
  }
});

/**
 * GET /api/channels/:id/videos
 * Returns all videos published by or associated with this channel.
 */
router.get('/:id/videos', async (req, res) => {
  const channelId = req.params.id;

  try {
    if (isMongoConnected()) {
      const channel = await Channel.findOne({ channelId });
      const channelVideoIds = channel && Array.isArray(channel.videos) ? channel.videos : [];

      // Find videos matching this channelId directly, or whose ID is listed in the channel's videos array
      const videos = await Video.find({
        $or: [{ channelId }, { videoId: { $in: channelVideoIds } }]
      }).sort({ uploadDate: -1, createdAt: -1 });

      return res.json(videos);
    }

    const db = getDB();
    const channel = db.channels.find((c) => c.channelId === channelId);

    const videos = db.videos.filter((v) => {
      if (v.channelId === channelId) return true;
      if (channel && Array.isArray(channel.videos) && channel.videos.includes(v.videoId)) {
        return true;
      }
      return false;
    });

    return res.json(videos);
  } catch (err) {
    console.error('Fetch channel videos error:', err);
    return res.status(500).json({ message: 'Internal server error fetching channel videos.' });
  }
});

/**
 * POST /api/channels
 * Creates a new channel profile for the authenticated user.
 * Associates the new channel ID with the user's profile.
 */
router.post('/', authenticate, async (req, res) => {
  const { channelName, description, channelBanner, avatarUrl } = req.body;

  if (!channelName || !channelName.trim()) {
    return res.status(400).json({ message: 'Channel name is required.' });
  }

  const channelId = `channel_${Date.now()}`;
  const trimmedName = channelName.trim();

  // Sensible default branding assets
  const defaultBanner = channelBanner?.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80';
  const defaultAvatar = avatarUrl?.trim() || req.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedName)}&backgroundColor=cc0000,0073e6`;
  const defaultDesc = description?.trim() || `Welcome to ${trimmedName}! Official channel for videos, tutorials, and community updates.`;

  try {
    if (isMongoConnected()) {
      const newChannel = new Channel({
        channelId,
        channelName: trimmedName,
        owner: req.user.userId,
        description: defaultDesc,
        channelBanner: defaultBanner,
        avatarUrl: defaultAvatar,
        subscribers: 0,
        videos: []
      });

      await newChannel.save();

      // Append new channelId to user's registered channels list
      await User.findOneAndUpdate(
        { userId: req.user.userId },
        { $addToSet: { channels: channelId } }
      );

      return res.status(201).json(newChannel);
    }

    const db = getDB();
    const newChannel = {
      channelId,
      channelName: trimmedName,
      owner: req.user.userId,
      description: defaultDesc,
      channelBanner: defaultBanner,
      avatarUrl: defaultAvatar,
      subscribers: 0,
      videos: [],
      createdAt: new Date().toISOString()
    };

    db.channels.push(newChannel);

    // Update user's channels list in JSON DB
    const user = db.users.find((u) => u.userId === req.user.userId);
    if (user) {
      user.channels = Array.isArray(user.channels) ? [...user.channels, channelId] : [channelId];
    }

    saveDB();
    return res.status(201).json(newChannel);
  } catch (err) {
    console.error('Create channel error:', err);
    return res.status(500).json({ message: 'Internal server error creating channel.' });
  }
});

/**
 * PUT /api/channels/:id
 * Updates channel details such as banner, avatar, description, or title.
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (isMongoConnected()) {
      const updatedChannel = await Channel.findOneAndUpdate(
        { channelId: id },
        { $set: req.body },
        { returnDocument: 'after' }
      );

      if (!updatedChannel) {
        return res.status(404).json({ message: 'Channel not found.' });
      }
      return res.json(updatedChannel);
    }

    const db = getDB();
    const index = db.channels.findIndex((c) => c.channelId === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Channel not found.' });
    }

    const updatedChannel = {
      ...db.channels[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    db.channels[index] = updatedChannel;
    saveDB();
    return res.json(updatedChannel);
  } catch (err) {
    console.error('Update channel error:', err);
    return res.status(500).json({ message: 'Internal server error updating channel.' });
  }
});

/**
 * DELETE /api/channels/:id
 * Permanently removes a channel.
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (isMongoConnected()) {
      const deleted = await Channel.findOneAndDelete({ channelId: id });
      if (!deleted) {
        return res.status(404).json({ message: 'Channel not found.' });
      }
      return res.json({ success: true, message: 'Channel deleted successfully.' });
    }

    const db = getDB();
    db.channels = db.channels.filter((c) => c.channelId !== id);
    saveDB();
    return res.json({ success: true, message: 'Channel deleted successfully.' });
  } catch (err) {
    console.error('Delete channel error:', err);
    return res.status(500).json({ message: 'Internal server error deleting channel.' });
  }
});

/**
 * POST /api/channels/:id/subscribe
 * Toggles channel subscription on or off and updates the subscriber count.
 */
router.post('/:id/subscribe', async (req, res) => {
  const channelId = req.params.id;

  try {
    const db = getDB();
    const currentSub = Boolean(db.subscriptions[channelId]);
    const newSub = !currentSub;

    // Toggle subscription in persistence
    if (newSub) {
      db.subscriptions[channelId] = true;
    } else {
      delete db.subscriptions[channelId];
    }

    // Also update subscriber counter accordingly (+1 if subscribed, -1 if unsubscribed)
    const delta = newSub ? 1 : -1;

    if (isMongoConnected()) {
      const channel = await Channel.findOneAndUpdate(
        { channelId },
        { $inc: { subscribers: delta } },
        { returnDocument: 'after' }
      );

      saveDB();
      return res.json({
        isSubscribed: newSub,
        subscribers: Math.max(0, channel ? channel.subscribers : 0)
      });
    }

    const channel = db.channels.find((c) => c.channelId === channelId);
    if (channel) {
      channel.subscribers = Math.max(0, (channel.subscribers || 0) + delta);
    }

    saveDB();
    return res.json({
      isSubscribed: newSub,
      subscribers: channel ? channel.subscribers : 0
    });
  } catch (err) {
    console.error('Subscribe toggle error:', err);
    return res.status(500).json({ message: 'Internal server error toggling subscription.' });
  }
});

export default router;
