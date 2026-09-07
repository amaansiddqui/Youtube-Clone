import express from 'express';
import mongoose from 'mongoose';
import Video from '../models/Video.js';
import Channel from '../models/Channel.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { getDB, saveDB } from '../data/db.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Checks whether MongoDB is active and connected.
 * Returns true if ready, false to use the JSON file fallback.
 */
function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Helper: Escapes special regex characters in user search input.
 * Prevents regex injection and crashes when searching for characters like '(', '[', '*', etc.
 */
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Helper: Computes the updated like and dislike numbers along with user reaction status.
 * Replicates YouTube's reaction behavior:
 * - Clicking 'like' when already liked removes the like (returns neutral).
 * - Clicking 'like' when disliked removes dislike and adds like.
 * - Clicking 'like' when neutral adds like.
 * - Same symmetric behavior applies for 'dislike'.
 */
function computeUpdatedReactions(currentLikes, currentDislikes, currentStatus, action) {
  let likes = Math.max(0, Number(currentLikes) || 0);
  let dislikes = Math.max(0, Number(currentDislikes) || 0);
  let newStatus = null;

  if (action === 'like') {
    if (currentStatus === 'like') {
      // User toggled off their like
      likes = Math.max(0, likes - 1);
      newStatus = null;
    } else if (currentStatus === 'dislike') {
      // User changed their mind: from dislike to like
      dislikes = Math.max(0, dislikes - 1);
      likes += 1;
      newStatus = 'like';
    } else {
      // User had no prior reaction
      likes += 1;
      newStatus = 'like';
    }
  } else if (action === 'dislike') {
    if (currentStatus === 'dislike') {
      // User toggled off their dislike
      dislikes = Math.max(0, dislikes - 1);
      newStatus = null;
    } else if (currentStatus === 'like') {
      // User changed their mind: from like to dislike
      likes = Math.max(0, likes - 1);
      dislikes += 1;
      newStatus = 'dislike';
    } else {
      // User had no prior reaction
      dislikes += 1;
      newStatus = 'dislike';
    }
  }

  return { likes, dislikes, newStatus };
}

/**
 * GET /api/videos
 * Returns a list of videos with optional filtering by search query `q` and category `category`.
 */
router.get('/', async (req, res) => {
  try {
    const { q, category } = req.query;

    // 1. Query MongoDB if connected
    if (isMongoConnected()) {
      const filter = {};

      // Filter by category if specified (e.g. 'Music', 'Gaming', 'React')
      if (category && category !== 'All') {
        filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
      }

      // Filter by search keywords in title, channel name, or description
      if (q && q.trim()) {
        const safeQuery = escapeRegex(q.trim());
        const searchRegex = new RegExp(safeQuery, 'i');
        filter.$or = [
          { title: searchRegex },
          { channelName: searchRegex },
          { description: searchRegex }
        ];
      }

      const videos = await Video.find(filter).sort({ uploadDate: -1 });
      return res.json(videos);
    }

    // 2. Fallback to in-memory / JSON database
    const db = getDB();
    let list = [...db.videos];

    if (category && category !== 'All') {
      const catLower = category.toLowerCase();
      list = list.filter((v) => v.category && v.category.toLowerCase() === catLower);
    }

    if (q && q.trim()) {
      const searchLower = q.trim().toLowerCase();
      list = list.filter(
        (v) =>
          (v.title && v.title.toLowerCase().includes(searchLower)) ||
          (v.channelName && v.channelName.toLowerCase().includes(searchLower)) ||
          (v.description && v.description.toLowerCase().includes(searchLower))
      );
    }

    return res.json(list);
  } catch (err) {
    console.error('Fetch videos error:', err);
    return res.status(500).json({ message: 'Internal server error fetching videos.' });
  }
});

/**
 * GET /api/videos/:id
 * Fetches the full metadata and details for a single video by its videoId.
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (isMongoConnected()) {
      const video = await Video.findOne({ videoId: id });
      if (!video) {
        return res.status(404).json({ message: 'Video not found.' });
      }
      return res.json(video);
    }

    const db = getDB();
    const video = db.videos.find((v) => v.videoId === id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }
    return res.json(video);
  } catch (err) {
    console.error('Fetch video error:', err);
    return res.status(500).json({ message: 'Internal server error fetching video.' });
  }
});

/**
 * POST /api/videos
 * Publishes a new video with associated file metadata (resolution, format, duration).
 * Also associates the video ID with the creator's channel.
 */
