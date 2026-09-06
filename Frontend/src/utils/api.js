/**
 * Unified API Client for YouTube Clone
 *
 * Implements a dual-mode strategy:
 * 1. Primary: Communicates with the Express/MongoDB REST backend on http://127.0.0.1:5000/api
 * 2. Fallback: If the backend is offline or network fails, automatically falls back
 *    to localStorage services (videoService, channelService, auth).
 *
 * This guarantees the application remains fully interactive in any development or offline environment.
 */

import {
  getVideos as getLocalVideos,
  getVideoById as getLocalVideoById,
  addComment as addLocalComment,
  editComment as editLocalComment,
  deleteComment as deleteLocalComment,
  toggleVideoLike as toggleLocalVideoLike,
  toggleVideoDislike as toggleLocalVideoDislike,
  updateVideo as updateLocalVideo,
  deleteVideo as deleteLocalVideo,
  addVideo as addLocalVideo,
  getChannelSubscription as getLocalChannelSubscription,
  toggleChannelSubscription as toggleLocalChannelSubscription
} from './videoService';

import {
  getChannels as getLocalChannels,
  getChannelById as getLocalChannelById,
  createChannel as createLocalChannel,
  updateChannel as updateLocalChannel,
  getChannelVideos as getLocalChannelVideos
} from './channelService';

import {
  getCurrentUser as getLocalCurrentUser,
  loginUser as loginLocalUser,
  registerUser as registerLocalUser,
  logoutUser as logoutLocalUser
} from './auth';

// Backend API Base URL
const API_BASE = 'http://127.0.0.1:5000/api';

/**
 * Reads the active JWT auth token from localStorage and returns
 * the Authorization header object if present.
 */
function getAuthHeader() {
  const token = localStorage.getItem('yt_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Generic fetch wrapper with JSON body parsing and error handling.
 * Throws an error on non-2xx responses so callers can trigger their local fallback.
 */
async function tryFetch(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers || {})
    }
  });

  if (res.ok) {
    return await res.json();
  }

  const err = await res.json().catch(() => ({ message: 'Request failed' }));
  throw new Error(err.message || 'Request failed');
}

// ----------------- Authentication API -----------------
export const authAPI = {
  /**
   * Logs in with username/email and password.
   * Saves the received token upon success.
   */
  login: async (credentials) => {
    try {
      const data = await tryFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      if (data.token) {
        localStorage.setItem('yt_auth_token', data.token);
      }
      return data;
    } catch {
      return loginLocalUser(credentials);
    }
  },

  /**
   * Registers a new account.
   * Saves the received token upon success.
   */
  register: async (userData) => {
    try {
      const data = await tryFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      if (data.token) {
        localStorage.setItem('yt_auth_token', data.token);
      }
      return data;
    } catch {
      return registerLocalUser(userData);
    }
  },

  /**
   * Returns the current authenticated user payload.
   */
  getCurrentUser: () => {
    return getLocalCurrentUser();
  },

  /**
   * Clears the user's session token.
   */
  logout: () => {
    logoutLocalUser();
  }
};

// ----------------- Videos API -----------------
export const videoAPI = {
  /**
   * Fetches the video feed.
   */
  getVideos: async () => {
    try {
      const data = await tryFetch('/videos');
      return data.videos || data;
    } catch {
      return getLocalVideos();
    }
  },

  /**
   * Fetches a single video by ID.
   */
  getVideoById: async (id) => {
    try {
      const data = await tryFetch(`/videos/${id}`);
      return data.video || data;
    } catch {
      return getLocalVideoById(id);
    }
  },

  /**
   * Publishes a new video with metadata.
   */
  addVideo: async (videoData) => {
    try {
      const data = await tryFetch('/videos', {
        method: 'POST',
        body: JSON.stringify(videoData)
      });
      return data.video || data;
    } catch {
      return addLocalVideo(videoData);
    }
  },

  /**
   * Updates an existing video's details.
   */
  updateVideo: async (id, fields) => {
    try {
      const data = await tryFetch(`/videos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(fields)
      });
      return data.video || data;
    } catch {
      return updateLocalVideo(id, fields);
    }
  },

  /**
   * Deletes a video.
   */
  deleteVideo: async (id) => {
    try {
      await tryFetch(`/videos/${id}`, { method: 'DELETE' });
      return true;
    } catch {
      return deleteLocalVideo(id);
    }
  },

  /**
   * Toggles like state on a video.
   */
  likeVideo: async (id) => {
    try {
      return await tryFetch(`/videos/${id}/like`, { method: 'POST' });
    } catch {
      return toggleLocalVideoLike(id);
    }
  },

  /**
   * Toggles dislike state on a video.
   */
  dislikeVideo: async (id) => {
    try {
      return await tryFetch(`/videos/${id}/dislike`, { method: 'POST' });
    } catch {
      return toggleLocalVideoDislike(id);
    }
  },

  /**
   * Posts a new comment to a video.
   */
  addComment: async (videoId, { text, user }) => {
    try {
      const res = await tryFetch(`/videos/${videoId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text, user })
      });
      return res;
    } catch {
      return addLocalComment(videoId, { text, user });
    }
  },

  /**
   * Updates an existing comment's text.
   */
  editComment: async (videoId, commentId, text) => {
    try {
      const res = await tryFetch(`/videos/${videoId}/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ text })
      });
      return res;
    } catch {
      return editLocalComment(videoId, commentId, text);
    }
  },

  /**
   * Deletes a comment from a video.
   */
  deleteComment: async (videoId, commentId) => {
    try {
      return await tryFetch(`/videos/${videoId}/comments/${commentId}`, {
        method: 'DELETE'
      });
    } catch {
      return deleteLocalComment(videoId, commentId);
    }
  }
};

// ----------------- Channels API -----------------
export const channelAPI = {
  /**
   * Fetches all registered channels.
   */
  getChannels: async () => {
    try {
      const data = await tryFetch('/channels');
      return data.channels || data;
    } catch {
      return getLocalChannels();
    }
  },

  /**
   * Fetches a specific channel by ID.
   */
  getChannelById: async (id) => {
    try {
      const data = await tryFetch(`/channels/${id}`);
      return data.channel || data;
    } catch {
      return getLocalChannelById(id);
    }
  },

  /**
   * Fetches all videos created by a channel.
   */
  getChannelVideos: async (id) => {
    try {
      const data = await tryFetch(`/channels/${id}/videos`);
      return data.videos || data;
    } catch {
      return getLocalChannelVideos(id);
    }
  },

  /**
   * Creates a new channel.
   */
  createChannel: async (channelData) => {
    try {
      const data = await tryFetch('/channels', {
        method: 'POST',
        body: JSON.stringify(channelData)
      });
      return data.channel || data;
    } catch {
      return createLocalChannel(channelData);
    }
  },

  /**
   * Updates a channel's details.
   */
  updateChannel: async (id, fields) => {
    try {
      const data = await tryFetch(`/channels/${id}`, {
        method: 'PUT',
        body: JSON.stringify(fields)
      });
      return data.channel || data;
    } catch {
      return updateLocalChannel(id, fields);
    }
  },

  /**
   * Toggles subscription status for a channel.
   */
  toggleSubscribe: async (id) => {
    try {
      const data = await tryFetch(`/channels/${id}/subscribe`, { method: 'POST' });
      return data.isSubscribed;
    } catch {
      return toggleLocalChannelSubscription(id);
    }
  },

  /**
   * Returns local subscription status for a channel.
   */
  getSubscription: (id) => {
    return getLocalChannelSubscription(id);
  }
};

