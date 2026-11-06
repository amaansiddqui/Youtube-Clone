import express from 'express';
import mongoose from 'mongoose';
import Video from '../models/Video.js';
import Channel from '../models/Channel.js';
import Comment from '../models/Comment.js';

const router = express.Router();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Default region for trending / category charts (ISO 3166-1 alpha-2)
const DEFAULT_REGION = 'IN';

// In-memory cache to stay well within the YouTube API daily quota
const memoryCache = new Map(); // key -> { data, expiresAt }
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  const hit = memoryCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.data;
  if (hit) memoryCache.delete(key);
  return null;
}

function setCached(key, data) {
  memoryCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Converts YouTube's ISO-8601 duration (e.g. PT1H2M10S) to mm:ss / h:mm:ss
 */
function formatISODuration(iso) {
  const match = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  const h = parseInt(match[1] || 0, 10);
  const m = parseInt(match[2] || 0, 10);
  const s = parseInt(match[3] || 0, 10);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Converts a raw YouTube API video + channel payload into the exact shape the
 * frontend VideoCard / VideoWatchPage components already expect.
 */
function mapToAppVideo(item, channelMap = new Map()) {
  const snippet = item.snippet || {};
  const stats = item.statistics || {};
  const cd = item.contentDetails || {};
  const videoId = typeof item.id === 'string' ? item.id : item.id?.videoId;

  const channelId = snippet.channelId;
  const channel = channelMap.get(channelId);

  const views = parseInt(stats.viewCount || 0, 10);
  const likes = parseInt(stats.likeCount || 0, 10);

  return {
    videoId,
    title: snippet.title || 'Untitled',
    description: snippet.description || '',
    thumbnailUrl:
      snippet.thumbnails?.maxres?.url ||
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    // The frontend player uses this to detect YouTube playback
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`,
    youtubeVideoId: videoId,
    channelId,
    channelName: snippet.channelTitle || 'YouTube Creator',
    channelAvatarUrl: channel?.avatarUrl || '',
    channelSubscribers: channel?.subscribers || 0,
    avatarUrl: channel?.avatarUrl || '',
    subscribers: channel?.subscriberCountText || '',
    views,
    likes: Number.isNaN(likes) ? 0 : likes,
    dislikes: 0, // YouTube API no longer exposes dislike counts
    uploadDate: snippet.publishedAt || new Date().toISOString(),
    duration: formatISODuration(cd.duration),
    category: 'YouTube',
    tags: snippet.tags || [],
    comments: []
  };
}

/**
 * Calls the YouTube Data API v3 and returns parsed JSON.
 */
async function youtubeFetch(endpoint, params) {
  const url = new URL(`${YOUTUBE_API_BASE}${endpoint}`);
  url.searchParams.set('key', YOUTUBE_API_KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    const message = data?.error?.message || `YouTube API error (${res.status})`;
    throw new Error(message);
  }
  return data;
}

/**
 * Fetches channel details (avatar, subscriber count) for a list of channel IDs.
 */
async function fetchChannels(channelIds) {
  const unique = [...new Set(channelIds.filter(Boolean))];
  if (unique.length === 0) return [];
  const map = new Map();

  // YouTube API allows up to 50 IDs per call
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    const data = await youtubeFetch('/channels', {
      part: 'snippet,statistics',
      id: batch.join(',')
    });
    (data.items || []).forEach((ch) => {
      const subs = parseInt(ch.statistics?.subscriberCount || 0, 10);
      let subsText = '';
      if (subs >= 1_000_000) subsText = `${(subs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M subscribers`;
      else if (subs >= 1000) subsText = `${(subs / 1000).toFixed(1).replace(/\.0$/, '')}K subscribers`;
      else if (subs > 0) subsText = `${subs} subscribers`;

      map.set(ch.id, {
        channelId: ch.id,
        name: ch.snippet?.title || 'YouTube Channel',
        avatarUrl:
          ch.snippet?.thumbnails?.high?.url ||
          ch.snippet?.thumbnails?.default?.url ||
          '',
        bannerUrl: '',
        subscribers: subs,
        subscriberCountText: subsText,
        description: ch.snippet?.description || ''
      });
    });
  }
  return map;
}

/**
 * Fetches top-level comments for a YouTube video.
 */
async function fetchComments(youtubeVideoId, maxResults = 20) {
  try {
    const data = await youtubeFetch('/commentThreads', {
      part: 'snippet',
      videoId: youtubeVideoId,
      maxResults,
      order: 'relevance',
      textFormat: 'plainText'
    });
    return (data.items || []).map((t) => {
      const s = t.snippet?.topLevelComment?.snippet || {};
      return {
        commentId: t.id,
        userId: s.authorChannelId?.value || 'yt_user',
        author: s.authorDisplayName || 'YouTube User',
        avatarUrl: s.authorProfileImageUrl || '',
        text: s.textDisplay || '',
        likes: s.likeCount || 0,
        timestamp: s.publishedAt || new Date().toISOString()
      };
    });
  } catch {
    // Comments are disabled or quota issue — return empty rather than failing the video
    return [];
  }
}

function requireApiKey(res) {
  if (!YOUTUBE_API_KEY) {
    res.status(500).json({ message: 'YOUTUBE_API_KEY is not configured on the server.' });
    return false;
  }
  return true;
}

// ---------------- Routes ----------------

/**
 * GET /api/youtube/videos
 * Main home feed — trending / most popular videos (optionally by region).
 */
router.get('/videos', async (req, res) => {
  if (!requireApiKey(res)) return;
  const cacheKey = `feed_${req.query.regionCode || DEFAULT_REGION}_${req.query.maxResults || 40}`;
  try {
    const cached = getCached(cacheKey);
    if (cached) return res.json({ videos: cached });

    const data = await youtubeFetch('/videos', {
      part: 'snippet,statistics,contentDetails',
      chart: 'mostPopular',
      regionCode: req.query.regionCode || DEFAULT_REGION,
      maxResults: Math.min(parseInt(req.query.maxResults || 40, 10), 50)
    });

    const channelMap = await fetchChannels((data.items || []).map((i) => i.snippet?.channelId));
    const videos = (data.items || []).map((item) => mapToAppVideo(item, channelMap));

    setCached(cacheKey, videos);
    res.json({ videos });
  } catch (err) {
    res.status(502).json({ message: err.message });
  }
});

/**
 * GET /api/youtube/search?q=...
 * Real YouTube search.
 */
router.get('/search', async (req, res) => {
  if (!requireApiKey(res)) return;
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ videos: [] });

  const cacheKey = `search_${q}_${req.query.maxResults || 24}_${req.query.order || 'relevance'}_${req.query.eventType || ''}`;
  try {
    const cached = getCached(cacheKey);
    if (cached) return res.json({ videos: cached });

    // Step 1: search for video IDs
    const search = await youtubeFetch('/search', {
      part: 'snippet',
      q,
      type: 'video',
      order: req.query.order || 'relevance',
      eventType: req.query.eventType || undefined,
      maxResults: Math.min(parseInt(req.query.maxResults || 24, 10), 50)
    });
    const ids = (search.items || []).map((i) => i.id?.videoId).filter(Boolean);
    if (ids.length === 0) return res.json({ videos: [] });

    // Step 2: hydrate with statistics + durations
    const details = await youtubeFetch('/videos', {
      part: 'snippet,statistics,contentDetails',
      id: ids.join(',')
    });

    const channelMap = await fetchChannels((details.items || []).map((i) => i.snippet?.channelId));
    const videos = (details.items || []).map((item) => mapToAppVideo(item, channelMap));

    setCached(cacheKey, videos);
    res.json({ videos });
  } catch (err) {
    res.status(502).json({ message: err.message });
  }
});

/**
 * GET /api/youtube/videos/:id
 * Single video details with real comments.
 */
router.get('/videos/:id', async (req, res) => {
  if (!requireApiKey(res)) return;
  const cacheKey = `video_${req.params.id}`;
  try {
    const cached = getCached(cacheKey);
    if (cached) return res.json({ video: cached });

    const data = await youtubeFetch('/videos', {
      part: 'snippet,statistics,contentDetails',
      id: req.params.id
    });
    if (!data.items || data.items.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const channelMap = await fetchChannels([data.items[0].snippet?.channelId]);
    const video = mapToAppVideo(data.items[0], channelMap);
    video.comments = await fetchComments(req.params.id);

    setCached(cacheKey, video);
    res.json({ video });
  } catch (err) {
    res.status(502).json({ message: err.message });
  }
});

/**
 * GET /api/youtube/channels/:id
 * Real channel details (banner, avatar, subscriber count).
 */
router.get('/channels/:id', async (req, res) => {
  if (!requireApiKey(res)) return;
  const cacheKey = `channel_${req.params.id}`;
  try {
    const cached = getCached(cacheKey);
    if (cached) return res.json({ channel: cached });

    const data = await youtubeFetch('/channels', {
      part: 'snippet,statistics,brandingSettings',
      id: req.params.id
    });
    if (!data.items || data.items.length === 0) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const ch = data.items[0];
    const subs = parseInt(ch.statistics?.subscriberCount || 0, 10);
    let subsText = '';
    if (subs >= 1_000_000) subsText = `${(subs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M subscribers`;
    else if (subs >= 1000) subsText = `${(subs / 1000).toFixed(1).replace(/\.0$/, '')}K subscribers`;
    else if (subs > 0) subsText = `${subs} subscribers`;

    const channel = {
      channelId: ch.id,
      name: ch.snippet?.title || 'YouTube Channel',
      handle: ch.snippet?.customUrl || '',
      avatarUrl: ch.snippet?.thumbnails?.high?.url || '',
      bannerUrl:
        ch.brandingSettings?.image?.bannerExternalUrl || '',
      description: ch.snippet?.description || '',
      subscribers: subs,
      subscriberCountText: subsText,
      videoCount: parseInt(ch.statistics?.videoCount || 0, 10)
    };

    setCached(cacheKey, channel);
    res.json({ channel });
  } catch (err) {
    res.status(502).json({ message: err.message });
  }
});

/**
 * GET /api/youtube/channels/:id/videos
 * A real channel's uploads.
 */
router.get('/channels/:id/videos', async (req, res) => {
  if (!requireApiKey(res)) return;
  const cacheKey = `channelvideos_${req.params.id}_${req.query.maxResults || 24}`;
  try {
    const cached = getCached(cacheKey);
    if (cached) return res.json({ videos: cached });

    // Resolve the channel's "uploads" playlist
    const chData = await youtubeFetch('/channels', {
      part: 'contentDetails',
      id: req.params.id
    });
    const uploadsPlaylist =
      chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylist) return res.json({ videos: [] });

    const playlist = await youtubeFetch('/playlistItems', {
      part: 'snippet,contentDetails',
      playlistId: uploadsPlaylist,
      maxResults: Math.min(parseInt(req.query.maxResults || 24, 10), 50)
    });
    const ids = (playlist.items || [])
      .map((i) => i.contentDetails?.videoId)
      .filter(Boolean);
    if (ids.length === 0) return res.json({ videos: [] });

    const details = await youtubeFetch('/videos', {
      part: 'snippet,statistics,contentDetails',
      id: ids.join(',')
    });

    const channelMap = await fetchChannels([req.params.id]);
    const videos = (details.items || []).map((item) => mapToAppVideo(item, channelMap));

    setCached(cacheKey, videos);
    res.json({ videos });
  } catch (err) {
    res.status(502).json({ message: err.message });
  }
});

/**
 * GET /api/youtube/category/:categoryId
 * Category-filtered feed (e.g. Music=10, Gaming=20, Sports=17).
 */
router.get('/category/:categoryId', async (req, res) => {
  if (!requireApiKey(res)) return;
  const cacheKey = `category_${req.params.categoryId}_${req.query.regionCode || DEFAULT_REGION}`;
  try {
    const cached = getCached(cacheKey);
    if (cached) return res.json({ videos: cached });

    const data = await youtubeFetch('/videos', {
      part: 'snippet,statistics,contentDetails',
      chart: 'mostPopular',
      videoCategoryId: req.params.categoryId,
      regionCode: req.query.regionCode || DEFAULT_REGION,
      maxResults: Math.min(parseInt(req.query.maxResults || 24, 10), 50)
    });

    const channelMap = await fetchChannels((data.items || []).map((i) => i.snippet?.channelId));
    const videos = (data.items || []).map((item) => mapToAppVideo(item, channelMap));

    setCached(cacheKey, videos);
    res.json({ videos });
  } catch (err) {
    res.status(502).json({ message: err.message });
  }
});

export default router;
