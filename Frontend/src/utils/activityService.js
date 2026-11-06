/**
 * User activity storage helpers
 * Watch history, Watch Later list — kept in localStorage keyed per user.
 */

const HISTORY_KEY = 'yt_watch_history';
const WATCH_LATER_KEY = 'yt_watch_later';

function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Storage full / unavailable
  }
}

/**
 * Records a video as watched (most recent first, deduplicated, capped at 200).
 */
export function recordWatch(videoId) {
  if (!videoId) return;
  const list = readList(HISTORY_KEY).filter((id) => id !== videoId);
  list.unshift(videoId);
  writeList(HISTORY_KEY, list.slice(0, 200));
}

/**
 * Returns the watch history video ID list (newest first).
 */
export function getWatchHistory() {
  return readList(HISTORY_KEY);
}

/**
 * Toggles a video in the Watch Later list. Returns the new membership state.
 */
export function toggleWatchLater(videoId) {
  if (!videoId) return false;
  const list = readList(WATCH_LATER_KEY);
  const exists = list.includes(videoId);
  const next = exists ? list.filter((id) => id !== videoId) : [videoId, ...list];
  writeList(WATCH_LATER_KEY, next);
  return !exists;
}

/**
 * Returns whether a video is in the Watch Later list.
 */
export function isInWatchLater(videoId) {
  return readList(WATCH_LATER_KEY).includes(videoId);
}
