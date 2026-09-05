import { useState } from 'react';
import { updateChannel } from '../utils/channelService';
import { getSafeBanner } from '../utils/formatters';

const PRESET_BANNERS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80'
];

export default function CustomizeChannelModal({
  isOpen,
  channel,
  onClose,
  onChannelUpdated
}) {
  const [channelName, setChannelName] = useState(channel?.channelName || '');
  const [description, setDescription] = useState(channel?.description || '');
  const [bannerUrl, setBannerUrl] = useState(channel?.channelBanner || '');
  const [avatarUrl, setAvatarUrl] = useState(channel?.avatarUrl || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !channel) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!channelName.trim()) {
      setError('Channel name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = updateChannel(channel.channelId, {
        channelName: channelName.trim(),
        description: description.trim(),
        channelBanner: bannerUrl.trim() || channel.channelBanner,
        avatarUrl: avatarUrl.trim() || channel.avatarUrl
      });

      setIsSubmitting(false);
      onClose();
      if (onChannelUpdated) {
        onChannelUpdated(updated);
      }
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to update channel.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-xl max-h-[88vh] bg-[#212121] text-white rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customize-channel-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 id="customize-channel-title" className="text-lg font-bold text-white">
              Channel customization
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Customize your channel profile, branding, and basic information
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xl leading-none"
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="p-6 overflow-y-auto flex flex-col gap-6 flex-1">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2.5 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}

            {/* Banner Preview & URL */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-neutral-200">
                Banner image
              </label>
              <p className="text-xs text-neutral-400 -mt-1">
                This image will appear across the top of your channel page.
              </p>

              <div className="w-full aspect-[4/1] rounded-xl overflow-hidden bg-neutral-900 border border-white/15 relative mt-1">
                <img
                  src={getSafeBanner(bannerUrl || channel.channelBanner)}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = PRESET_BANNERS[0];
                  }}
                />
              </div>

              {/* Quick banner presets */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-medium text-neutral-400">Presets:</span>
                {PRESET_BANNERS.map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setBannerUrl(preset)}
                    className={`w-7 h-7 rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                      bannerUrl === preset
                        ? 'border-[#3ea6ff] scale-105'
                        : 'border-white/20 hover:border-white/50'
                    }`}
                    title={`Preset ${idx + 1}`}
                  >
                    <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="Or enter a custom banner image URL (https://...)"
                className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none transition-colors mt-1.5"
              />
            </div>

            {/* Picture / Avatar */}
            <div className="flex flex-col gap-2.5 pt-5 border-t border-white/10">
              <label className="text-xs font-semibold text-neutral-200">
                Profile picture
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-800 border-2 border-white/20 shrink-0 shadow">
                  <img
                    src={
                      avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        channelName || channel.channelName
                      )}`
                    }
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Profile picture URL (optional)"
                    className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg px-3.5 py-2 text-xs text-white placeholder-neutral-500 outline-none transition-colors"
                  />
                  <span className="text-[11px] text-neutral-400">
                    Recommended square image, at least 98 x 98 pixels.
                  </span>
                </div>
              </div>
            </div>

            {/* Basic Info: Channel Name */}
            <div className="flex flex-col gap-1.5 pt-5 border-t border-white/10">
              <label htmlFor="custom-channel-name" className="text-xs font-semibold text-neutral-200">
                Channel name <span className="text-red-400">*</span>
              </label>
              <input
                id="custom-channel-name"
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Your channel name"
                maxLength={60}
                required
                className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition-colors"
              />
            </div>

            {/* Channel Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="custom-channel-desc" className="text-xs font-semibold text-neutral-200">
                Description
              </label>
              <textarea
                id="custom-channel-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your channel and what kinds of videos they can expect..."
                className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg p-3 text-sm text-white placeholder-neutral-500 outline-none transition-colors resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Fixed Footer Actions */}
          <div className="px-6 py-4 bg-[#1b1b1b] border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !channelName.trim()}
              className="px-6 py-2 rounded-full text-sm font-semibold bg-[#3ea6ff] hover:bg-[#65b8ff] text-black transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
