/**
 * Google-Themed Authentication Page
 * Supports:
 * - Switching between 'Sign in' and 'Create a Google Account'
 * - Email or Username login credentials
 * - One-click demo user autofill ('Use Demo Account')
 * - Form validation and clear inline error alerts
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { GoogleGIcon } from './Icons';
import { loginUser, registerUser, SAMPLE_USER } from '../utils/auth';
import { setUser } from '../store/slices/authSlice';


export default function AuthPage({ onAuthSuccess, onNavigateHome }) {
  const dispatch = useDispatch();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const showSampleHint = true;

  const fillSampleUser = () => {
    setEmail(SAMPLE_USER.email);
    setUsername(SAMPLE_USER.username);
    setPassword(SAMPLE_USER.password);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        const { user } = loginUser({
          identity: email || username,
          password
        });
        dispatch(setUser(user));
        if (onAuthSuccess) {
          onAuthSuccess(user);
        }
      } else {
        const { user } = registerUser({
          username,
          email,
          password
        });
        dispatch(setUser(user));
        if (onAuthSuccess) {
          onAuthSuccess(user);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="google-auth-container min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-[#0f0f0f]">
      <div className="google-auth-card w-full max-w-md bg-[#1e1e1e] border border-[#3c4043] rounded-3xl p-8 sm:p-10 flex flex-col shadow-2xl">
        {/* Google branding header */}
        <div className="google-header-center flex flex-col items-center text-center mb-6">
          <GoogleGIcon size={36} />
          <h1 className="google-auth-title text-2xl font-medium text-[#e8eaed] mt-4 mb-2">
            {mode === 'login' ? 'Sign in' : 'Create a Google Account'}
          </h1>
          <p className="google-auth-subtitle text-sm text-[#9aa0a6]">
            {mode === 'login'
              ? 'to continue to YouTube'
              : 'Enter your details to create your YouTube profile'}
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="google-auth-error flex items-center gap-2.5 bg-[#f28b82]/10 border border-[#f28b82] text-[#f28b82] px-3.5 py-2.5 rounded-lg text-xs font-medium mb-4" role="alert">
            <span className="google-error-icon font-bold text-sm">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* Auth form */}
        <form className="google-form flex flex-col gap-4" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="google-input-group flex flex-col gap-1.5">
              <label htmlFor="auth-username" className="google-input-label text-xs font-medium text-[#bdc1c6]">Username</label>
              <input
                id="auth-username"
                type="text"
                className="google-input-field w-full h-12 px-4 bg-transparent border border-[#5f6368] focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#8ab4f8] rounded-lg text-[#e8eaed] text-sm outline-none transition-all placeholder-[#5f6368]"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          )}

          <div className="google-input-group flex flex-col gap-1.5">
            <label htmlFor="auth-email" className="google-input-label text-xs font-medium text-[#bdc1c6]">
              {mode === 'login' ? 'Email or Username' : 'Email'}
            </label>
            <input
              id="auth-email"
              type={mode === 'login' ? 'text' : 'email'}
              className="google-input-field w-full h-12 px-4 bg-transparent border border-[#5f6368] focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#8ab4f8] rounded-lg text-[#e8eaed] text-sm outline-none transition-all placeholder-[#5f6368]"
              placeholder={mode === 'login' ? 'Email or username' : 'name@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="google-input-group flex flex-col gap-1.5">
            <label htmlFor="auth-password" className="google-input-label text-xs font-medium text-[#bdc1c6]">Password</label>
            <input
              id="auth-password"
              type="password"
              className="google-input-field w-full h-12 px-4 bg-transparent border border-[#5f6368] focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#8ab4f8] rounded-lg text-[#e8eaed] text-sm outline-none transition-all placeholder-[#5f6368]"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {/* Quick sample credentials helper */}
          {showSampleHint && mode === 'login' && (
            <div className="google-sample-helper bg-[#4285f4]/10 border border-dashed border-[#4285f4]/40 rounded-xl p-3 flex flex-col gap-2">
              <div className="sample-tip-text text-xs text-[#8ab4f8] break-all">
                <strong>Demo Credentials:</strong> {SAMPLE_USER.email} / {SAMPLE_USER.password}
              </div>
              <button
                type="button"
                className="google-fill-btn self-start bg-[#1a73e8] hover:bg-[#1557b0] text-white px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer"
                onClick={fillSampleUser}
              >
                Auto-fill Sample User
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="google-form-actions flex items-center justify-between mt-3">
            {mode === 'login' ? (
              <button
                type="button"
                className="google-secondary-btn text-[#8ab4f8] hover:underline text-sm font-medium transition-colors cursor-pointer bg-transparent border-none"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
              >
                Create account
              </button>
            ) : (
              <button
                type="button"
                className="google-secondary-btn text-[#8ab4f8] hover:underline text-sm font-medium transition-colors cursor-pointer bg-transparent border-none"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
              >
                Sign in instead
              </button>
            )}

            <button type="submit" className="google-primary-btn bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] px-6 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer border-none">
              {mode === 'login' ? 'Next' : 'Register'}
            </button>
          </div>
        </form>

        {/* Back to YouTube link */}
        <div className="google-auth-footer mt-6 text-center border-t border-white/10 pt-4">
          <button
            type="button"
            className="google-back-link text-[#9aa0a6] hover:text-[#e8eaed] text-xs transition-colors bg-transparent border-none cursor-pointer"
            onClick={onNavigateHome}
          >
            ← Back to YouTube
          </button>
        </div>
      </div>
    </div>
  );
}
