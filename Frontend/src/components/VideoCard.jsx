import { useState } from 'react';
import { formatViews, formatTimeAgo, getSafeThumbnail } from '../utils/formatters';
import { VerifiedIcon, MoreVerticalIcon } from './Icons';

export default function VideoCard({ video, index = 0 }) {
  const [imgError, setImgError] = useState(false);

  const initialThumb = getSafeThumbnail(video.thumbnailUrl, index);
  const [currentThumb, setCurrentThumb] = useState(initialThumb);

  const handleImageError = () => {
    if (!imgError) {
      setImgError(true);
      setCurrentThumb('https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80');
    }
  };

  const channelTitle = video.channelName || video.uploader || 'YouTube Creator';
  const timeAgo = formatTimeAgo(video.uploadDate);
  const formattedViews = formatViews(video.views);
  const duration = video.duration || '15:30';

  // Generate channel initial letter for fallback avatar
  const channelLetter = channelTitle.charAt(0).toUpperCase();

  return (
    <div className="yt-video-card flex flex-col cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-[#3ea6ff] rounded-xl" tabIndex={0}>
      {/* Thumbnail container */}
      <div className="yt-thumbnail-wrapper relative w-full aspect-video rounded-xl overflow-hidden bg-[#272727]">
        <img
          src={currentThumb}
          alt={video.title}
          className="yt-thumbnail-img w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200 block"
          loading="lazy"
          onError={handleImageError}
        />
        <div className="yt-video-duration absolute bottom-2 right-2 bg-black/85 text-white text-xs font-medium px-1.5 py-0.5 rounded tracking-wide leading-none">
          {duration}
        </div>
      </div>

      {/* Video metadata container */}
      <div className="yt-card-details flex gap-3 mt-3 items-start">
        <div className="yt-card-avatar-wrapper shrink-0 w-9 h-9 rounded-full overflow-hidden bg-[#333]">
          {video.avatarUrl ? (
            <img
              src={video.avatarUrl}
              alt={channelTitle}
              className="yt-card-avatar-img w-full h-full object-cover block"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="yt-card-avatar-placeholder w-full h-full flex items-center justify-center bg-gradient-to-br from-[#cc0000] to-[#aa3bff] text-white text-sm font-bold">
              {channelLetter}
            </div>
          )}
        </div>

        <div className="yt-card-info flex-1 min-w-0">
          <h3 className="yt-card-title text-white font-medium text-[15px] leading-snug line-clamp-2 mb-1" title={video.title}>
            {video.title}
          </h3>

          <div className="yt-card-channel-row flex items-center gap-1 mb-0.5">
            <span className="yt-card-channel-name text-[#aaa] hover:text-white text-[13px] truncate" title={channelTitle}>
              {channelTitle}
            </span>
            <VerifiedIcon size={14} className="yt-verified-badge shrink-0" />
          </div>

          <div className="yt-card-meta text-[#aaa] text-[13px] flex items-center gap-1">
            <span className="yt-card-views">{formattedViews}</span>
            {timeAgo && <span className="yt-meta-dot text-[10px]">&bull;</span>}
            {timeAgo && <span className="yt-card-time">{timeAgo}</span>}
          </div>
        </div>

        <button className="yt-card-more-btn bg-transparent border-none text-white opacity-0 group-hover:opacity-100 hover:bg-white/10 p-1 rounded-full cursor-pointer transition-all shrink-0" aria-label="Action menu">
          <MoreVerticalIcon size={16} />
        </button>
      </div>
    </div>
  );
}
