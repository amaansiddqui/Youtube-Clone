import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    channels: [{ type: String }],
    likedVideos: [{ type: String, default: [] }],
    dislikedVideos: [{ type: String, default: [] }]
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
