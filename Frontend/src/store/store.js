/**
 * Central Redux Store Configuration
 * Combines authentication, videos feed, creator channels, and UI layout slices.
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import videoReducer from './slices/videoSlice';
import channelReducer from './slices/channelSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    videos: videoReducer,
    channels: channelReducer,
    ui: uiReducer
  }
});

export default store;

