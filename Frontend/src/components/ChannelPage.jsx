/**
 * Creator Channel Page
 * Displays full channel profile:
 * - Wide banner image and circular avatar
 * - Channel handle, subscriber counter, and video count
 * - Owner action buttons ('Customize channel', 'Manage videos', 'Upload video')
 * - Viewer action button ('Subscribe' / 'Subscribed')
 * - Videos tab and About tab
 * - Integrated modals for editing, uploading, and managing videos
 */

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  getChannelById,
  getChannelVideos
} from '../utils/channelService';

import {
  deleteVideo,
  addVideo,
  getChannelSubscription,
  toggleChannelSubscription
} from '../utils/videoService';
import { deleteVideoThunk, addVideoThunk } from '../store/slices/videoSlice';
import { toggleSubscribeThunk } from '../store/slices/channelSlice';
import { formatViews, formatTimeAgo, getSafeThumbnail, getSafeBanner } from '../utils/formatters';
import { VerifiedIcon, CheckIcon, EditIcon, TrashIcon, CreateIcon } from './Icons';
import EditVideoModal from './EditVideoModal';
import CustomizeChannelModal from './CustomizeChannelModal';
import ManageVideosModal from './ManageVideosModal';

export default function ChannelPage({
  channelId,
  currentUser,
  onNavigateVideo,
  onNavigateHome,
  onOpenCreateChannel
}) {
  const dispatch = useDispatch();
  const [channel, setChannel] = useState(() => getChannelById(channelId));
  const [videos, setVideos] = useState(() => getChannelVideos(channelId));
  const [activeTab, setActiveTab] = useState('Videos'); // 'Videos' | 'About'
  const [isSubscribed, setIsSubscribed] = useState(() => getChannelSubscription(channelId));
  const [editingVideo, setEditingVideo] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [copiedChannelLink, setCopiedChannelLink] = useState(false);

  // New video upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCategory, setUploadCategory] = useState('React');
  const [uploadThumbnail, setUploadThumbnail] = useState('');
  const [uploadVideoUrl, setUploadVideoUrl] = useState('https://www.w3schools.com/html/mov_bbb.mp4');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to database updates
  useEffect(() => {
    const handleUpdate = () => {
      const currentChannel = getChannelById(channelId);
      setChannel(currentChannel);
      setVideos(getChannelVideos(channelId));
    };

    window.addEventListener('yt-video-updated', handleUpdate);
    window.addEventListener('yt-channel-updated', handleUpdate);
    return () => {
      window.removeEventListener('yt-video-updated', handleUpdate);
      window.removeEventListener('yt-channel-updated', handleUpdate);
    };
  }, [channelId]);

  if (!channel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-white">
        <div className="text-5xl mb-4">📺</div>
        <h2 className="text-2xl font-bold mb-2">Channel does not exist</h2>
        <p className="text-neutral-400 mb-6">This channel may have been removed or the ID is incorrect.</p>
        <div className="flex gap-4">
          <button
            onClick={onNavigateHome}
            className="px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Return to Home
          </button>
          {currentUser && (
            <button
              onClick={onOpenCreateChannel}
              className="px-6 py-2.5 bg-[#3ea6ff] text-black font-semibold rounded-full hover:bg-[#65b8ff] transition-colors cursor-pointer"
            >
              Create a channel
            </button>
          )}
        </div>
      </div>
    );
  }

  const isOwner = currentUser && currentUser.userId === channel.owner;
  const channelHandle = `@${channel.channelName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const bannerImage = getSafeBanner(channel.channelBanner);
  const totalViews = videos.reduce((sum, v) => sum + (Number(v.views) || 0), 0);

  // Toggle channel subscription
  const handleToggleSubscribe = () => {
    const newState = toggleChannelSubscription(channel.channelId);
    setIsSubscribed(newState);
    dispatch(toggleSubscribeThunk(channel.channelId));
  };

  // Copy channel link
  const handleShareChannel = () => {
    const channelUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(channelUrl).then(() => {
        setCopiedChannelLink(true);
        setTimeout(() => setCopiedChannelLink(false), 2200);
      });
    } else {
      setCopiedChannelLink(true);
      setTimeout(() => setCopiedChannelLink(false), 2200);
    }
  };

  // Delete a video
  const handleDeleteVideo = (video) => {
    if (window.confirm(`Permanently delete "${video.title}"? This cannot be undone.`)) {
      try {
        deleteVideo(video.videoId);
        dispatch(deleteVideoThunk(video.videoId));
        setVideos(getChannelVideos(channel.channelId));
      } catch (err) {
        console.error('Failed to delete video:', err);
      }
    }
  };

  // Upload a new video to this channel
  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    try {
      const vidData = {
        title: uploadTitle.trim(),
        description: uploadDesc.trim(),
        category: uploadCategory,
        thumbnailUrl: uploadThumbnail.trim(),
        videoUrl: uploadVideoUrl.trim(),
        channelId: channel.channelId,
        channelName: channel.channelName,
        uploader: channel.channelName,
        avatarUrl: channel.avatarUrl
      };
      addVideo(vidData);
      dispatch(addVideoThunk(vidData));

      setUploadTitle('');
      setUploadDesc('');
      setUploadThumbnail('');
      setIsUploadModalOpen(false);
      setVideos(getChannelVideos(channel.channelId));
    } catch (err) {
      console.error('Failed to add video:', err);
    }
  };

  return (
    <div className="yt-channel-page w-full min-h-[calc(100vh-3.5rem)] select-none">
      {/* Channel Banner Container */}
      <div className="yt-channel-banner-wrapper">
        <div className="yt-channel-banner-inner">
          <img
            src={bannerImage}
            alt={`${channel.channelName} Banner`}
            className="yt-channel-banner-img"
            onError={(e) => {
              e.currentTarget.src =
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Channel Header Information */}
      <div className="yt-channel-header-container">
        <div className="yt-channel-profile-row">
          {/* Channel Avatar */}
          <div className="yt-channel-avatar-wrapper">
            {channel.avatarUrl ? (
              <img
                src={channel.avatarUrl}
                alt={channel.channelName}
                className="yt-channel-avatar-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#cc0000] to-[#7928ca] text-3xl sm:text-5xl font-bold text-white">
                {channel.channelName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Channel Details & Actions */}
          <div className="flex-1 min-w-0">
            {/* Title & Verified Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="yt-channel-title">
                {channel.channelName}
              </h1>
              <VerifiedIcon size={22} className="text-[#aaa] shrink-0" />
              {isOwner && (
                <span className="bg-white/10 text-[#3ea6ff] border border-[#3ea6ff]/20 text-xs font-medium px-2.5 py-0.5 rounded-full ml-1">
                  Your Channel
                </span>
              )}
            </div>

            {/* Handle & Channel Stats Row */}
            <div className="yt-channel-meta-row">
              <span className="yt-channel-handle">{channelHandle}</span>
              <span>&bull;</span>
              <span>{formatViews(channel.subscribers || 0).replace(' views', '')} subscribers</span>
              <span>&bull;</span>
              <span>{videos.length} {videos.length === 1 ? 'video' : 'videos'}</span>
            </div>

            {/* Description Snippet (clickable to About tab) */}
            <p
              onClick={() => setActiveTab('About')}
              className="yt-channel-desc line-clamp-2"
              title="Click to view full description"
            >
              {channel.description || 'Welcome to my official YouTube channel.'}
              <span className="text-white font-semibold ml-1.5 hover:underline">&gt;</span>
            </p>

            {/* Action buttons */}
            <div className="yt-channel-actions-row">
              {isOwner ? (
                <>
                  <button
                    onClick={() => setIsCustomizeModalOpen(true)}
                    className="yt-owner-pill-btn"
                  >
                    Customize channel
                  </button>
                  <button
                    onClick={() => setIsManageModalOpen(true)}
                    className="yt-owner-pill-btn"
                  >
                    Manage videos
                  </button>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="yt-owner-primary-btn"
                  >
                    <CreateIcon size={16} />
                    <span>Upload video</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleToggleSubscribe}
                  className={`yt-subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
                >
                  {isSubscribed && <CheckIcon size={14} />}
                  <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="yt-channel-tabs mt-4">
          {['Videos', 'About'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`yt-channel-tab ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content: Videos List */}
        {activeTab === 'Videos' && (
          <div className="py-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Uploads ({videos.length})
              </h2>
              {isOwner && (
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="text-xs sm:text-sm text-[#3ea6ff] hover:underline font-medium cursor-pointer"
                >
                  + Add another video
                </button>
              )}
            </div>

            {videos.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center">
                <div className="text-5xl mb-3">🎬</div>
                <h3 className="text-lg font-bold mb-1">No videos yet</h3>
                <p className="text-neutral-400 text-sm mb-5 max-w-sm">
                  {isOwner
                    ? 'Upload your first video to start building your audience!'
                    : 'This channel has not uploaded any videos yet.'}
                </p>
                {isOwner && (
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-5 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 text-sm cursor-pointer shadow"
                  >
                    Upload Video
                  </button>
                )}
              </div>
            ) : (
              <div className="yt-channel-video-grid">
                {videos.map((vid, idx) => {
                  const thumb = getSafeThumbnail(vid.thumbnailUrl, idx);

                  return (
                    <div
                      key={vid.videoId}
                      className="yt-channel-video-card group"
                    >
                      {/* Video Thumbnail */}
                      <div
                        onClick={() => onNavigateVideo(vid.videoId)}
                        className="yt-channel-card-thumb"
                      >
                        <img
                          src={thumb}
                          alt={vid.title}
                          className="yt-channel-card-img"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/85 text-white text-xs font-medium px-1.5 py-0.5 rounded tracking-wide leading-none">
                          {vid.duration || '12:00'}
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="flex flex-col flex-1 justify-between">
                        <div>
                          <h3
                            onClick={() => onNavigateVideo(vid.videoId)}
                            className="yt-channel-card-title hover:text-white"
                            title={vid.title}
                          >
                            {vid.title}
                          </h3>

                          <div className="yt-channel-card-meta">
                            <span>{formatViews(vid.views)}</span>
                            <span className="text-[10px]">&bull;</span>
                            <span>{formatTimeAgo(vid.uploadDate)}</span>
                          </div>
                        </div>

                        {/* Owner Controls: Edit and Delete Buttons */}
                        {isOwner && (
                          <div className="yt-channel-card-actions">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingVideo(vid);
                              }}
                              className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full transition-colors cursor-pointer font-medium"
                              title="Edit video"
                            >
                              <EditIcon size={13} />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteVideo(vid);
                              }}
                              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-full transition-colors cursor-pointer font-medium"
                              title="Delete video"
                            >
                              <TrashIcon size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: About */}
        {activeTab === 'About' && (
          <div className="py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Description & Links */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div>
                <h2 className="text-base font-bold text-white mb-2.5">Description</h2>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap select-text">
                  {channel.description || 'No description provided.'}
                </p>
              </div>

              {channel.channelBanner && (
                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-white mb-2">Channel details</h3>
                  <p className="text-xs text-[#aaa]">
                    For business inquiries or collaborations, contact the channel owner via community links.
                  </p>
                </div>
              )}
            </div>

            {/* Right Statistics Card */}
            <div className="lg:col-span-4 bg-[#181818] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-neutral-400">
                Channel Stats
              </h3>

              <div className="flex flex-col divide-y divide-white/5 text-xs sm:text-sm">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#aaa]">Joined</span>
                  <span className="text-white font-medium">
                    {channel.createdAt ? new Date(channel.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '2024'}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#aaa]">Total views</span>
                  <span className="text-white font-medium">{formatViews(totalViews)}</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#aaa]">Subscribers</span>
                  <span className="text-white font-medium">{formatViews(channel.subscribers || 0).replace(' views', '')}</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#aaa]">Uploads</span>
                  <span className="text-white font-medium">{videos.length} videos</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#aaa]">Channel ID</span>
                  <span className="text-neutral-400 font-mono text-xs truncate max-w-[150px]">{channel.channelId}</span>
                </div>
              </div>

              <button
                onClick={handleShareChannel}
                className="w-full mt-2 py-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm rounded-full transition-colors cursor-pointer text-center relative"
              >
                <span>{copiedChannelLink ? 'Link copied!' : 'Share channel'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Video Modal */}
      {editingVideo && (
        <EditVideoModal
          key={editingVideo.videoId}
          isOpen={Boolean(editingVideo)}
          video={editingVideo}
          onClose={() => setEditingVideo(null)}
          onVideoUpdated={() => {
            setVideos(getChannelVideos(channel.channelId));
          }}
        />
      )}

      {/* Customize Channel Modal */}
      {isCustomizeModalOpen && (
        <CustomizeChannelModal
          key={channel.channelId}
          isOpen={isCustomizeModalOpen}
          channel={channel}
          onClose={() => setIsCustomizeModalOpen(false)}
          onChannelUpdated={(updated) => {
            setChannel(updated);
          }}
        />
      )}

      {/* Manage Videos Modal */}
      {isManageModalOpen && (
        <ManageVideosModal
          key={channel.channelId}
          isOpen={isManageModalOpen}
          channel={channel}
          videos={videos}
          onClose={() => setIsManageModalOpen(false)}
          onEditVideo={(vid) => {
            setIsManageModalOpen(false);
            setEditingVideo(vid);
          }}
          onNavigateVideo={onNavigateVideo}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onVideoListChanged={() => {
            setVideos(getChannelVideos(channel.channelId));
          }}
        />
      )}

      {/* Upload Video Modal (for channel owner) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="w-full max-w-lg bg-[#212121] text-white rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-bold">Upload video to {channel.channelName}</h2>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 overflow-y-auto flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Video Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Modern Full Stack Masterclass"
                  required
                  className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg px-3.5 py-2 text-sm text-white placeholder-neutral-500 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-300">Description</label>
                <textarea
                  rows={3}
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Video description..."
                  className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg px-3.5 py-2 text-sm text-white placeholder-neutral-500 outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-300">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg px-3 py-2 text-sm text-white outline-none cursor-pointer"
                >
                  {['React', 'JavaScript', 'Vite', 'CSS', 'Tools', 'Next.js', 'Music', 'General'].map(
                    (cat) => (
                      <option key={cat} value={cat} className="bg-[#212121] text-white">
                        {cat}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-neutral-300">Thumbnail URL (optional)</label>
                <input
                  type="url"
                  value={uploadThumbnail}
                  onChange={(e) => setUploadThumbnail(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg px-3.5 py-2 text-sm text-white placeholder-neutral-500 outline-none"
                />

                {uploadThumbnail.trim() && (
                  <div className="flex items-center gap-3 p-2 bg-[#171717] rounded-lg border border-white/10">
                    <div className="w-24 aspect-video rounded overflow-hidden bg-black shrink-0">
                      <img
                        src={uploadThumbnail}
                        alt="Upload preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    </div>
                    <span className="text-xs text-neutral-400">Thumbnail preview</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-300">Video Stream URL</label>
                <input
                  type="url"
                  value={uploadVideoUrl}
                  onChange={(e) => setUploadVideoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#121212] border border-white/20 focus:border-[#3ea6ff] rounded-lg px-3.5 py-2 text-sm text-white placeholder-neutral-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 mt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadTitle.trim()}
                  className="px-6 py-2 rounded-full text-sm font-semibold bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Publish video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
