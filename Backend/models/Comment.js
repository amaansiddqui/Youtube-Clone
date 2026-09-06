import mongoose from 'mongoose';

/**
 * Comment Schema definition for MongoDB.
 * Represents a comment posted on a video, tracking author details,
 * like counts, and edit status/timestamps.
 */
const commentSchema = new mongoose.Schema(
  {
    commentId: { type: String, required: true, unique: true, index: true },
    videoId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    author: { type: String, default: 'You' },
    avatarUrl: { type: String, default: '' },
    text: { type: String, required: true, trim: true },
    likes: { type: Number, default: 0 },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date }
  },
  { timestamps: true }
);

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;

