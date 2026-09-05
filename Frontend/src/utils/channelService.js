import { getVideos } from './videoService';
import { getUsers, saveUsers } from './auth';

const STORAGE_CHANNELS_KEY = 'yt_channels_database_v2';

export const initialChannels = [
  {
    channelId: "channel01",
    channelName: "Code with John",
    owner: "user01",
    description: "Coding tutorials and tech reviews by John Doe.",
    channelBanner: "https://example.com/banners/john_banner.png",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80",
    subscribers: 5200,
    videos: ["video01", "video02"],
    createdAt: "2024-01-15T00:00:00.000Z"
  },
  {
    channelId: "channel02",
    channelName: "DevMastery",
    owner: "user02",
    description: "Learn how to build complete full-stack web applications and UI clones.",
    channelBanner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80",
    subscribers: 1420000,
    videos: ["video02"],
    createdAt: "2023-11-20T00:00:00.000Z"
  },
  {
    channelId: "channel03",
    channelName: "JS Wizards",
    owner: "user03",
    description: "Modern JavaScript deep dives, clean architecture, and frontend performance.",
    channelBanner: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=1600&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    subscribers: 620000,
    videos: ["video03"],
    createdAt: "2023-08-10T00:00:00.000Z"
  },
  {
    channelId: "channel04",
    channelName: "Frontend Daily",
    owner: "user04",
    description: "Daily insights and tutorials on Vite, tooling, and web trends.",
    channelBanner: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
    subscribers: 310000,
    videos: ["video04"],
    createdAt: "2024-02-01T00:00:00.000Z"
  },
  {
    channelId: "channel05",
    channelName: "Chill Beats Station",
    owner: "user05",
    description: "24/7 lo-fi beats, ambient audio, and background study music.",
    channelBanner: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
    subscribers: 2800000,
    videos: ["video05"],
    createdAt: "2023-05-12T00:00:00.000Z"
  },
  {
    channelId: "channel06",
    channelName: "Design & Code",
    owner: "user06",
    description: "Visual guides for CSS Grid, Flexbox, responsive typography, and animation.",
    channelBanner: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1600&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
    subscribers: 490000,
    videos: ["video06"],
    createdAt: "2024-04-18T00:00:00.000Z"
  },
  {
    channelId: "channel07",
    channelName: "TechCraft",
    owner: "user07",
    description: "Developer tooling, VS Code extensions, and engineering setups.",
    channelBanner: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    subscribers: 715000,
    videos: ["video07"],
    createdAt: "2024-03-05T00:00:00.000Z"
  },
  {
    channelId: "channel08",
    channelName: "NextGen Dev",
    owner: "user08",
    description: "Next.js 15, React Server Components, server actions, and full stack deployments.",
    channelBanner: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=160&q=80",
    subscribers: 530000,
    videos: ["video08"],
    createdAt: "2024-06-25T00:00:00.000Z"
  }
];

function emitChannelUpdate(channelId) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yt-channel-updated', { detail: { channelId } }));
  }
}

/**
 * Retrieve all channels from localStorage
 */
export function getChannels() {
  try {
    const raw = localStorage.getItem(STORAGE_CHANNELS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_CHANNELS_KEY, JSON.stringify(initialChannels));
      return initialChannels;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_CHANNELS_KEY, JSON.stringify(initialChannels));
      return initialChannels;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading channels from storage:', err);
    return initialChannels;
  }
}

/**
 * Save channels to localStorage
 */
export function saveChannels(channels) {
  try {
    localStorage.setItem(STORAGE_CHANNELS_KEY, JSON.stringify(channels));
  } catch (err) {
    console.error('Error saving channels to storage:', err);
  }
}

/**
 * Get channel by ID
 */
export function getChannelById(channelId) {
  if (!channelId) return null;
  const channels = getChannels();
  return channels.find((c) => c.channelId === channelId) || null;
}

/**
 * Get all channels owned by a user ID
 */
export function getChannelsByOwner(userId) {
  if (!userId) return [];
  const channels = getChannels();
  return channels.filter((c) => c.owner === userId);
}

