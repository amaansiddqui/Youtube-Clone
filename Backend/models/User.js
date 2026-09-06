import mongoose from 'mongoose';

/**
 * User Schema definition for MongoDB.
 * Represents registered users, their credentials, avatar image,
 * and list of owned channel IDs.
 */
const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    channels: [{ type: String }]
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;

