import { allVideos } from '../data/sampleVideos';
import { getCurrentUser, updateUserStoredInteractions } from './auth';

const STORAGE_VIDEOS_KEY = 'yt_videos_database_v2';
const STORAGE_INTERACTIONS_KEY = 'yt_user_video_interactions';
const STORAGE_SUBSCRIPTIONS_KEY = 'yt_channel_subscriptions';
const STORAGE_GUEST_ID_KEY = 'yt_guest_client_id';

/**
 * Resolves an active user key (user ID or unique guest ID) so that
 * each user's likes/dislikes remain completely isolated.
 */
export function getActiveUserKey(userOrId = null) {
  if (typeof userOrId === 'string' && userOrId.trim()) {
    return userOrId.trim();
  }
  if (userOrId && typeof userOrId === 'object' && userOrId.userId) {
    return userOrId.userId;
  }
  const current = getCurrentUser();
  if (current?.userId) {
    return current.userId;
  }
  try {
    let guestId = localStorage.getItem(STORAGE_GUEST_ID_KEY);
    if (!guestId) {
      guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(STORAGE_GUEST_ID_KEY, guestId);
    }
    return guestId;
  } catch {
    return 'guest_user';
  }
}

// Helper to notify other components of database changes
function emitVideoUpdate(videoId) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yt-video-updated', { detail: { videoId } }));
  }
}

/**
 * Retrieve all videos from database (localStorage).
 * Seeds from sampleVideos if database is empty.
 */
export function getVideos() {
  try {
    const raw = localStorage.getItem(STORAGE_VIDEOS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_VIDEOS_KEY, JSON.stringify(allVideos));
      return allVideos;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_VIDEOS_KEY, JSON.stringify(allVideos));
      return allVideos;
    }

    // Prune removed moreVideos (e.g. video04-video16), keeping only core initialVideos and user uploads
    const validSeedIds = new Set(allVideos.map((v) => v.videoId));
    const prunedVideos = parsed.filter(
      (v) => validSeedIds.has(v.videoId) || (v.videoId && v.videoId.startsWith('video_'))
    );

    let cacheUpdated = prunedVideos.length !== parsed.length;

    // Keep cached seed videos aligned with the current known playable URLs.
    const freshUrlMap = new Map(allVideos.map((v) => [v.videoId, v.videoUrl]));
    const freshThumbnailMap = new Map(allVideos.map((v) => [v.videoId, v.thumbnailUrl]));
    const healedVideos = prunedVideos.map((v) => {
      let healedVideo = v;
      if (freshUrlMap.has(v.videoId) && v.videoUrl !== freshUrlMap.get(v.videoId)) {
        cacheUpdated = true;
        healedVideo = { ...healedVideo, videoUrl: freshUrlMap.get(v.videoId) };
      }
      if (freshThumbnailMap.has(v.videoId) && v.thumbnailUrl !== freshThumbnailMap.get(v.videoId)) {
        cacheUpdated = true;
        healedVideo = { ...healedVideo, thumbnailUrl: freshThumbnailMap.get(v.videoId) };
      }
      return healedVideo;
    });

    // Auto-sync video01 sample data if title is outdated
    const v1 = allVideos.find((v) => v.videoId === 'video01');
    const existingV1 = healedVideos.find((v) => v.videoId === 'video01');
    if (v1 && existingV1 && existingV1.title !== v1.title) {
      existingV1.title = v1.title;
      existingV1.thumbnailUrl = v1.thumbnailUrl;
      existingV1.description = v1.description;
      existingV1.uploader = v1.uploader;
      existingV1.views = v1.views;
      existingV1.likes = v1.likes;
      existingV1.dislikes = v1.dislikes;
      existingV1.comments = v1.comments;
      cacheUpdated = true;
    }

    if (cacheUpdated) {
      localStorage.setItem(STORAGE_VIDEOS_KEY, JSON.stringify(healedVideos));
      return healedVideos;
    }

    return parsed;
  } catch (err) {
    console.error('Error reading videos from storage:', err);
    return allVideos;
  }
}

/**
 * Save videos list to database
 */
export function saveVideos(videos) {
  try {
    localStorage.setItem(STORAGE_VIDEOS_KEY, JSON.stringify(videos));
  } catch (err) {
    console.error('Error saving videos to storage:', err);
  }
}

/**
 * Get a single video by ID
 */
export function getVideoById(videoId) {
  const videos = getVideos();
  return videos.find((v) => v.videoId === videoId) || null;
}

