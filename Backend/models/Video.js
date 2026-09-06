import mongoose from 'mongoose';

/**
 * Video Schema definition for MongoDB.
 * Captures video metadata, file format specs, engagement statistics,
 * and embedded comment threads for rapid single-query retrieval.
 */
const videoSchema = new mongoose.Schema(
  {
    videoId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    thumbnailUrl: { type: String, required: true },
    videoUrl: { type: String, required: true },
    duration: { type: String, default: '10:00' },
    // Video asset file specifications
    fileMetadata: {
      format: { type: String, default: 'mp4' },
      size: { type: Number, default: 0 },
      mimeType: { type: String, default: 'video/mp4' },
      resolution: { type: String, default: '1080p' }
    },
    category: { type: String, default: 'General', index: true },
    channelId: { type: String, required: true, index: true },
    channelName: { type: String, default: 'Creator' },
    uploader: { type: String, default: 'Creator' },
    avatarUrl: { type: String, default: '' },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    uploadDate: { type: Date, default: Date.now },
    // Embedded comments for quick access on video watch pages
    comments: [
      {
        commentId: { type: String, required: true },
        userId: { type: String, required: true },
        author: { type: String, default: 'You' },
        avatarUrl: { type: String, default: '' },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        likes: { type: Number, default: 0 },
        isEdited: { type: Boolean, default: false },
        editedAt: { type: Date }
      }
    ]
  },
  { timestamps: true }
);

const Video = mongoose.model('Video', videoSchema);
export default Video;

