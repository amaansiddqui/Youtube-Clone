import express from 'express';
import { getDB, saveDB } from '../data/db.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/videos - List all videos with optional search and category filters
router.get('/', (req, res) => {
  const db = getDB();
  const { q, category } = req.query;
  let list = [...db.videos];

  if (category && category !== 'All') {
    list = list.filter((v) => v.category?.toLowerCase() === category.toLowerCase());
  }

  if (q && q.trim()) {
    const searchLower = q.trim().toLowerCase();
    list = list.filter(
      (v) =>
        v.title.toLowerCase().includes(searchLower) ||
        (v.channelName && v.channelName.toLowerCase().includes(searchLower)) ||
        (v.description && v.description.toLowerCase().includes(searchLower))
    );
  }

  return res.json(list);
});

// GET /api/videos/:id - Single video
router.get('/:id', (req, res) => {
  const db = getDB();
  const video = db.videos.find((v) => v.videoId === req.params.id);
  if (!video) {
    return res.status(404).json({ message: 'Video not found' });
  }
  return res.json(video);
});

// POST /api/videos - Add new video
router.post('/', (req, res) => {
  const { title, description, category, thumbnailUrl, videoUrl, duration, channelId, channelName, uploader, avatarUrl } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const db = getDB();
  const videoId = `video_${Date.now()}`;
  const newVideo = {
    videoId,
    title: title.trim(),
    description: description?.trim() || '',
    category: category || 'General',
    thumbnailUrl: thumbnailUrl?.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=80',
    videoUrl: videoUrl?.trim() || 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: duration || '10:00',
    channelId: channelId || 'channel01',
    channelName: channelName || 'Creator',
    uploader: uploader || 'Creator',
    avatarUrl: avatarUrl || '',
    views: 0,
    likes: 0,
    dislikes: 0,
    uploadDate: new Date().toISOString(),
    comments: []
  };

  db.videos.unshift(newVideo);

  // Link to channel
  if (channelId) {
    const channel = db.channels.find((c) => c.channelId === channelId);
    if (channel) {
      channel.videos = Array.isArray(channel.videos) ? [...channel.videos, videoId] : [videoId];
    }
  }

  saveDB();
  return res.status(201).json(newVideo);
});

// PUT /api/videos/:id - Update video
router.put('/:id', (req, res) => {
  const db = getDB();
  const index = db.videos.findIndex((v) => v.videoId === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Video not found' });
  }

  const updatedVideo = {
    ...db.videos[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  db.videos[index] = updatedVideo;
  saveDB();
  return res.json(updatedVideo);
});

// DELETE /api/videos/:id - Delete video
router.delete('/:id', (req, res) => {
  const db = getDB();
  const videoId = req.params.id;
  db.videos = db.videos.filter((v) => v.videoId !== videoId);

  // Remove from channels
  db.channels.forEach((ch) => {
    if (Array.isArray(ch.videos)) {
      ch.videos = ch.videos.filter((id) => id !== videoId);
    }
  });

  saveDB();
  return res.json({ success: true, message: 'Video deleted successfully' });
});

// POST /api/videos/:id/like - Toggle like
router.post('/:id/like', (req, res) => {
  const db = getDB();
  const video = db.videos.find((v) => v.videoId === req.params.id);
  if (!video) return res.status(404).json({ message: 'Video not found' });

  const currentStatus = db.interactions[req.params.id] || null;
  let newStatus = null;
  let likes = Number(video.likes) || 0;
  let dislikes = Number(video.dislikes) || 0;

  if (currentStatus === 'like') {
    likes = Math.max(0, likes - 1);
    newStatus = null;
  } else if (currentStatus === 'dislike') {
    dislikes = Math.max(0, dislikes - 1);
    likes += 1;
    newStatus = 'like';
  } else {
    likes += 1;
    newStatus = 'like';
  }

  video.likes = likes;
  video.dislikes = dislikes;

  if (newStatus) {
    db.interactions[req.params.id] = newStatus;
  } else {
    delete db.interactions[req.params.id];
  }

  saveDB();
  return res.json({ video, userStatus: newStatus });
});

// POST /api/videos/:id/dislike - Toggle dislike
router.post('/:id/dislike', (req, res) => {
  const db = getDB();
  const video = db.videos.find((v) => v.videoId === req.params.id);
  if (!video) return res.status(404).json({ message: 'Video not found' });

  const currentStatus = db.interactions[req.params.id] || null;
  let newStatus = null;
  let likes = Number(video.likes) || 0;
  let dislikes = Number(video.dislikes) || 0;

  if (currentStatus === 'dislike') {
    dislikes = Math.max(0, dislikes - 1);
    newStatus = null;
  } else if (currentStatus === 'like') {
    likes = Math.max(0, likes - 1);
    dislikes += 1;
    newStatus = 'dislike';
  } else {
    dislikes += 1;
    newStatus = 'dislike';
  }

  video.likes = likes;
  video.dislikes = dislikes;

  if (newStatus) {
    db.interactions[req.params.id] = newStatus;
  } else {
    delete db.interactions[req.params.id];
  }

  saveDB();
  return res.json({ video, userStatus: newStatus });
});

// POST /api/videos/:id/comments - Add comment
router.post('/:id/comments', optionalAuth, (req, res) => {
  const { text, user } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Comment text is required' });
  }

  const db = getDB();
  const video = db.videos.find((v) => v.videoId === req.params.id);
  if (!video) return res.status(404).json({ message: 'Video not found' });

  const authorUser = req.user || user;
  const newComment = {
    commentId: `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: authorUser?.userId || `guest_${Date.now()}`,
    author: authorUser?.username || 'You',
    avatarUrl: authorUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    text: text.trim(),
    timestamp: new Date().toISOString(),
    likes: 0
  };

  video.comments = [newComment, ...(video.comments || [])];
  saveDB();
  return res.status(201).json({ comment: newComment, video });
});

// PUT /api/videos/:id/comments/:commentId - Edit comment
router.put('/:id/comments/:commentId', (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Text is required' });
  }

  const db = getDB();
  const video = db.videos.find((v) => v.videoId === req.params.id);
  if (!video) return res.status(404).json({ message: 'Video not found' });

  const comment = (video.comments || []).find((c) => c.commentId === req.params.commentId);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });

  comment.text = text.trim();
  comment.isEdited = true;
  comment.editedAt = new Date().toISOString();

  saveDB();
  return res.json({ comment, video });
});

// DELETE /api/videos/:id/comments/:commentId - Delete comment
router.delete('/:id/comments/:commentId', (req, res) => {
  const db = getDB();
  const video = db.videos.find((v) => v.videoId === req.params.id);
  if (!video) return res.status(404).json({ message: 'Video not found' });

  video.comments = (video.comments || []).filter((c) => c.commentId !== req.params.commentId);
  saveDB();
  return res.json({ success: true, video });
});

export default router;