/**
 * Add a new comment to a video and persist in the database
 */
export function addComment(videoId, { text, user, commentId }) {
  if (!videoId || !text || !text.trim()) {
    throw new Error('Comment text cannot be empty.');
  }

  const videos = getVideos();
  const videoIndex = videos.findIndex((v) => v.videoId === videoId);

  if (videoIndex === -1) {
    throw new Error('Video not found.');
  }

  const newComment = {
    commentId: commentId || `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: user?.userId || `guest_${Date.now()}`,
    author: user?.username || 'You',
    avatarUrl: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    text: text.trim(),
    timestamp: new Date().toISOString(),
    likes: 0
  };

  const targetVideo = { ...videos[videoIndex] };
  const currentComments = Array.isArray(targetVideo.comments) ? [...targetVideo.comments] : [];
  targetVideo.comments = [newComment, ...currentComments];

  videos[videoIndex] = targetVideo;
  saveVideos(videos);
  emitVideoUpdate(videoId);

  return { comment: newComment, video: targetVideo };
}

/**
 * Edit an existing comment text and persist in the database
 */
export function editComment(videoId, commentId, newText) {
  if (!videoId || !commentId || !newText || !newText.trim()) {
    throw new Error('Valid comment text is required.');
  }

  const videos = getVideos();
  const videoIndex = videos.findIndex((v) => v.videoId === videoId);

  if (videoIndex === -1) {
    throw new Error('Video not found.');
  }

  const targetVideo = { ...videos[videoIndex] };
  const currentComments = Array.isArray(targetVideo.comments) ? [...targetVideo.comments] : [];

  const commentIndex = currentComments.findIndex((c) => c.commentId === commentId);
  if (commentIndex === -1) {
    throw new Error('Comment not found.');
  }

  currentComments[commentIndex] = {
    ...currentComments[commentIndex],
    text: newText.trim(),
    isEdited: true,
    editedAt: new Date().toISOString()
  };

  targetVideo.comments = currentComments;
  videos[videoIndex] = targetVideo;
  saveVideos(videos);
  emitVideoUpdate(videoId);

  return { video: targetVideo, comment: currentComments[commentIndex] };
}

/**
 * Delete a comment from a video and persist in the database
 */
export function deleteComment(videoId, commentId) {
  if (!videoId || !commentId) {
    throw new Error('Video ID and Comment ID are required.');
  }

  const videos = getVideos();
  const videoIndex = videos.findIndex((v) => v.videoId === videoId);

  if (videoIndex === -1) {
    throw new Error('Video not found.');
  }

  const targetVideo = { ...videos[videoIndex] };
  const currentComments = Array.isArray(targetVideo.comments) ? [...targetVideo.comments] : [];

  targetVideo.comments = currentComments.filter((c) => c.commentId !== commentId);

  videos[videoIndex] = targetVideo;
  saveVideos(videos);
  emitVideoUpdate(videoId);

  return { video: targetVideo };
}

/**
 * User interactions (like/dislike) storage helpers
 */
export function getInteractionsMap() {
  try {
    const raw = localStorage.getItem(STORAGE_INTERACTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveInteractionsMap(map) {
  try {
    localStorage.setItem(STORAGE_INTERACTIONS_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('Error saving interactions:', err);
  }
}

export function getUserVideoInteraction(videoId, userOrId = null) {
  if (!videoId) return null;
  const userKey = getActiveUserKey(userOrId);
  const scopedKey = `${userKey}_${videoId}`;
  const map = getInteractionsMap();

  if (map[scopedKey] !== undefined) {
    return map[scopedKey];
  }

  // Also check if user document in localStorage has this video in liked/disliked lists
  if (!userKey.startsWith('guest_')) {
    try {
      const rawUsers = localStorage.getItem('yt_registered_users');
      if (rawUsers) {
        const users = JSON.parse(rawUsers);
        const user = users.find((u) => u.userId === userKey);
        if (user) {
          if (Array.isArray(user.likedVideos) && user.likedVideos.includes(videoId)) {
            return 'like';
          }
          if (Array.isArray(user.dislikedVideos) && user.dislikedVideos.includes(videoId)) {
            return 'dislike';
          }
        }
      }
    } catch {
      // Ignore malformed stored user data.
    }
  }

  return null;
}

/**
 * Explicitly sets or cleans a user's interaction in local storage.
 */
export function setUserVideoInteraction(videoId, userOrId, status) {
  if (!videoId) return;
  const userKey = getActiveUserKey(userOrId);
  const scopedKey = `${userKey}_${videoId}`;
  const interactions = getInteractionsMap();

  if (status) {
    interactions[scopedKey] = status;
  } else {
    delete interactions[scopedKey];
  }
  delete interactions[videoId]; // Clean legacy unscoped key

  saveInteractionsMap(interactions);
  updateUserStoredInteractions(userKey, videoId, status);
}

/**
 * Helper: Computes updated reaction counts and state following YouTube's interaction model.
 */
function computeUpdatedReactions(currentLikes, currentDislikes, currentStatus, action) {
  let likes = Math.max(0, Number(currentLikes) || 0);
  let dislikes = Math.max(0, Number(currentDislikes) || 0);
  let newStatus = null;

  if (action === 'like') {
    if (currentStatus === 'like') {
      // Toggle off active like
      likes = Math.max(0, likes - 1);
      newStatus = null;
    } else if (currentStatus === 'dislike') {
      // Switch from dislike to like
      dislikes = Math.max(0, dislikes - 1);
      likes += 1;
      newStatus = 'like';
    } else {
      // New like from neutral
      likes += 1;
      newStatus = 'like';
    }
  } else if (action === 'dislike') {
    if (currentStatus === 'dislike') {
      // Toggle off active dislike
      dislikes = Math.max(0, dislikes - 1);
      newStatus = null;
    } else if (currentStatus === 'like') {
      // Switch from like to dislike
      likes = Math.max(0, likes - 1);
      dislikes += 1;
      newStatus = 'dislike';
    } else {
      // New dislike from neutral
      dislikes += 1;
      newStatus = 'dislike';
    }
  }

  return { likes, dislikes, newStatus };
}

/**
 * Toggle like for a video and update counts in local database for the active user.
 */
export function toggleVideoLike(videoId, userOrId = null) {
  const videos = getVideos();
  const videoIndex = videos.findIndex((v) => v.videoId === videoId);
  if (videoIndex === -1) return null;

  const targetVideo = { ...videos[videoIndex] };
  const userKey = getActiveUserKey(userOrId);
  const scopedKey = `${userKey}_${videoId}`;
  const interactions = getInteractionsMap();
  const currentStatus = getUserVideoInteraction(videoId, userKey);

  const { likes, dislikes, newStatus } = computeUpdatedReactions(
    targetVideo.likes,
    targetVideo.dislikes,
    currentStatus,
    'like'
  );

  targetVideo.likes = likes;
  targetVideo.dislikes = dislikes;
  videos[videoIndex] = targetVideo;

  if (newStatus) {
    interactions[scopedKey] = newStatus;
  } else {
    delete interactions[scopedKey];
  }
  delete interactions[videoId]; // Clean legacy unscoped key

  updateUserStoredInteractions(userKey, videoId, newStatus);
  saveVideos(videos);
  saveInteractionsMap(interactions);
  emitVideoUpdate(videoId);

  return { video: targetVideo, userStatus: newStatus };
}

/**
 * Toggle dislike for a video and update counts in local database for the active user.
 */
export function toggleVideoDislike(videoId, userOrId = null) {
  const videos = getVideos();
  const videoIndex = videos.findIndex((v) => v.videoId === videoId);
  if (videoIndex === -1) return null;

  const targetVideo = { ...videos[videoIndex] };
  const userKey = getActiveUserKey(userOrId);
  const scopedKey = `${userKey}_${videoId}`;
  const interactions = getInteractionsMap();
  const currentStatus = getUserVideoInteraction(videoId, userKey);

  const { likes, dislikes, newStatus } = computeUpdatedReactions(
    targetVideo.likes,
    targetVideo.dislikes,
    currentStatus,
    'dislike'
  );

  targetVideo.likes = likes;
  targetVideo.dislikes = dislikes;
  videos[videoIndex] = targetVideo;

  if (newStatus) {
    interactions[scopedKey] = newStatus;
  } else {
    delete interactions[scopedKey];
  }
  delete interactions[videoId]; // Clean legacy unscoped key

  updateUserStoredInteractions(userKey, videoId, newStatus);
  saveVideos(videos);
  saveInteractionsMap(interactions);
  emitVideoUpdate(videoId);

  return { video: targetVideo, userStatus: newStatus };
}

/**
 * Subscriptions storage helpers
 */
export function getChannelSubscription(channelId) {
  try {
    const raw = localStorage.getItem(STORAGE_SUBSCRIPTIONS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return Boolean(map[channelId]);
  } catch {
    return false;
  }
}

/**
 * Toggles subscription status and updates channel subscriber count accordingly.
 */
export function toggleChannelSubscription(channelId) {
  try {
    const raw = localStorage.getItem(STORAGE_SUBSCRIPTIONS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const newState = !map[channelId];

    if (newState) {
      map[channelId] = true;
    } else {
      delete map[channelId];
    }
    localStorage.setItem(STORAGE_SUBSCRIPTIONS_KEY, JSON.stringify(map));

    // Also update subscriber counter in the local channels cache
    try {
      const rawChannels = localStorage.getItem('yt_channels_database_v2');
      if (rawChannels) {
        const channels = JSON.parse(rawChannels);
        const channel = channels.find((c) => c.channelId === channelId);
        if (channel) {
          channel.subscribers = Math.max(0, (channel.subscribers || 0) + (newState ? 1 : -1));
          localStorage.setItem('yt_channels_database_v2', JSON.stringify(channels));
        }
      }
    } catch (chanErr) {
      console.error('Failed to update subscriber count in channel:', chanErr);
    }

    return newState;
  } catch {
    return false;
  }
}

/**
 * Update video details (Title, Description, Category, Thumbnail, etc.)
 */
export function updateVideo(videoId, updatedFields) {
  if (!videoId) throw new Error('Video ID is required.');
  const videos = getVideos();
  const index = videos.findIndex((v) => v.videoId === videoId);

  if (index === -1) {
    throw new Error('Video not found.');
  }

  const updatedVideo = {
    ...videos[index],
    ...updatedFields,
    updatedAt: new Date().toISOString()
  };

  videos[index] = updatedVideo;
  saveVideos(videos);
  emitVideoUpdate(videoId);

  return updatedVideo;
}

/**
 * Delete a video from the database and remove it from its channel
 */
export function deleteVideo(videoId) {
  if (!videoId) throw new Error('Video ID is required.');
  const videos = getVideos();
  const filtered = videos.filter((v) => v.videoId !== videoId);

  saveVideos(filtered);

  // Also remove from channels database
  try {
    const rawChannels = localStorage.getItem('yt_channels_database_v2');
    if (rawChannels) {
      const channels = JSON.parse(rawChannels);
      let changed = false;
      channels.forEach((ch) => {
        if (Array.isArray(ch.videos) && ch.videos.includes(videoId)) {
          ch.videos = ch.videos.filter((id) => id !== videoId);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('yt_channels_database_v2', JSON.stringify(channels));
      }
    }
  } catch (err) {
    console.error('Failed to remove video from channel:', err);
  }

  emitVideoUpdate(videoId);
  return true;
}

/**
 * Add a new video (Upload simulation) to a channel
 */
export function addVideo(videoData) {
  if (!videoData || !videoData.title || !videoData.title.trim()) {
    throw new Error('Video title is required.');
  }

  const videos = getVideos();
  const videoId = videoData.videoId || `video_${Date.now()}`;

  const newVideo = {
    videoId,
    title: videoData.title.trim(),
    description: videoData.description?.trim() || '',
    thumbnailUrl:
      videoData.thumbnailUrl?.trim() ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=80',
    videoUrl:
      videoData.videoUrl?.trim() ||
      'https://www.w3schools.com/html/mov_bbb.mp4',
    category: videoData.category || 'General',
    duration: videoData.duration || '10:00',
    channelId: videoData.channelId || 'channel01',
    channelName: videoData.channelName || 'YouTube Creator',
    uploader: videoData.uploader || 'Creator',
    avatarUrl: videoData.avatarUrl || '',
    views: 0,
    likes: 0,
    dislikes: 0,
    uploadDate: new Date().toISOString(),
    comments: []
  };

  videos.unshift(newVideo);
  saveVideos(videos);

  // Link to channel
  if (videoData.channelId) {
    try {
      const rawChannels = localStorage.getItem('yt_channels_database_v2');
      if (rawChannels) {
        const channels = JSON.parse(rawChannels);
        const ch = channels.find((c) => c.channelId === videoData.channelId);
        if (ch) {
          ch.videos = Array.isArray(ch.videos) ? [...ch.videos, videoId] : [videoId];
          localStorage.setItem('yt_channels_database_v2', JSON.stringify(channels));
        }
      }
    } catch (err) {
      console.error('Failed to add video ID to channel:', err);
    }
  }

  emitVideoUpdate(videoId);
  return newVideo;
}
