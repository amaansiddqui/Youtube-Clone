/**
 * Redux Slice: UI State
 * Controls drawer/sidebar visibility (standard desktop mini-sidebar vs expanded),
 * watch page sidebar state, active navigation tabs, and modal visibility.
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isSidebarOpen: true,
  isWatchSidebarOpen: false,
  activeTab: 'Home',
  isCreateChannelModalOpen: false,
  isCustomizeChannelModalOpen: false,
  isManageVideosModalOpen: false
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
    toggleWatchSidebar: (state) => {
      state.isWatchSidebarOpen = !state.isWatchSidebarOpen;
    },
    setWatchSidebarOpen: (state, action) => {
      state.isWatchSidebarOpen = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setCreateChannelModalOpen: (state, action) => {
      state.isCreateChannelModalOpen = action.payload;
    },
    setCustomizeChannelModalOpen: (state, action) => {
      state.isCustomizeChannelModalOpen = action.payload;
    },
    setManageVideosModalOpen: (state, action) => {
      state.isManageVideosModalOpen = action.payload;
    }
  }
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleWatchSidebar,
  setWatchSidebarOpen,
  setActiveTab,
  setCreateChannelModalOpen,
  setCustomizeChannelModalOpen,
  setManageVideosModalOpen
} = uiSlice.actions;

export const selectIsSidebarOpen = (state) => state.ui.isSidebarOpen;
export const selectIsWatchSidebarOpen = (state) => state.ui.isWatchSidebarOpen;
export const selectActiveTab = (state) => state.ui.activeTab;
export const selectIsCreateChannelModalOpen = (state) => state.ui.isCreateChannelModalOpen;
export const selectIsCustomizeChannelModalOpen = (state) => state.ui.isCustomizeChannelModalOpen;
export const selectIsManageVideosModalOpen = (state) => state.ui.isManageVideosModalOpen;

export default uiSlice.reducer;
