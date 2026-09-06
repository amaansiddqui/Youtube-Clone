/**
 * Redux Slice: Videos
 * Manages the global video feed, active category filter, search query filter,
 * selected video details, and async thunks for video & comment operations.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { videoAPI } from '../../utils/api';
import { getVideos } from '../../utils/videoService';

// Async thunks for video feed and video details
export const fetchVideosThunk = createAsyncThunk(
  'videos/fetchVideos',
  async (_, { rejectWithValue }) => {
    try {
      return await videoAPI.getVideos();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchVideoByIdThunk = createAsyncThunk(
  'videos/fetchVideoById',
  async (videoId, { rejectWithValue }) => {
    try {
      return await videoAPI.getVideoById(videoId);
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
  async (videoId, { rejectWithValue }) => {
    try {
      return await videoAPI.likeVideo(videoId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleDislikeThunk = createAsyncThunk(
  'videos/toggleDislike',
  async (videoId, { rejectWithValue }) => {
    try {
      return await videoAPI.dislikeVideo(videoId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addCommentThunk = createAsyncThunk(
  'videos/addComment',
  async ({ videoId, text, user }, { rejectWithValue }) => {
    try {
      return await videoAPI.addComment(videoId, { text, user });
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
  videos: getVideos(),
  currentVideo: null,
  selectedCategory: 'All',
  searchQuery: '',
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
      })
      .addCase(fetchVideosThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.videos = action.payload;
      })
      .addCase(fetchVideosThunk.rejected, (state, action) => {
        state.loading = false;
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

export const selectFilteredVideos = (state) => {
  const { videos, selectedCategory, searchQuery } = state.videos;
  const q = searchQuery.trim().toLowerCase();

  return videos.filter((video) => {
    const matchesSearch =
      q === '' ||
      video.title.toLowerCase().includes(q) ||
      (video.channelName && video.channelName.toLowerCase().includes(q)) ||
      (video.description && video.description.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (selectedCategory === 'All') return true;

    return video.category?.toLowerCase() === selectedCategory.toLowerCase();
  });
};

export const selectVideoById = (videoId) => (state) =>
  state.videos.videos.find((v) => v.videoId === videoId) || null;

export default videoSlice.reducer;
