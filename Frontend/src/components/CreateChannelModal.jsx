/**
 * Create Channel Modal
 * Allows an authenticated creator to initialize their official YouTube channel
 * by specifying name, description, and banner artwork.
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createChannel } from '../utils/channelService';
import { createChannelThunk } from '../store/slices/channelSlice';


export default function CreateChannelModal({
  isOpen,
  onClose,
  currentUser,
  onNavigateSignIn,
  onChannelCreated
}) {
  const dispatch = useDispatch();
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80'
  );
  const avatarUrl = currentUser?.avatar || '';
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      setError('You must be signed in to create a channel.');
      return;
    }

    if (!channelName.trim()) {
      setError('Please provide a channel name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const channelData = {
        channelName: channelName.trim(),
        description: description.trim(),
        channelBanner: bannerUrl.trim(),
        avatarUrl: avatarUrl.trim() || currentUser.avatar,
        currentUser
      };
      const newChannel = createChannel(channelData);
      dispatch(createChannelThunk(channelData));

      setIsSubmitting(false);
      onClose();
      if (onChannelCreated) {
        onChannelCreated(newChannel);
      }
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to create channel.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-lg bg-[#212121] text-white rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-channel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 id="create-channel-title" className="text-lg font-bold">
            How you will appear
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-xl leading-none"
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        {!currentUser ? (
          /* Not Signed In Notice */
          <div className="p-6 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl mb-4">
              🔒
            </div>
            <h3 className="text-lg font-semibold mb-2">Sign in to create a channel</h3>
            <p className="text-neutral-400 text-sm mb-6 max-w-sm">
              Creating a channel allows you to upload, customize, and manage your own video library.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateSignIn) onNavigateSignIn();
                }}
                className="px-6 py-2 rounded-full text-sm font-semibold bg-[#3ea6ff] hover:bg-[#65b8ff] text-black transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </div>
        ) : (
          /* Channel Creation Form */
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3.5 py-2.5 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}

            {/* Avatar preview */}
            <div className="flex flex-col items-center gap-3 mb-2">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-neutral-800 border-2 border-white/20">
                <img
                  src={
                    avatarUrl ||
                    currentUser.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      channelName || currentUser.username
                    )}`
                  }
                  alt="Channel Avatar Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80';
                  }}
                />
              </div>
              <span className="text-xs text-neutral-400">Channel picture</span>
            </div>

            {/* Channel Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="create-channel-name" className="text-xs font-medium text-neutral-300">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                id="create-channel-name"
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="e.g. Code with John"
                maxLength={60}
                required
                className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg px-3.5 py-2 text-sm text-white placeholder-neutral-500 outline-none transition-colors"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="create-channel-desc" className="text-xs font-medium text-neutral-300">
                Description
              </label>
              <textarea
                id="create-channel-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your channel and what kinds of videos they can expect..."
                className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg px-3.5 py-2 text-sm text-white placeholder-neutral-500 outline-none transition-colors resize-none"
              />
            </div>

            {/* Banner URL */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="create-channel-banner" className="text-xs font-medium text-neutral-300">
                Banner Image URL (optional)
              </label>
              <input
                id="create-channel-banner"
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg px-3.5 py-2 text-sm text-white placeholder-neutral-500 outline-none transition-colors"
              />
            </div>

            <p className="text-[11px] text-neutral-400 leading-normal mt-1">
              By clicking Create Channel you agree to YouTube Clone’s Terms of Service. Changes made to your name and avatar are visible only on this app.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !channelName.trim()}
                className="px-5 py-2 rounded-full text-sm font-semibold bg-[#3ea6ff] hover:bg-[#65b8ff] text-black transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create channel'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
