import mongoose from 'mongoose';

/**
 * Channel Schema definition for MongoDB.
 * Manages creator profiles, visual branding (banner & avatar),
 * subscriber counts, and an array of published video IDs.
 */
const channelSchema = new mongoose.Schema(
  {
    channelId: { type: String, required: true, unique: true, index: true },
    channelName: { type: String, required: true, trim: true },
    owner: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    channelBanner: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    subscribers: { type: Number, default: 0 },
    videos: [{ type: String }]
  },
  { timestamps: true }
);

const Channel = mongoose.model('Channel', channelSchema);
export default Channel;

