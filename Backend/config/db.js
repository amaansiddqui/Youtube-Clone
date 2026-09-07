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

      // Auto-heal placeholder thumbnails (e.g. example.com)
      const brokenThumbs = await Video.find({ thumbnailUrl: { $regex: 'example\\.com' } });
      if (brokenThumbs.length > 0) {
        for (const bt of brokenThumbs) {
          bt.thumbnailUrl = 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1280&q=80';
          await bt.save();
        }
        console.log(`Healed ${brokenThumbs.length} video thumbnails to verified high-res images in MongoDB`);
      }

      // Prune only obsolete legacy seed placeholders if present
      const legacyVideoIds = ['video04', 'video05', 'video06', 'video07', 'video08', 'video09', 'video10', 'video11', 'video12', 'video13', 'video14', 'video15', 'video16'];
      await Video.deleteMany({ videoId: { $in: legacyVideoIds } });
      await Comment.deleteMany({ videoId: { $in: legacyVideoIds } });

      const legacyChannelIds = ['channel04', 'channel05', 'channel06', 'channel07', 'channel08'];
      await Channel.deleteMany({ channelId: { $in: legacyChannelIds } });
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