router.post('/', async (req, res) => {
  const {
    title,
    description,
    category,
    thumbnailUrl,
    videoUrl,
    duration,
    channelId,
    channelName,
    uploader,
    avatarUrl
  } = req.body;

  // Validate title
  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Video title is required.' });
  }

  const videoId = req.body.videoId || `video_${Date.now()}`;
  const videoData = {
    videoId,
    title: title.trim(),
    description: description?.trim() || '',
    category: category || 'General',
    thumbnailUrl: thumbnailUrl?.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=80',
    videoUrl: videoUrl?.trim() || 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: duration || '10:00',
    fileMetadata: {
      format: 'mp4',
      size: 10485760, // Represents a 10MB file
      mimeType: 'video/mp4',
      resolution: '1080p'
    },
    channelId: channelId || 'channel01',
    channelName: channelName || 'Creator',
    uploader: uploader || 'Creator',
    avatarUrl: avatarUrl || '',
    views: Number(req.body.views) || 0,
    likes: Number(req.body.likes) || 0,
    dislikes: Number(req.body.dislikes) || 0,
    uploadDate: new Date(),
    comments: []
  };

  try {
    if (isMongoConnected()) {
      const newVideo = new Video(videoData);
      await newVideo.save();

      // Append videoId to the channel's video list in MongoDB
      if (channelId) {
        await Channel.findOneAndUpdate(
          { channelId },
          { $addToSet: { videos: videoId } }
        );
      }

      // Also keep JSON DB in sync
      const db = getDB();
      const existingIdx = db.videos.findIndex((v) => v.videoId === videoId);
      if (existingIdx === -1) {
        db.videos.unshift(videoData);
      }
      if (channelId) {
        const channel = db.channels.find((c) => c.channelId === channelId);
        if (channel) {
          channel.videos = Array.isArray(channel.videos) ? [...new Set([...channel.videos, videoId])] : [videoId];
        }
      }
      saveDB();

      return res.status(201).json(newVideo);
    }

    const db = getDB();
    db.videos.unshift(videoData);

    // Update channel's video list in JSON DB
    if (channelId) {
      const channel = db.channels.find((c) => c.channelId === channelId);
      if (channel) {
        channel.videos = Array.isArray(channel.videos) ? [...channel.videos, videoId] : [videoId];
      }
    }

    saveDB();
    return res.status(201).json(videoData);
  } catch (err) {
    console.error('Create video error:', err);
    return res.status(500).json({ message: 'Internal server error creating video.' });
  }
});

/**
 * PUT /api/videos/:id
 * Updates editable video details (title, description, category, thumbnail, etc.).
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    let updated = null;

    if (isMongoConnected()) {
      updated = await Video.findOneAndUpdate(
        { videoId: id },
        { $set: req.body },
        { returnDocument: 'after' }
      );
    }

    const db = getDB();
    const index = db.videos.findIndex((v) => v.videoId === id);
    if (index !== -1) {
      db.videos[index] = {
        ...db.videos[index],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      saveDB();
      if (!updated) {
        updated = db.videos[index];
      }
    }

    if (!updated) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    return res.json(updated);
  } catch (err) {
    console.error('Update video error:', err);
    return res.status(500).json({ message: 'Internal server error updating video.' });
  }
});

/**
 * DELETE /api/videos/:id
 * Deletes a video and cascades cleanup:
 * 1. Removes the video document
 * 2. Removes the video ID reference from channels
 * 3. Removes all comments associated with the video
 */
router.delete('/:id', async (req, res) => {
  const videoId = req.params.id;

  try {
    if (isMongoConnected()) {
      const deleted = await Video.findOneAndDelete({ videoId });
      if (!deleted) {
        return res.status(404).json({ message: 'Video not found.' });
      }

      // Cascade remove video reference from all channels
      await Channel.updateMany(
        { videos: videoId },
        { $pull: { videos: videoId } }
      );

      // Cascade delete all comments belonging to this video
      await Comment.deleteMany({ videoId });

      // Keep JSON DB in sync
      const db = getDB();
      db.videos = db.videos.filter((v) => v.videoId !== videoId);
      db.channels.forEach((ch) => {
        if (Array.isArray(ch.videos)) {
          ch.videos = ch.videos.filter((id) => id !== videoId);
        }
      });
      saveDB();

      return res.json({ success: true, message: 'Video and associated data deleted successfully.' });
    }

    const db = getDB();
    db.videos = db.videos.filter((v) => v.videoId !== videoId);

    // Remove video reference from channels
    db.channels.forEach((ch) => {
      if (Array.isArray(ch.videos)) {
        ch.videos = ch.videos.filter((id) => id !== videoId);
      }
    });

    saveDB();
    return res.json({ success: true, message: 'Video deleted successfully.' });
  } catch (err) {
    console.error('Delete video error:', err);
    return res.status(500).json({ message: 'Internal server error deleting video.' });
  }
});

