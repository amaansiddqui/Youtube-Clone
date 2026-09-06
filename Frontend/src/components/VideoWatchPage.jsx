/**
 * Video Watch Page
 * Full YouTube viewing page layout:
 * - HTML5 / responsive custom VideoPlayer
 * - Title, creator identity badge, and Subscribe button
 * - Combined Like / Dislike reaction pill
 * - Share button with link-copied feedback
 * - Expandable video description box
 * - CommentSection with full CRUD operations
 * - Recommended videos sidebar
 */

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import VideoPlayer from './VideoPlayer';

import CommentSection from './CommentSection';
import { toggleLikeThunk, toggleDislikeThunk } from '../store/slices/videoSlice';
import { toggleSubscribeThunk } from '../store/slices/channelSlice';
import {
  ThumbUpIcon,
  ThumbDownIcon,
  ShareIcon,
  DownloadIcon,
  MoreVerticalIcon,
  VerifiedIcon,
  CheckIcon
} from './Icons';
import { formatViews, formatTimeAgo, getSafeThumbnail } from '../utils/formatters';
import {
  getVideoById,
  getVideos,
  toggleVideoLike,
  toggleVideoDislike,
  getUserVideoInteraction,
  getChannelSubscription,
  toggleChannelSubscription
} from '../utils/videoService';

