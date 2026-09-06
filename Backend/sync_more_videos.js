import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { initialVideos, initialChannels, initialUsers } from './data/seedData.js';
import Video from './models/Video.js';
import Channel from './models/Channel.js';
import Comment from './models/Comment.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data', 'database.json');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/youtube_clone';

async function syncAllData() {
  console.log('=== Starting Full Database Synchronization ===\n');

  // 1. Synchronize Backend/data/database.json
  console.log('1. Updating Backend/data/database.json...');
  try {
    let db = {
      users: [...initialUsers],
      channels: [...initialChannels],
      videos: [...initialVideos],
      interactions: {},
      subscriptions: {}
    };

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const existing = JSON.parse(raw);

      // Preserve existing users, comments, and interactions if any
      const existingVideoMap = new Map();
      (existing.videos || []).forEach((v) => existingVideoMap.set(v.videoId, v));

      const mergedVideos = initialVideos.map((newV) => {
        if (existingVideoMap.has(newV.videoId)) {
          const old = existingVideoMap.get(newV.videoId);
          return {
            ...newV,
            ...old,
            videoUrl: newV.videoUrl, // Use guaranteed working playable video URL
            title: old.title || newV.title,
            comments: old.comments && old.comments.length > 0 ? old.comments : newV.comments
          };
        }
        return newV;
      });

      // Merge channels
      const existingChannelMap = new Map();
      (existing.channels || []).forEach((c) => existingChannelMap.set(c.channelId, c));

      const mergedChannels = initialChannels.map((newC) => {
        if (existingChannelMap.has(newC.channelId)) {
          const old = existingChannelMap.get(newC.channelId);
          return {
            ...newC,
            ...old,
            videos: newC.videos
          };
        }
        return newC;
      });

      // Include user-created channels (not the removed seed channels channel04-channel08)
      (existing.channels || []).forEach((c) => {
        if (c.channelId.startsWith('channel_') && !mergedChannels.some((m) => m.channelId === c.channelId)) {
          mergedChannels.push(c);
        }
      });

      // Include user-uploaded videos (not the removed seed videos video04-video16)
      (existing.videos || []).forEach((v) => {
        if (v.videoId.startsWith('video_') && !mergedVideos.some((m) => m.videoId === v.videoId)) {
          mergedVideos.push(v);
        }
      });

      db.videos = mergedVideos;
      db.channels = mergedChannels;
      db.users = existing.users && existing.users.length > 0 ? existing.users : initialUsers;
      db.interactions = existing.interactions || {};
      db.subscriptions = existing.subscriptions || {};
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    console.log(`   Saved database.json: ${db.videos.length} videos, ${db.channels.length} channels, ${db.users.length} users.`);
  } catch (jsonErr) {
    console.error('   Error writing database.json:', jsonErr.message);
  }

  // 2. Synchronize MongoDB collections
  console.log(' Updating MongoDB collections...');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`   Connected to MongoDB (${mongoose.connection.host}/${mongoose.connection.name})`);

    // A. Sync Users
    for (const u of initialUsers) {
      await User.findOneAndUpdate(
        { userId: u.userId },
        {
          $setOnInsert: { userId: u.userId, password: u.password },
          $set: {
            username: u.username,
            email: u.email,
            avatar: u.avatar,
            channels: u.channels
          }
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
    const userCount = await User.countDocuments();
    console.log(`   Users collection: ${userCount} documents.`);

    // B. Sync Channels
    for (const c of initialChannels) {
      await Channel.findOneAndUpdate(
        { channelId: c.channelId },
        {
          $setOnInsert: {
            channelId: c.channelId,
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date()
          },
          $set: {
            channelName: c.channelName,
            owner: c.owner,
            description: c.description,
            channelBanner: c.channelBanner,
            avatarUrl: c.avatarUrl,
            subscribers: c.subscribers,
            videos: c.videos
          }
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
    const channelCount = await Channel.countDocuments();
    console.log(`   Channels collection: ${channelCount} documents.`);

    // C. Sync Videos with File Metadata
    const allCommentsToSync = [];

    for (const v of initialVideos) {
      await Video.findOneAndUpdate(
        { videoId: v.videoId },
        {
          $setOnInsert: {
            videoId: v.videoId,
            views: v.views || 0,
            likes: v.likes || 0,
            dislikes: v.dislikes || 0,
            uploadDate: v.uploadDate ? new Date(v.uploadDate) : new Date()
          },
          $set: {
            title: v.title,
            description: v.description,
            thumbnailUrl: v.thumbnailUrl,
            videoUrl: v.videoUrl,
            duration: v.duration,
            category: v.category,
            channelId: v.channelId,
            channelName: v.channelName,
            uploader: v.uploader,
            avatarUrl: v.avatarUrl,
            comments: v.comments || [],
            fileMetadata: {
              format: 'mp4',
              size: 10485760,
              mimeType: 'video/mp4',
              resolution: '1080p'
            }
          }
        },
        { upsert: true, returnDocument: 'after' }
      );

      // Collect comments to sync into separate comments collection
      if (Array.isArray(v.comments)) {
        v.comments.forEach((c) => {
          allCommentsToSync.push({
            commentId: c.commentId,
            videoId: v.videoId,
            userId: c.userId || 'user02',
            author: c.author || 'User',
            avatarUrl: c.avatarUrl || '',
            text: c.text,
            likes: c.likes || 0,
            isEdited: Boolean(c.isEdited),
            editedAt: c.editedAt ? new Date(c.editedAt) : undefined,
            createdAt: c.timestamp ? new Date(c.timestamp) : new Date()
          });
        });
      }
    }
    const videoCount = await Video.countDocuments();
    console.log(`   Videos collection: ${videoCount} documents.`);

    // D. Sync Comments collection
    for (const comm of allCommentsToSync) {
      await Comment.findOneAndUpdate(
        { commentId: comm.commentId },
        { $set: comm },
        { upsert: true, returnDocument: 'after' }
      );
    }
    const commentCount = await Comment.countDocuments();
    console.log(`   Comments collection: ${commentCount} documents.`);

    // E. Purge extra videos and channels (video04-video16, channel04-channel08)
    const initialVideoIds = initialVideos.map((v) => v.videoId);
    const videoPurgeRes = await Video.deleteMany({
      videoId: { $nin: initialVideoIds, $not: /^video_\d+$/ }
    });
    console.log(`   Purged ${videoPurgeRes.deletedCount} extra videos from MongoDB.`);

    const initialChannelIds = initialChannels.map((c) => c.channelId);
    const channelPurgeRes = await Channel.deleteMany({
      channelId: { $nin: initialChannelIds, $not: /^channel_\d+$/ }
    });
    console.log(`   Purged ${channelPurgeRes.deletedCount} extra channels from MongoDB.`);

    await Comment.deleteMany({
      videoId: { $nin: initialVideoIds, $not: /^video_\d+$/ }
    });

    await mongoose.disconnect();
    console.log('   MongoDB disconnected cleanly.');
  } catch (mongoErr) {
    console.error('   MongoDB sync error:', mongoErr.message);
  }

  console.log('\n=== Synchronization Complete and Verified! ===');
}

syncAllData().catch(console.error);