/**
 * POST /api/videos/:id/like
 * Toggles the 'like' state for a video and synchronizes engagement metrics in MongoDB.
 */
router.post('/:id/like', optionalAuth, async (req, res) => {
  const videoId = req.params.id;
  const userId = req.user?.userId || req.body.userId || req.body.user?.userId || null;
  const clientStatus = req.body.currentStatus;

  try {
    const db = getDB();
    let currentStatus = null;

    if (clientStatus !== undefined && clientStatus !== null) {
      currentStatus = clientStatus;
    } else if (userId && isMongoConnected()) {
      const user = await User.findOne({ userId });
      if (user) {
        if (Array.isArray(user.likedVideos) && user.likedVideos.includes(videoId)) {
          currentStatus = 'like';
        } else if (Array.isArray(user.dislikedVideos) && user.dislikedVideos.includes(videoId)) {
          currentStatus = 'dislike';
        }
      }
    }

    if (!currentStatus) {
      const interactionKey = userId ? `${userId}_${videoId}` : videoId;
      currentStatus = db.interactions[interactionKey] || db.interactions[videoId] || null;
    }

    if (isMongoConnected()) {
      let video = await Video.findOne({ videoId });
      if (!video) {
        // Fallback to local video if exists
        const localVid = db.videos.find((v) => v.videoId === videoId);
        if (localVid) {
          video = new Video(localVid);
          await video.save();
        } else {
          return res.status(404).json({ message: 'Video not found.' });
        }
      }

      const { likes, dislikes, newStatus } = computeUpdatedReactions(
        video.likes,
        video.dislikes,
        currentStatus,
        'like'
      );

      video.likes = likes;
      video.dislikes = dislikes;
      await video.save();

      // Persist in User's liked/disliked lists in MongoDB
      if (userId) {
        if (newStatus === 'like') {
          await User.findOneAndUpdate(
            { userId },
            { $addToSet: { likedVideos: videoId }, $pull: { dislikedVideos: videoId } }
          );
        } else if (newStatus === 'dislike') {
          await User.findOneAndUpdate(
            { userId },
            { $addToSet: { dislikedVideos: videoId }, $pull: { likedVideos: videoId } }
          );
        } else {
          await User.findOneAndUpdate(
            { userId },
            { $pull: { likedVideos: videoId, dislikedVideos: videoId } }
          );
        }
      }

      // Update local db interactions and videos
      const interactionKey = userId ? `${userId}_${videoId}` : videoId;
      if (newStatus) {
        db.interactions[interactionKey] = newStatus;
        db.interactions[videoId] = newStatus;
      } else {
        delete db.interactions[interactionKey];
        delete db.interactions[videoId];
      }

      const dbVid = db.videos.find((v) => v.videoId === videoId);
      if (dbVid) {
        dbVid.likes = likes;
        dbVid.dislikes = dislikes;
      }
      saveDB();

      return res.json({ video, userStatus: newStatus });
    }

    const video = db.videos.find((v) => v.videoId === videoId);
    if (!video) return res.status(404).json({ message: 'Video not found.' });

    const { likes, dislikes, newStatus } = computeUpdatedReactions(
      video.likes,
      video.dislikes,
      currentStatus,
      'like'
    );

    video.likes = likes;
    video.dislikes = dislikes;

    const interactionKey = userId ? `${userId}_${videoId}` : videoId;
    if (newStatus) {
      db.interactions[interactionKey] = newStatus;
      db.interactions[videoId] = newStatus;
    } else {
      delete db.interactions[interactionKey];
      delete db.interactions[videoId];
    }

    saveDB();
    return res.json({ video, userStatus: newStatus });
  } catch (err) {
    console.error('Like video error:', err);
    return res.status(500).json({ message: 'Internal server error liking video.' });
  }
});

/**
 * POST /api/videos/:id/dislike
 * Toggles the 'dislike' state for a video and synchronizes engagement metrics in MongoDB.
 */
