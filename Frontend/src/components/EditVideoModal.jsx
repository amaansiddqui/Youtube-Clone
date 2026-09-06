/**
 * Edit Video Modal
 * Allows channel owners to modify an existing video's title, description,
 * topic category, and custom thumbnail image.
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateVideo } from '../utils/videoService';

import { updateVideoThunk } from '../store/slices/videoSlice';

const CATEGORIES = [
  'All',
  'React',
  'JavaScript',
  'Web Development',
  'Vite',
  'CSS',
  'Tools',
  'Next.js',
  'Music',
  'Computer programming',
  'General'
];

export default function EditVideoModal({
  isOpen,
  video,
  onClose,
  onVideoUpdated
}) {
  const dispatch = useDispatch();
  const [title, setTitle] = useState(video?.title || '');
  const [description, setDescription] = useState(video?.description || '');
  const [category, setCategory] = useState(video?.category || 'React');
  const [thumbnailUrl, setThumbnailUrl] = useState(video?.thumbnailUrl || '');
  const [duration, setDuration] = useState(video?.duration || '10:00');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !video) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fields = {
        title: title.trim(),
        description: description.trim(),
        category,
        thumbnailUrl: thumbnailUrl.trim() || video.thumbnailUrl,
        duration: duration.trim() || video.duration
      };
      const updated = updateVideo(video.videoId, fields);
      dispatch(updateVideoThunk({ videoId: video.videoId, fields }));

      setIsSubmitting(false);
      onClose();
      if (onVideoUpdated) {
        onVideoUpdated(updated);
      }
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to update video.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-xl bg-[#212121] text-white rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-video-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <h2 id="edit-video-title" className="text-lg font-bold">
            Edit video details
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-xl leading-none"
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3.5 py-2.5 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-video-title-input" className="text-xs font-medium text-neutral-300">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="edit-video-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title that describes your video"
              maxLength={120}
              required
              className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg px-3.5 py-2 text-sm text-white placeholder-neutral-500 outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-video-desc-input" className="text-xs font-medium text-neutral-300">
              Description
            </label>
            <textarea
              id="edit-video-desc-input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your video"
              className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg px-3.5 py-2 text-sm text-white placeholder-neutral-500 outline-none transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Category & Duration row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-video-category-select" className="text-xs font-medium text-neutral-300">
                Category
              </label>
              <select
                id="edit-video-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg px-3 py-2 text-sm text-white outline-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#212121] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-video-duration-input" className="text-xs font-medium text-neutral-300">
                Duration (e.g. 15:30)
              </label>
              <input
                id="edit-video-duration-input"
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="10:00"
                className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg px-3.5 py-2 text-sm text-white placeholder-neutral-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Thumbnail URL & Preview */}
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-video-thumbnail-input" className="text-xs font-medium text-neutral-300">
              Thumbnail URL
            </label>
            <input
              id="edit-video-thumbnail-input"
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg px-3.5 py-2 text-sm text-white placeholder-neutral-500 outline-none transition-colors"
            />

            {/* Thumbnail Preview */}
            <div className="flex items-center gap-3 mt-1 p-2 bg-[#171717] rounded-lg border border-white/10">
              <div className="w-28 aspect-video rounded overflow-hidden bg-black shrink-0">
                <img
                  src={thumbnailUrl || video.thumbnailUrl}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80';
                  }}
                />
              </div>
              <span className="text-xs text-neutral-400">
                Thumbnail preview displayed in video search & recommendations
              </span>
            </div>
          </div>

          {/* Footer Actions */}
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
              disabled={isSubmitting || !title.trim()}
              className="px-6 py-2 rounded-full text-sm font-semibold bg-[#3ea6ff] hover:bg-[#65b8ff] text-black transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
