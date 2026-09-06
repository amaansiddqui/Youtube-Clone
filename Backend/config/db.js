import mongoose from 'mongoose';
import User from '../models/User.js';
import Channel from '../models/Channel.js';
import Video from '../models/Video.js';
import Comment from '../models/Comment.js';
import { initialUsers, initialChannels, initialVideos } from '../data/seedData.js';

// Default MongoDB URI fallback for local development
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/youtube_clone';

/**
 * Establishes a connection to the MongoDB database.
 * If connection fails, it catches the error and logs a friendly notice,
 * allowing the application to continue running using the JSON database fallback.
 */
export async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // If this is a fresh database without data, seed it with sample YouTube videos, channels, and users
    await seedDatabaseIfNeeded();

    return conn;
  } catch (err) {
    console.warn(`MongoDB Connection Notice: ${err.message}. Using JSON database fallback.`);
    // We intentionally return null instead of crashing the process,
    // so developers without MongoDB installed can still run the app smoothly.
    return null;
  }
}

/**
 * Automatically seeds initial collections if the database is currently empty.
 * This guarantees the frontend always has realistic videos and channels to display.
 */
async function seedDatabaseIfNeeded() {
  try {
    // 1. Seed Users if empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.insertMany(initialUsers);
      console.log('Seeded initial Users into MongoDB collection');
    }

    // 2. Seed Channels if empty
    const channelCount = await Channel.countDocuments();
    if (channelCount === 0) {
      await Channel.insertMany(initialChannels);
      console.log('Seeded initial Channels into MongoDB collection');
    }

    // 3. Seed Videos if empty
    const videoCount = await Video.countDocuments();
    if (videoCount === 0) {
      await Video.insertMany(initialVideos);
      console.log('Seeded initial Videos into MongoDB collection with file metadata');
    } else {
      // Auto-heal existing collection: update any legacy unplayable media.w3.org URLs
      const brokenVideos = await Video.find({ videoUrl: { $regex: 'media\\.w3\\.org' } });
      if (brokenVideos.length > 0) {
        const freshMap = new Map(initialVideos.map((iv) => [iv.videoId, iv.videoUrl]));
        for (const bv of brokenVideos) {
          if (freshMap.has(bv.videoId)) {
            bv.videoUrl = freshMap.get(bv.videoId);
            await bv.save();
          }
        }
        console.log(`Healed ${brokenVideos.length} video streams to verified playable URLs in MongoDB`);
      }

      // Prune removed moreVideos (video04-video16) and channels (channel04-channel08)
      const validVideoIds = initialVideos.map((v) => v.videoId);
      await Video.deleteMany({ videoId: { $nin: validVideoIds, $not: /^video_\d+$/ } });
      await Comment.deleteMany({ videoId: { $nin: validVideoIds, $not: /^video_\d+$/ } });

      const validChannelIds = initialChannels.map((c) => c.channelId);
      await Channel.deleteMany({ channelId: { $nin: validChannelIds, $not: /^channel_\d+$/ } });
    }

    // 4. Seed Comments collection from initial videos comments
    const commentCount = await Comment.countDocuments();
    if (commentCount === 0) {
      const allComments = [];
      initialVideos.forEach((v) => {
        if (Array.isArray(v.comments)) {
          v.comments.forEach((c) => {
            allComments.push({
              commentId: c.commentId,
              videoId: v.videoId,
              userId: c.userId,
              author: c.author || 'User',
              avatarUrl: c.avatarUrl || '',
              text: c.text,
              likes: c.likes || 0,
              timestamp: c.timestamp ? new Date(c.timestamp) : new Date()
            });
          });
        }
      });
      if (allComments.length > 0) {
        await Comment.insertMany(allComments);
        console.log(`Seeded ${allComments.length} Comments into MongoDB collection`);
      }
    }
  } catch (seedErr) {
    console.error('Error auto-seeding MongoDB collections:', seedErr.message);
  }
}

export default connectDB;