router.post('/:id/dislike', optionalAuth, async (req, res) => {
  const videoId = req.params.id;
  const userId = req.user?.userId || req.body.userId || req.body.user?.userId || null;
  const clientStatus = req.body.currentStatus;

  try {
    const db = getDB();
    let currentStatus = null;

    if (clientStatus !== undefined && clientStatus !== null) {
      currentStatus = clientStatus;
    } else if (userId && isMongoConnected()) {
      const user = await User.findOne({ userId });
      if (user) {
        if (Array.isArray(user.likedVideos) && user.likedVideos.includes(videoId)) {
          currentStatus = 'like';
        } else if (Array.isArray(user.dislikedVideos) && user.dislikedVideos.includes(videoId)) {
          currentStatus = 'dislike';
        }
      }
    }

    if (!currentStatus) {
      const interactionKey = userId ? `${userId}_${videoId}` : videoId;
      currentStatus = db.interactions[interactionKey] || db.interactions[videoId] || null;
    }

    if (isMongoConnected()) {
      let video = await Video.findOne({ videoId });
      if (!video) {
        const localVid = db.videos.find((v) => v.videoId === videoId);
        if (localVid) {
          video = new Video(localVid);
          await video.save();
        } else {
          return res.status(404).json({ message: 'Video not found.' });
        }
      }

      const { likes, dislikes, newStatus } = computeUpdatedReactions(
        video.likes,
        video.dislikes,
        currentStatus,
        'dislike'
      );

      video.likes = likes;
      video.dislikes = dislikes;
      await video.save();

      // Persist in User's liked/disliked lists in MongoDB
      if (userId) {
        if (newStatus === 'like') {
          await User.findOneAndUpdate(
            { userId },
            { $addToSet: { likedVideos: videoId }, $pull: { dislikedVideos: videoId } }
          );
        } else if (newStatus === 'dislike') {
          await User.findOneAndUpdate(
            { userId },
            { $addToSet: { dislikedVideos: videoId }, $pull: { likedVideos: videoId } }
          );
        } else {
          await User.findOneAndUpdate(
            { userId },
            { $pull: { likedVideos: videoId, dislikedVideos: videoId } }
          );
        }
      }

      const interactionKey = userId ? `${userId}_${videoId}` : videoId;
      if (newStatus) {
        db.interactions[interactionKey] = newStatus;
        db.interactions[videoId] = newStatus;
      } else {
        delete db.interactions[interactionKey];
        delete db.interactions[videoId];
      }

      const dbVid = db.videos.find((v) => v.videoId === videoId);
      if (dbVid) {
        dbVid.likes = likes;
        dbVid.dislikes = dislikes;
      }
      saveDB();

      return res.json({ video, userStatus: newStatus });
    }

    const video = db.videos.find((v) => v.videoId === videoId);
    if (!video) return res.status(404).json({ message: 'Video not found.' });

    const { likes, dislikes, newStatus } = computeUpdatedReactions(
      video.likes,
      video.dislikes,
      currentStatus,
      'dislike'
    );

    video.likes = likes;
    video.dislikes = dislikes;

    const interactionKey = userId ? `${userId}_${videoId}` : videoId;
    if (newStatus) {
      db.interactions[interactionKey] = newStatus;
      db.interactions[videoId] = newStatus;
    } else {
      delete db.interactions[interactionKey];
      delete db.interactions[videoId];
    }

    saveDB();
    return res.json({ video, userStatus: newStatus });
  } catch (err) {
    console.error('Dislike video error:', err);
    return res.status(500).json({ message: 'Internal server error disliking video.' });
  }
});

/**
 * GET /api/videos/:id/comments
 * Fetches all comments posted under a video, sorted newest first.
 */
router.get('/:id/comments', async (req, res) => {
  const videoId = req.params.id;

  try {
    if (isMongoConnected()) {
      // First check the dedicated Comment collection
      const comments = await Comment.find({ videoId }).sort({ createdAt: -1 });
      if (comments.length > 0) {
        return res.json(comments);
      }
      // If collection didn't have entries, fallback to video embedded comments
      const video = await Video.findOne({ videoId });
      return res.json(video?.comments || []);
    }

    const db = getDB();
    const video = db.videos.find((v) => v.videoId === videoId);
    if (!video) return res.status(404).json({ message: 'Video not found.' });
    return res.json(video.comments || []);
  } catch (err) {
    console.error('Fetch comments error:', err);
    return res.status(500).json({ message: 'Internal server error fetching comments.' });
  }
});

/**
 * POST /api/videos/:id/comments
 * Adds a new comment to a video. Supports authenticated users and guests.
 */
