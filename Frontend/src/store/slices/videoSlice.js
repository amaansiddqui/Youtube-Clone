import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { videoAPI, youtubeAPI } from '../../utils/api';

// One-time cleanup: remove legacy sample/seed videos from localStorage
(function purgeSampleVideos() {
  try {
    const raw = localStorage.getItem('yt_videos_database_v2');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    // Keep only real user uploads (video_ prefix); drop video01/02/03 seed entries
    const uploadsOnly = parsed.filter((v) => v.videoId && String(v.videoId).startsWith('video_'));
    if (uploadsOnly.length !== parsed.length) {
      localStorage.setItem('yt_videos_database_v2', JSON.stringify(uploadsOnly));
    }
  } catch {
    // Ignore storage errors
  }
})();

// YouTube category chips -> real YouTube videoCategoryId values
const YOUTUBE_CATEGORY_IDS = {
  Music: '10',
  Gaming: '20',
  Sports: '17',
  News: '25',
  Movies: '1',
  Technology: '28'
};

// Async thunks for video feed and video details
export const fetchVideosThunk = createAsyncThunk(
  'videos/fetchVideos',
  async (_, { rejectWithValue }) => {
    try {
      return await youtubeAPI.getFeed();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Real YouTube search thunk
export const youtubeSearchThunk = createAsyncThunk(
  'videos/youtubeSearch',
  async (query, { rejectWithValue }) => {
    try {
      return await youtubeAPI.search(query);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Tab feed loader: dispatches the right real-data fetch for each sidebar tab
export const fetchTabFeedThunk = createAsyncThunk(
  'videos/fetchTabFeed',
  async (tab, { rejectWithValue }) => {
    try {
      switch (tab) {
        case 'Shorts':
          return await youtubeAPI.search('#shorts', 48);
        case 'Trending':
        case 'Home':
          return await youtubeAPI.getFeed();
        case 'Music':
          return await youtubeAPI.getCategory('10');
        case 'Gaming':
          return await youtubeAPI.getCategory('20');
        case 'Sports':
          return await youtubeAPI.getCategory('17');
        case 'News':
          return await youtubeAPI.getCategory('25');
        case 'Movies':
          return await youtubeAPI.getCategory('1');
        case 'Technology':
          return await youtubeAPI.getCategory('28');
        case 'Live':
          return await youtubeAPI.search('live', 24, { eventType: 'live' });
        case 'Podcasts':
          return await youtubeAPI.search('podcast', 24);
        case 'Recently uploaded':
          return await youtubeAPI.search('videos', 24, { order: 'date' });
        case 'New to you':
          return await youtubeAPI.search('new videos', 24, { order: 'date' });
        default:
          return null; // Library tabs are computed from local state instead
      }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Real YouTube category feed thunk
export const youtubeCategoryThunk = createAsyncThunk(
  'videos/youtubeCategory',
  async (category, { rejectWithValue }) => {
    try {
      const categoryId = YOUTUBE_CATEGORY_IDS[category];
      if (!categoryId) return [];
      return await youtubeAPI.getCategory(categoryId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchVideoByIdThunk = createAsyncThunk(
  'videos/fetchVideoById',
  async (payload, { rejectWithValue }) => {
    try {
      const videoId = typeof payload === 'string' ? payload : payload.videoId;
      const user = typeof payload === 'object' ? payload.user : null;
      return await videoAPI.getVideoById(videoId, user);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addVideoThunk = createAsyncThunk(
  'videos/addVideo',
  async (videoData, { rejectWithValue }) => {
    try {
      return await videoAPI.addVideo(videoData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateVideoThunk = createAsyncThunk(
  'videos/updateVideo',
  async ({ videoId, fields }, { rejectWithValue }) => {
    try {
      return await videoAPI.updateVideo(videoId, fields);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteVideoThunk = createAsyncThunk(
  'videos/deleteVideo',
  async (videoId, { rejectWithValue }) => {
    try {
      await videoAPI.deleteVideo(videoId);
      return videoId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleLikeThunk = createAsyncThunk(
  'videos/toggleLike',
  async (payload, { rejectWithValue }) => {
    try {
      const videoId = typeof payload === 'string' ? payload : payload.videoId;
      const currentStatus = typeof payload === 'object' ? payload.currentStatus : undefined;
      const user = typeof payload === 'object' ? payload.user : undefined;
      return await videoAPI.likeVideo(videoId, currentStatus, user);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleDislikeThunk = createAsyncThunk(
  'videos/toggleDislike',
  async (payload, { rejectWithValue }) => {
    try {
      const videoId = typeof payload === 'string' ? payload : payload.videoId;
      const currentStatus = typeof payload === 'object' ? payload.currentStatus : undefined;
      const user = typeof payload === 'object' ? payload.user : undefined;
      return await videoAPI.dislikeVideo(videoId, currentStatus, user);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addCommentThunk = createAsyncThunk(
  'videos/addComment',
  async ({ videoId, text, user, commentId }, { rejectWithValue }) => {
    try {
      return await videoAPI.addComment(videoId, { text, user, commentId });
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const editCommentThunk = createAsyncThunk(
  'videos/editComment',
  async ({ videoId, commentId, text }, { rejectWithValue }) => {
    try {
      return await videoAPI.editComment(videoId, commentId, text);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteCommentThunk = createAsyncThunk(
  'videos/deleteComment',
  async ({ videoId, commentId }, { rejectWithValue }) => {
    try {
      await videoAPI.deleteComment(videoId, commentId);
      return { videoId, commentId };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  videos: [],
  currentVideo: null,
  selectedCategory: 'All',
  searchQuery: '',
  searchResults: [],
  isSearchMode: false,
  activeFeedTab: null,
  tabFeed: [],
  tabLoading: false,
  loading: false,
  error: null
};

export const videoSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    setVideos: (state, action) => {
      state.videos = action.payload;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      // Clearing the query exits search results mode
      if (!action.payload || !action.payload.trim()) {
        state.isSearchMode = false;
        state.searchResults = [];
      }
    },
    setCurrentVideo: (state, action) => {
      state.currentVideo = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchVideos
      .addCase(fetchVideosThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVideosThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.videos = action.payload;
      })
      .addCase(fetchVideosThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // youtubeSearch
      .addCase(youtubeSearchThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.searchResults = [];
      })
      .addCase(youtubeSearchThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.isSearchMode = true;
        state.searchResults = action.payload;
      })
      .addCase(youtubeSearchThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // youtubeCategory
      .addCase(youtubeCategoryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(youtubeCategoryThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          state.videos = action.payload;
        }
      })
      .addCase(youtubeCategoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchTabFeed (sidebar tabs)
      .addCase(fetchTabFeedThunk.pending, (state, action) => {
        state.tabLoading = true;
        state.error = null;
        state.activeFeedTab = action.meta.arg;
        state.tabFeed = [];
      })
      .addCase(fetchTabFeedThunk.fulfilled, (state, action) => {
        state.tabLoading = false;
        if (Array.isArray(action.payload)) {
          state.tabFeed = action.payload;
        }
        // Library tabs (History/Liked/Watch Later/Playlists/Subscriptions) resolve locally
      })
      .addCase(fetchTabFeedThunk.rejected, (state, action) => {
        state.tabLoading = false;
        state.error = action.payload;
      })
      // fetchVideoById
      .addCase(fetchVideoByIdThunk.fulfilled, (state, action) => {
        state.currentVideo = action.payload;
      })
      // addVideo
      .addCase(addVideoThunk.fulfilled, (state, action) => {
        state.videos.unshift(action.payload);
      })
      // updateVideo
      .addCase(updateVideoThunk.fulfilled, (state, action) => {
        const index = state.videos.findIndex((v) => v.videoId === action.payload.videoId);
        if (index !== -1) {
          state.videos[index] = action.payload;
        }
        if (state.currentVideo && state.currentVideo.videoId === action.payload.videoId) {
          state.currentVideo = action.payload;
        }
      })
      // deleteVideo
      .addCase(deleteVideoThunk.fulfilled, (state, action) => {
        state.videos = state.videos.filter((v) => v.videoId !== action.payload);
        if (state.currentVideo && state.currentVideo.videoId === action.payload) {
          state.currentVideo = null;
        }
      })
      // toggleLike
      .addCase(toggleLikeThunk.fulfilled, (state, action) => {
        if (!action.payload?.video) return;
        const updated = action.payload.video;
        const index = state.videos.findIndex((v) => v.videoId === updated.videoId);
        if (index !== -1) {
          state.videos[index].likes = updated.likes;
          state.videos[index].dislikes = updated.dislikes;
        }
        if (state.currentVideo && state.currentVideo.videoId === updated.videoId) {
          state.currentVideo.likes = updated.likes;
          state.currentVideo.dislikes = updated.dislikes;
        }
      })
      // toggleDislike
      .addCase(toggleDislikeThunk.fulfilled, (state, action) => {
        if (!action.payload?.video) return;
        const updated = action.payload.video;
        const index = state.videos.findIndex((v) => v.videoId === updated.videoId);
        if (index !== -1) {
          state.videos[index].likes = updated.likes;
          state.videos[index].dislikes = updated.dislikes;
        }
        if (state.currentVideo && state.currentVideo.videoId === updated.videoId) {
          state.currentVideo.likes = updated.likes;
          state.currentVideo.dislikes = updated.dislikes;
        }
      })
      // addComment
      .addCase(addCommentThunk.fulfilled, (state, action) => {
        const updated = action.payload?.video;
        if (!updated) return;
        const index = state.videos.findIndex((v) => v.videoId === updated.videoId);
        if (index !== -1) {
          state.videos[index].comments = updated.comments;
        }
        if (state.currentVideo && state.currentVideo.videoId === updated.videoId) {
          state.currentVideo.comments = updated.comments;
        }
      })
      // editComment
      .addCase(editCommentThunk.fulfilled, (state, action) => {
        const updated = action.payload?.video;
        if (!updated) return;
        const index = state.videos.findIndex((v) => v.videoId === updated.videoId);
        if (index !== -1) {
          state.videos[index].comments = updated.comments;
        }
        if (state.currentVideo && state.currentVideo.videoId === updated.videoId) {
          state.currentVideo.comments = updated.comments;
        }
      })
      // deleteComment
      .addCase(deleteCommentThunk.fulfilled, (state, action) => {
        const { videoId, commentId } = action.payload;
        const target = state.videos.find((v) => v.videoId === videoId);
        if (target && target.comments) {
          target.comments = target.comments.filter((c) => c.commentId !== commentId);
        }
        if (state.currentVideo && state.currentVideo.videoId === videoId && state.currentVideo.comments) {
          state.currentVideo.comments = state.currentVideo.comments.filter((c) => c.commentId !== commentId);
        }
      });
  }
});

export const {
  setVideos,
  setSelectedCategory,
  setSearchQuery,
  setCurrentVideo
} = videoSlice.actions;

export const selectAllVideos = (state) => state.videos.videos;
export const selectCurrentVideo = (state) => state.videos.currentVideo;
export const selectSelectedCategory = (state) => state.videos.selectedCategory;
export const selectSearchQuery = (state) => state.videos.searchQuery;
export const selectVideosLoading = (state) => state.videos.loading;
export const selectVideoError = (state) => state.videos.error;
export const selectIsSearchMode = (state) => state.videos.isSearchMode;
export const selectSearchResults = (state) => state.videos.searchResults;
export const selectActiveFeedTab = (state) => state.videos.activeFeedTab;
export const selectTabFeed = (state) => state.videos.tabFeed;
export const selectTabLoading = (state) => state.videos.tabLoading;

export const selectTabVideos = createSelector(
  [selectActiveFeedTab, selectAllVideos, selectTabFeed, (state) => state.videos.tabLoading],
  (tab, allVideos, remoteFeed, tabLoading) => {
    if (!tab) return null;

    // Library tabs read from the user's local activity
    try {
      if (tab === 'History') {
        const raw = localStorage.getItem('yt_watch_history');
        const ids = raw ? JSON.parse(raw) : [];
        return ids.map((id) => allVideos.find((v) => v.videoId === id)).filter(Boolean);
      }
      if (tab === 'Liked videos') {
        const raw = localStorage.getItem('yt_user_video_interactions');
        const map = raw ? JSON.parse(raw) : {};
        const likedIds = Object.entries(map)
          .filter(([, status]) => status === 'like')
          .map(([key]) => key.split('_').slice(1).join('_'));
        // YouTube IDs may contain underscores; match by suffix against stored videos
        return allVideos.filter((v) =>
          likedIds.some((k) => k === v.videoId || k.endsWith(v.videoId))
        );
      }
      if (tab === 'Watch Later') {
        const raw = localStorage.getItem('yt_watch_later');
        const ids = raw ? JSON.parse(raw) : [];
        return ids.map((id) => allVideos.find((v) => v.videoId === id)).filter(Boolean);
      }
      if (tab === 'Playlists') {
        const raw = localStorage.getItem('yt_watch_later');
        const ids = raw ? JSON.parse(raw) : [];
        return ids.map((id) => allVideos.find((v) => v.videoId === id)).filter(Boolean);
      }
      if (tab === 'Subscriptions') {
        const raw = localStorage.getItem('yt_channel_subscriptions');
        const map = raw ? JSON.parse(raw) : {};
        const subIds = Object.keys(map).filter((k) => map[k]);
        return allVideos.filter((v) => subIds.includes(v.channelId));
      }
    } catch {
      return [];
    }

    // Remote tabs use the fetched YouTube feed
    return tabLoading ? null : remoteFeed;
  }
);

export const selectFilteredVideos = createSelector(
  [selectAllVideos, selectSelectedCategory, selectSearchQuery, selectSearchResults, (state) => state.videos.isSearchMode],
  (videos, selectedCategory, searchQuery, searchResults, isSearchMode) => {
    // In search-results mode show the live YouTube search results
    if (isSearchMode) return searchResults;

  const q = '';

  return videos.filter((video) => {
    if (selectedCategory === 'All') return true;
    return video.category?.toLowerCase() === selectedCategory.toLowerCase();
  });
  }
);

export const selectVideoById = (videoId) => (state) =>
  state.videos.videos.find((v) => v.videoId === videoId) || null;

export default videoSlice.reducer;