export default function VideoWatchPage({
  videoId,
  currentUser,
  onNavigateVideo,
  onNavigateHome,
  onNavigateChannel
}) {
  const dispatch = useDispatch();
  const [video, setVideo] = useState(() => getVideoById(videoId));
  const [userStatus, setUserStatus] = useState(() => getUserVideoInteraction(videoId));
  const [isSubscribed, setIsSubscribed] = useState(() => {
    const v = getVideoById(videoId);
    return v ? getChannelSubscription(v.channelId) : false;
  });
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [allVideosList, setAllVideosList] = useState(() => getVideos());

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to database updates from videoService
  useEffect(() => {
    const handleDatabaseUpdate = (e) => {
      const updatedVideoId = e.detail?.videoId;
      if (!updatedVideoId || updatedVideoId === videoId) {
        const fresh = getVideoById(videoId);
        if (fresh) {
          setVideo(fresh);
        }
      }
      setAllVideosList(getVideos());
    };

    window.addEventListener('yt-video-updated', handleDatabaseUpdate);
    return () => window.removeEventListener('yt-video-updated', handleDatabaseUpdate);
  }, [videoId]);

  // Handle Likes
  const handleLikeClick = () => {
    if (!video) return;
    const result = toggleVideoLike(video.videoId);
    if (result) {
      setVideo(result.video);
      setUserStatus(result.userStatus);
      dispatch(toggleLikeThunk(video.videoId));
    }
  };

  // Handle Dislikes
  const handleDislikeClick = () => {
    if (!video) return;
    const result = toggleVideoDislike(video.videoId);
    if (result) {
      setVideo(result.video);
      setUserStatus(result.userStatus);
      dispatch(toggleDislikeThunk(video.videoId));
    }
  };

  // Handle Channel Subscribe
  const handleToggleSubscribe = () => {
    if (!video?.channelId) return;
    const newState = toggleChannelSubscription(video.channelId);
    setIsSubscribed(newState);
    dispatch(toggleSubscribeThunk(video.channelId));
  };

  // Handle Share link copy
  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
      });
    } else {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  if (!video) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Video not found</h2>
        <p className="text-neutral-400 mb-6">The video you are looking for does not exist or has been removed.</p>
        <button
          onClick={onNavigateHome}
          className="px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors cursor-pointer"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const channelTitle = video.channelName || video.uploader || 'YouTube Creator';
  const subscriberCount = video.subscribers || '1.24M';
  const recommendedVideos = allVideosList.filter((v) => v.videoId !== video.videoId);

  return (
    <div className="yt-watch-page w-full min-h-[calc(100vh-3.5rem)] bg-[#0f0f0f] text-white px-3 sm:px-6 lg:px-10 py-6">
      <div className="max-w-[1720px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left / Primary Column: Video Player, Metadata, Description, Comments */}
        <div className="lg:col-span-8 flex flex-col">
          {/* Video Player */}
          <VideoPlayer key={video.videoId} video={video} />

          {/* Video Title */}
          <h1 className="text-lg sm:text-xl font-bold text-white mt-4 mb-2 leading-snug select-text">
            {video.title}
          </h1>

          {/* Video Actions & Channel Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-white/10 select-none">
            {/* Channel Info + Subscribe Button */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-neutral-800 shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                onClick={() => {
                  if (onNavigateChannel && video.channelId) {
                    onNavigateChannel(video.channelId);
                  }
                }}
                title={`Visit ${channelTitle}'s channel`}
              >
                {video.avatarUrl ? (
                  <img
                    src={video.avatarUrl}
                    alt={channelTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-red-600 to-indigo-600 font-bold text-base">
                    {channelTitle.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span
                    className="font-semibold text-white text-sm sm:text-base hover:text-white/80 cursor-pointer"
                    onClick={() => {
                      if (onNavigateChannel && video.channelId) {
                        onNavigateChannel(video.channelId);
                      }
                    }}
                  >
                    {channelTitle}
                  </span>
                  <VerifiedIcon size={14} className="text-[#aaa]" />
                </div>
                <span className="text-xs text-[#aaa]">
                  {subscriberCount} subscribers
                </span>
              </div>

              {/* Subscribe button */}
              <button
                onClick={handleToggleSubscribe}
                className={`ml-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSubscribed
                    ? 'bg-white/15 hover:bg-white/20 text-white'
                    : 'bg-white text-black hover:bg-neutral-200'
                }`}
              >
                {isSubscribed && <CheckIcon size={14} />}
                <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
              </button>
            </div>

            {/* Like, Dislike, Share, Download Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Like / Dislike Combined Pill Button */}
              <div className="flex items-center bg-white/10 hover:bg-white/15 rounded-full h-9 overflow-hidden transition-colors">
                <button
                  onClick={handleLikeClick}
                  className={`flex items-center gap-2 px-3.5 h-full text-xs sm:text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer ${
                    userStatus === 'like' ? 'text-[#3ea6ff]' : 'text-white'
                  }`}
                  title="I like this"
                  aria-label="Like video"
                >
                  <ThumbUpIcon size={18} active={userStatus === 'like'} />
                  <span>{formatViews(video.likes).replace(' views', '')}</span>
                </button>

                <div className="w-[1px] h-5 bg-white/20" />

                <button
                  onClick={handleDislikeClick}
                  className={`flex items-center px-3.5 h-full text-xs sm:text-sm hover:bg-white/10 transition-colors cursor-pointer ${
                    userStatus === 'dislike' ? 'text-[#3ea6ff]' : 'text-white'
                  }`}
                  title="I dislike this"
                  aria-label="Dislike video"
                >
                  <ThumbDownIcon size={18} active={userStatus === 'dislike'} />
                </button>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="relative flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-3.5 h-9 rounded-full text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                title="Share"
              >
                <ShareIcon size={18} />
                <span>Share</span>
                {copiedShare && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[11px] font-semibold px-2 py-0.5 rounded shadow">
                    Link copied!
                  </span>
                )}
              </button>

              {/* Download Button */}
              <button
                onClick={() => alert('Download started for offline playback simulation!')}
                className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-3.5 h-9 rounded-full text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                title="Download"
              >
                <DownloadIcon size={18} />
                <span>Download</span>
              </button>

              {/* More options button */}
              <button
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
                aria-label="More actions"
              >
                <MoreVerticalIcon size={18} />
              </button>
            </div>
          </div>

          {/* Expandable Video Description Box */}
          <div
            onClick={() => setIsDescriptionExpanded((prev) => !prev)}
            className="mt-4 bg-[#272727] hover:bg-[#333] transition-colors rounded-xl p-3 sm:p-4 cursor-pointer select-text"
          >
            <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-white mb-2 select-none">
              <span>{formatViews(video.views)}</span>
              <span>&bull;</span>
              <span>{formatTimeAgo(video.uploadDate)}</span>
              {video.category && (
                <span className="bg-white/10 text-white/90 text-[11px] font-normal px-2 py-0.5 rounded-md">
                  #{video.category}
                </span>
              )}
            </div>

            <p
              className={`text-white text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                !isDescriptionExpanded ? 'line-clamp-3' : ''
              }`}
            >
              {video.description || 'No description provided.'}
            </p>

            <button
              type="button"
              className="text-xs sm:text-sm font-semibold text-white mt-2 inline-block hover:underline cursor-pointer select-none"
              onClick={(e) => {
                e.stopPropagation();
                setIsDescriptionExpanded((prev) => !prev);
              }}
            >
              {isDescriptionExpanded ? 'Show less' : '...more'}
            </button>
          </div>

          {/* Comments Section */}
          <CommentSection
            videoId={video.videoId}
            comments={video.comments || []}
            currentUser={currentUser}
            onCommentUpdated={(updatedVideo) => {
              setVideo(updatedVideo);
            }}
          />
        </div>

        {/* Right / Secondary Column: Up Next / Recommended Videos */}
        <div className="lg:col-span-4 flex flex-col gap-4 mt-6 lg:mt-0">
          <h2 className="text-base font-bold text-white mb-1">Recommended Videos</h2>

          <div className="flex flex-col gap-3">
            {recommendedVideos.map((recVideo) => {
              const recChannel = recVideo.channelName || recVideo.uploader || 'Creator';
              const recThumb = getSafeThumbnail(recVideo.thumbnailUrl);

              return (
                <div
                  key={recVideo.videoId}
                  onClick={() => onNavigateVideo(recVideo.videoId)}
                  className="flex gap-3 group cursor-pointer rounded-xl p-1.5 hover:bg-white/5 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="relative w-40 sm:w-44 aspect-video rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                    <img
                      src={recThumb}
                      alt={recVideo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/85 text-white text-[11px] font-medium px-1 rounded">
                      {recVideo.duration || '12:40'}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-col flex-1 min-w-0 justify-start">
                    <h3 className="text-white text-xs sm:text-sm font-medium line-clamp-2 leading-snug group-hover:text-[#3ea6ff] transition-colors mb-1">
                      {recVideo.title}
                    </h3>
                    <span className="text-[#aaa] text-xs truncate mb-0.5">
                      {recChannel}
                    </span>
                    <div className="text-[#aaa] text-xs flex items-center gap-1">
                      <span>{formatViews(recVideo.views)}</span>
                      <span>&bull;</span>
                      <span>{formatTimeAgo(recVideo.uploadDate)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