router.post('/:id/comments', optionalAuth, async (req, res) => {
  const { text, user } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Comment text cannot be empty.' });
  }

  const videoId = req.params.id;
  const authorUser = req.user || user;
  const commentId = req.body.commentId || `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newCommentData = {
    commentId,
    videoId,
    userId: authorUser?.userId || `guest_${Date.now()}`,
    author: authorUser?.username || 'You',
    avatarUrl: authorUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    text: text.trim(),
    timestamp: new Date(),
    likes: 0
  };

  try {
    if (isMongoConnected()) {
      // 1. Save to standalone Comment collection
      const commentDoc = new Comment(newCommentData);
      await commentDoc.save();

      // 2. Also prepend to the video's embedded comments array for atomic access
      const video = await Video.findOneAndUpdate(
        { videoId },
        { $push: { comments: { $each: [newCommentData], $position: 0 } } },
        { returnDocument: 'after' }
      );

      // Keep JSON DB in sync
      const db = getDB();
      const localVid = db.videos.find((v) => v.videoId === videoId);
      if (localVid) {
        localVid.comments = [newCommentData, ...(localVid.comments || []).filter((c) => c.commentId !== commentId)];
        saveDB();
      }

      if (!video) return res.status(404).json({ message: 'Video not found.' });

      return res.status(201).json({ comment: newCommentData, video });
    }

    const db = getDB();
    const video = db.videos.find((v) => v.videoId === videoId);
    if (!video) return res.status(404).json({ message: 'Video not found.' });

    video.comments = [newCommentData, ...(video.comments || [])];
    saveDB();
    return res.status(201).json({ comment: newCommentData, video });
  } catch (err) {
    console.error('Add comment error:', err);
    return res.status(500).json({ message: 'Internal server error adding comment.' });
  }
});

/**
 * PUT /api/videos/:id/comments/:commentId
 * Edits the text of an existing comment and flags it as edited.
 */
router.put('/:id/comments/:commentId', async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Comment text cannot be empty.' });
  }

  const { id: videoId, commentId } = req.params;

  try {
    if (isMongoConnected()) {
      // Update in Comment collection
      await Comment.findOneAndUpdate(
        { commentId },
        { $set: { text: text.trim(), isEdited: true, editedAt: new Date() } }
      );

      // Update in Video's embedded comments array
      const video = await Video.findOneAndUpdate(
        { videoId, 'comments.commentId': commentId },
        { $set: { 'comments.$.text': text.trim(), 'comments.$.isEdited': true, 'comments.$.editedAt': new Date() } },
        { returnDocument: 'after' }
      );

      const target = (video?.comments || []).find((item) => item.commentId === commentId);

      // Keep JSON DB in sync
      const db = getDB();
      const localVid = db.videos.find((v) => v.videoId === videoId);
      if (localVid && localVid.comments) {
        const c = localVid.comments.find((item) => item.commentId === commentId);
        if (c) {
          c.text = text.trim();
          c.isEdited = true;
          c.editedAt = new Date().toISOString();
          saveDB();
        }
      }

      return res.json({ comment: target, video });
    }

    const db = getDB();
    const video = db.videos.find((v) => v.videoId === videoId);
    if (!video) return res.status(404).json({ message: 'Video not found.' });

    const comment = (video.comments || []).find((c) => c.commentId === commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    comment.text = text.trim();
    comment.isEdited = true;
    comment.editedAt = new Date().toISOString();

    saveDB();
    return res.json({ comment, video });
  } catch (err) {
    console.error('Edit comment error:', err);
    return res.status(500).json({ message: 'Internal server error editing comment.' });
  }
});

/**
 * DELETE /api/videos/:id/comments/:commentId
 * Permanently removes a comment from MongoDB Comment collection, Video embedded array, and JSON DB.
 */
router.delete('/:id/comments/:commentId', async (req, res) => {
  const { id: videoId, commentId } = req.params;

  try {
    if (isMongoConnected()) {
      // Delete from Comment collection
      await Comment.findOneAndDelete({ commentId });

      // Pull from Video's embedded comments array
      const video = await Video.findOneAndUpdate(
        { videoId },
        { $pull: { comments: { commentId } } },
        { returnDocument: 'after' }
      );

      // Keep JSON DB in sync
      const db = getDB();
      const localVid = db.videos.find((v) => v.videoId === videoId);
      if (localVid && localVid.comments) {
        localVid.comments = localVid.comments.filter((c) => c.commentId !== commentId);
        saveDB();
      }

      if (!video) return res.status(404).json({ message: 'Video not found.' });

      return res.json({ success: true, video });
    }

    const db = getDB();
    const video = db.videos.find((v) => v.videoId === videoId);
    if (!video) return res.status(404).json({ message: 'Video not found.' });

    video.comments = (video.comments || []).filter((c) => c.commentId !== commentId);
    saveDB();
    return res.json({ success: true, video });
  } catch (err) {
    console.error('Delete comment error:', err);
    return res.status(500).json({ message: 'Internal server error deleting comment.' });
  }
});

export default router;
