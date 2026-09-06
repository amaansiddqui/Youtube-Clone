/**
 * Redux Slice: Channels
 * Manages creator channels, channel-specific video lists,
 * channel profile customization, and subscription statuses.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { channelAPI } from '../../utils/api';
import { getChannels } from '../../utils/channelService';

export const fetchChannelsThunk = createAsyncThunk(
  'channels/fetchChannels',
  async (_, { rejectWithValue }) => {
    try {
      return await channelAPI.getChannels();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchChannelByIdThunk = createAsyncThunk(
  'channels/fetchChannelById',
  async (channelId, { rejectWithValue }) => {
    try {
      return await channelAPI.getChannelById(channelId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchChannelVideosThunk = createAsyncThunk(
  'channels/fetchChannelVideos',
  async (channelId, { rejectWithValue }) => {
    try {
      return await channelAPI.getChannelVideos(channelId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createChannelThunk = createAsyncThunk(
  'channels/createChannel',
  async (channelData, { rejectWithValue }) => {
    try {
      return await channelAPI.createChannel(channelData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateChannelThunk = createAsyncThunk(
  'channels/updateChannel',
  async ({ channelId, fields }, { rejectWithValue }) => {
    try {
      return await channelAPI.updateChannel(channelId, fields);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleSubscribeThunk = createAsyncThunk(
  'channels/toggleSubscribe',
  async (channelId, { rejectWithValue }) => {
    try {
      const isSubscribed = await channelAPI.toggleSubscribe(channelId);
      return { channelId, isSubscribed };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  channels: getChannels(),
  currentChannel: null,
  channelVideos: [],
  subscriptions: {},
  loading: false,
  error: null
};

export const channelSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    setChannels: (state, action) => {
      state.channels = action.payload;
    },
    setCurrentChannel: (state, action) => {
      state.currentChannel = action.payload;
    },
    setChannelVideos: (state, action) => {
      state.channelVideos = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchChannels
      .addCase(fetchChannelsThunk.fulfilled, (state, action) => {
        state.channels = action.payload;
      })
      // fetchChannelById
      .addCase(fetchChannelByIdThunk.fulfilled, (state, action) => {
        state.currentChannel = action.payload;
      })
      // fetchChannelVideos
      .addCase(fetchChannelVideosThunk.fulfilled, (state, action) => {
        state.channelVideos = action.payload;
      })
      // createChannel
      .addCase(createChannelThunk.fulfilled, (state, action) => {
        state.channels.push(action.payload);
        state.currentChannel = action.payload;
      })
      // updateChannel
      .addCase(updateChannelThunk.fulfilled, (state, action) => {
        const index = state.channels.findIndex((c) => c.channelId === action.payload.channelId);
        if (index !== -1) {
          state.channels[index] = action.payload;
        }
        if (state.currentChannel && state.currentChannel.channelId === action.payload.channelId) {
          state.currentChannel = action.payload;
        }
      })
      // toggleSubscribe
      .addCase(toggleSubscribeThunk.fulfilled, (state, action) => {
        const { channelId, isSubscribed } = action.payload;
        state.subscriptions[channelId] = isSubscribed;
      });
  }
});

export const { setChannels, setCurrentChannel, setChannelVideos } = channelSlice.actions;

export const selectAllChannels = (state) => state.channels.channels;
export const selectCurrentChannel = (state) => state.channels.currentChannel;
export const selectChannelVideos = (state) => state.channels.channelVideos;

export const selectChannelById = (channelId) => (state) =>
  state.channels.channels.find((c) => c.channelId === channelId) || null;

export const selectUserPrimaryChannel = (userId) => (state) => {
  if (!userId) return null;
  return state.channels.channels.find((c) => c.owner === userId) || null;
};

export const selectIsSubscribed = (channelId) => (state) =>
  Boolean(state.channels.subscriptions[channelId]);

export default channelSlice.reducer;