/**
 * Get primary channel for a user (or null if none)
 */
export function getUserPrimaryChannel(userId) {
  const userChannels = getChannelsByOwner(userId);
  return userChannels.length > 0 ? userChannels[0] : null;
}

/**
 * Create a new channel. Only signed-in users can call this!
 */
export function createChannel({
  channelName,
  description = '',
  channelBanner = '',
  avatarUrl = '',
  currentUser
}) {
  if (!currentUser || !currentUser.userId) {
    throw new Error('You must be signed in to create a channel.');
  }

  if (!channelName || !channelName.trim()) {
    throw new Error('Channel name is required.');
  }

  const channels = getChannels();
  const trimmedName = channelName.trim();

  // Create unique channel ID
  const channelId = `channel_${Date.now()}`;

  const newChannel = {
    channelId,
    channelName: trimmedName,
    owner: currentUser.userId,
    description: description.trim() || `Welcome to ${trimmedName}! Official channel for videos and updates.`,
    channelBanner:
      channelBanner.trim() ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
    avatarUrl:
      avatarUrl.trim() ||
      currentUser.avatar ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedName)}&backgroundColor=cc0000,0073e6`,
    subscribers: 0,
    videos: [],
    createdAt: new Date().toISOString()
  };

  channels.push(newChannel);
  saveChannels(channels);

  // Link channel to user record in auth store
  try {
    const users = getUsers();
    const userIndex = users.findIndex((u) => u.userId === currentUser.userId);
    if (userIndex !== -1) {
      const u = users[userIndex];
      const userChannels = Array.isArray(u.channels) ? [...u.channels] : [];
      if (!userChannels.includes(channelId)) {
        userChannels.push(channelId);
        u.channels = userChannels;
        users[userIndex] = u;
        saveUsers(users);
      }
    }
  } catch (err) {
    console.error('Failed to link channel to user profile:', err);
  }

  emitChannelUpdate(channelId);
  return newChannel;
}

/**
 * Update an existing channel
 */
export function updateChannel(channelId, fields) {
  if (!channelId) throw new Error('Channel ID is required.');
  const channels = getChannels();
  const index = channels.findIndex((c) => c.channelId === channelId);
  if (index === -1) throw new Error('Channel not found.');

  const updatedChannel = {
    ...channels[index],
    ...fields,
    updatedAt: new Date().toISOString()
  };

  channels[index] = updatedChannel;
  saveChannels(channels);
  emitChannelUpdate(channelId);
  return updatedChannel;
}

/**
 * Delete a channel and optionally remove its videos
 */
export function deleteChannel(channelId) {
  if (!channelId) throw new Error('Channel ID is required.');
  const channels = getChannels();
  const filtered = channels.filter((c) => c.channelId !== channelId);
  saveChannels(filtered);
  emitChannelUpdate(channelId);
  return true;
}

/**
 * Get all videos that belong to a specific channel
 */
export function getChannelVideos(channelId) {
  if (!channelId) return [];
  const channel = getChannelById(channelId);
  const allVideos = getVideos();

  // Match by video.channelId OR if video ID is in channel.videos array
  return allVideos.filter((video) => {
    if (video.channelId === channelId) return true;
    if (channel && Array.isArray(channel.videos) && channel.videos.includes(video.videoId)) {
      return true;
    }
    return false;
  });
}

/**
 * Remove a video from a channel's videos array
 */
export function removeVideoFromChannel(channelId, videoId) {
  const channel = getChannelById(channelId);
  if (!channel) return;
  const currentVideos = Array.isArray(channel.videos) ? channel.videos : [];
  const updatedVideos = currentVideos.filter((id) => id !== videoId);
  updateChannel(channelId, { videos: updatedVideos });
}

/**
 * Add a video to a channel's videos array
 */
export function addVideoToChannel(channelId, videoId) {
  const channel = getChannelById(channelId);
  if (!channel) return;
  const currentVideos = Array.isArray(channel.videos) ? [...channel.videos] : [];
  if (!currentVideos.includes(videoId)) {
    currentVideos.push(videoId);
    updateChannel(channelId, { videos: currentVideos });
  }
}
