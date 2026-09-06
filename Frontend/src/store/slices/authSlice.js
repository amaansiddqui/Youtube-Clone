/**
 * Redux Slice: Authentication
 * Manages user credentials, active session status, login/register thunks,
 * and profile state throughout the application.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../utils/api';

// Hydrate current user from stored session token if available
const initialUser = authAPI.getCurrentUser();

/**
 * Async Thunk: Logs in user with email/username and password.
 */
export const loginUserThunk = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authAPI.login(credentials);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message || 'Login failed');
    }
  }
);

/**
 * Async Thunk: Registers a new user account.
 */
export const registerUserThunk = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await authAPI.register(userData);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message || 'Registration failed');
    }
  }
);

const initialState = {
  currentUser: initialUser,
  isAuthenticated: Boolean(initialUser),
  loading: false,
  error: null
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Sets active user profile upon manual sign in or hydration
    setUser: (state, action) => {
      state.currentUser = action.payload;
      state.isAuthenticated = Boolean(action.payload);
      state.error = null;
    },
    // Clears active session and wipes stored token
    logout: (state) => {
      authAPI.logout();
      state.currentUser = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    // Clears any visible authentication error banner
    clearAuthError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login handling
      .addCase(loginUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register handling
      .addCase(registerUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setUser, logout, clearAuthError } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.currentUser;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;

