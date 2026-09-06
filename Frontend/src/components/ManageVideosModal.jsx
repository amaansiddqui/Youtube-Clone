/**
 * Manage Videos Modal (YouTube Studio style)
 * Provides a management dashboard for creator channels:
 * - List all uploaded videos with metrics (views, duration, comments)
 * - Search within channel videos
 * - Quick actions: Watch, Edit details, Delete video
 * - Direct trigger for uploading new videos
 */

import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { formatViews, formatTimeAgo, getSafeThumbnail } from '../utils/formatters';

import { EditIcon, TrashIcon, SearchIcon, PlayIcon } from './Icons';
import { deleteVideo } from '../utils/videoService';
import { deleteVideoThunk } from '../store/slices/videoSlice';

export default function ManageVideosModal({
  isOpen,
  channel,
  videos = [],
  onClose,
  onEditVideo,
  onNavigateVideo,
  onOpenUpload,
  onVideoListChanged
}) {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVideos = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        (v.category && v.category.toLowerCase().includes(q))
    );
  }, [videos, searchTerm]);

  if (!isOpen || !channel) return null;

  const handleDelete = (video) => {
    if (window.confirm(`Permanently delete "${video.title}"? This cannot be undone.`)) {
      try {
        deleteVideo(video.videoId);
        dispatch(deleteVideoThunk(video.videoId));
        if (onVideoListChanged) onVideoListChanged();
      } catch (err) {
        console.error('Failed to delete video:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-4xl bg-[#212121] text-white rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-videos-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 id="manage-videos-title" className="text-lg font-bold flex items-center gap-2">
              <span>Channel content</span>
              <span className="text-xs bg-white/10 text-neutral-300 font-normal px-2 py-0.5 rounded-full">
                {videos.length} {videos.length === 1 ? 'video' : 'videos'}
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Manage your channel’s public uploads, edit details, or remove videos
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-xl"
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between gap-4 flex-wrap bg-[#1a1a1a]">
          {/* Search in channel */}
          <div className="flex items-center gap-2 bg-[#121212] border border-white/15 focus-within:border-[#3ea6ff] rounded-lg px-3 py-1.5 w-full max-w-xs transition-colors">
            <SearchIcon size={16} className="text-neutral-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by title or category..."
              className="bg-transparent text-xs text-white placeholder-neutral-500 outline-none w-full"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-neutral-400 hover:text-white text-sm cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          <button
            onClick={() => {
              onClose();
              if (onOpenUpload) onOpenUpload();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3ea6ff] hover:bg-[#65b8ff] text-black text-xs font-semibold rounded-full transition-colors cursor-pointer ml-auto"
          >
            <span>+ Upload new video</span>
          </button>
        </div>

        {/* Videos Table / List */}
        <div className="overflow-y-auto flex-1">
          {filteredVideos.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 text-sm">
              {searchTerm ? 'No videos matching your search filter.' : 'No videos uploaded to this channel yet.'}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#181818] text-neutral-400 border-b border-white/10 sticky top-0 z-10 font-semibold">
                <tr>
                  <th className="py-3 px-4 min-w-[280px]">Video</th>
                  <th className="py-3 px-3 hidden sm:table-cell">Category</th>
                  <th className="py-3 px-3 hidden md:table-cell">Date</th>
                  <th className="py-3 px-3 text-right">Views</th>
                  <th className="py-3 px-3 text-right hidden sm:table-cell">Likes</th>
                  <th className="py-3 px-3 text-right hidden md:table-cell">Comments</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredVideos.map((vid, idx) => {
                  const thumb = getSafeThumbnail(vid.thumbnailUrl, idx);

                  return (
                    <tr key={vid.videoId} className="hover:bg-white/5 transition-colors group">
                      {/* Video info */}
                      <td className="py-3 px-4">
                        <div className="flex gap-3 items-center">
                          <div
                            onClick={() => {
                              onClose();
                              if (onNavigateVideo) onNavigateVideo(vid.videoId);
                            }}
                            className="relative w-24 aspect-video rounded overflow-hidden bg-neutral-800 shrink-0 cursor-pointer"
                          >
                            <img src={thumb} alt={vid.title} className="w-full h-full object-cover" />
                            <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1 rounded text-white">
                              {vid.duration || '10:00'}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              onClick={() => {
                                onClose();
                                if (onNavigateVideo) onNavigateVideo(vid.videoId);
                              }}
                              className="font-semibold text-white line-clamp-2 hover:text-[#3ea6ff] cursor-pointer"
                              title={vid.title}
                            >
                              {vid.title}
                            </p>
                            <span className="text-[11px] text-neutral-400 line-clamp-1">
                              {vid.description || 'No description'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 hidden sm:table-cell">
                        <span className="bg-white/10 text-neutral-300 px-2 py-0.5 rounded text-[11px]">
                          {vid.category || 'General'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-neutral-400 hidden md:table-cell whitespace-nowrap">
                        {formatTimeAgo(vid.uploadDate)}
                      </td>

                      {/* Views */}
                      <td className="py-3 px-3 text-right text-neutral-300 font-mono">
                        {formatViews(vid.views).replace(' views', '')}
                      </td>

                      {/* Likes */}
                      <td className="py-3 px-3 text-right text-neutral-300 font-mono hidden sm:table-cell">
                        {Number(vid.likes || 0).toLocaleString()}
                      </td>

                      {/* Comments */}
                      <td className="py-3 px-3 text-right text-neutral-300 font-mono hidden md:table-cell">
                        {Array.isArray(vid.comments) ? vid.comments.length : 0}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              onClose();
                              if (onNavigateVideo) onNavigateVideo(vid.videoId);
                            }}
                            className="p-1.5 rounded hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                            title="Watch on YouTube"
                          >
                            <PlayIcon size={14} />
                          </button>
                          <button
                            onClick={() => onEditVideo(vid)}
                            className="p-1.5 rounded hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                            title="Edit details"
                          >
                            <EditIcon size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(vid)}
                            className="p-1.5 rounded hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                            title="Delete permanently"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <span>Showing {filteredVideos.length} of {videos.length} videos</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
