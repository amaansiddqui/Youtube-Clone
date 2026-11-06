import VideoCard from './VideoCard';

export default function VideoGrid({
  videos,
  isLoading = false,
  error = null,
  onRetry,
  onResetFilter,
  onSelectVideo,
  onNavigateChannel
}) {

  if (isLoading) {
    return (
      <div className="yt-video-grid yt-video-grid-loading" role="status" aria-label="Loading YouTube videos">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="yt-video-skeleton" key={index}>
            <div className="yt-video-skeleton-thumbnail" />
            <div className="yt-video-skeleton-details">
              <span />
              <span />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="yt-empty-grid flex flex-col items-center justify-center py-20 px-4 text-center" role="alert">
        <div className="yt-empty-icon text-5xl mb-4">⚠️</div>
        <h3 className="yt-empty-title text-xl font-medium mb-2 text-white">Could not load YouTube videos</h3>
        <p className="yt-empty-text text-[#aaa] text-sm mb-5">{error}</p>
        {onRetry && (
          <button className="yt-empty-reset-btn cursor-pointer" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="yt-empty-grid flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="yt-empty-icon text-5xl mb-4">📺</div>
        <h3 className="yt-empty-title text-xl font-medium mb-2 text-white">No videos found</h3>
        <p className="yt-empty-text text-[#aaa] text-sm mb-5">Try searching for something else or clearing the active filter.</p>
        {onResetFilter && (
          <button className="yt-empty-reset-btn bg-white hover:bg-neutral-200 text-black px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer" onClick={onResetFilter}>
            Reset filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="yt-video-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
      {videos.map((video, idx) => (
        <VideoCard
          key={video.videoId || idx}
          style={{ '--video-card-delay': `${Math.min(idx * 35, 280)}ms` }}
          video={video}
          index={idx}
          onSelectVideo={onSelectVideo}
          onNavigateChannel={onNavigateChannel}
        />
      ))}
    </div>
  );
}
