import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Header from './components/Header';
import Chatbot from './components/Chatbot';

import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import VideoGrid from './components/VideoGrid';
import VideoWatchPage from './components/VideoWatchPage';
import ChannelPage from './components/ChannelPage';
import CreateChannelModal from './components/CreateChannelModal';
import AuthPage from './components/AuthPage';

import { selectCurrentUser, setUser, logout } from './store/slices/authSlice';
import {
  selectFilteredVideos,
  selectSelectedCategory,
  selectSearchQuery,
  selectSearchResults,
  setSelectedCategory,
  setSearchQuery,
  fetchVideosThunk,
  youtubeSearchThunk,
  fetchTabFeedThunk,
  selectActiveFeedTab,
  selectTabVideos,
  selectTabLoading,
  selectVideosLoading,
  selectVideoError
} from './store/slices/videoSlice';
import {
  selectUserPrimaryChannel,
  fetchChannelsThunk
} from './store/slices/channelSlice';
import {
  selectIsSidebarOpen,
  selectIsWatchSidebarOpen,
  selectActiveTab,
  selectIsCreateChannelModalOpen,
  toggleSidebar,
  setSidebarOpen,
  toggleWatchSidebar,
  setWatchSidebarOpen,
  setActiveTab,
  setCreateChannelModalOpen
} from './store/slices/uiSlice';

import './App.css';
import { recordWatch } from './utils/activityService';

// Helper to extract video ID from pathname or search params
function extractVideoId(path, search) {
  if (!path) return null;
  if (path.startsWith('/watch')) {
    const params = new URLSearchParams(search || window.location.search);
    const v = params.get('v');
    if (v) return v;
    const parts = path.split('/').filter(Boolean);
    if (parts.length > 1) return parts[1];
  }
  return null;
}

// Helper to extract channel ID from pathname or search params
function extractChannelId(path, search) {
  if (!path) return null;
  if (path.startsWith('/channel')) {
    const params = new URLSearchParams(search || window.location.search);
    const id = params.get('id');
    if (id) return id;
    const parts = path.split('/').filter(Boolean);
    if (parts.length > 1) return parts[1];
  }
  return null;
}

export default function App() {
  const dispatch = useDispatch();

  // Redux state selectors
  const currentUser = useSelector(selectCurrentUser);
  const isSidebarOpen = useSelector(selectIsSidebarOpen);
  const isWatchSidebarOpen = useSelector(selectIsWatchSidebarOpen);
  const activeTab = useSelector(selectActiveTab);
  const isCreateChannelModalOpen = useSelector(selectIsCreateChannelModalOpen);
  const selectedCategory = useSelector(selectSelectedCategory);
  const searchQuery = useSelector(selectSearchQuery);
  const searchResults = useSelector(selectSearchResults);
  const filteredVideos = useSelector(selectFilteredVideos);
  const activeFeedTab = useSelector(selectActiveFeedTab);
  const tabVideos = useSelector(selectTabVideos);
  const tabLoading = useSelector(selectTabLoading);
  const videosLoading = useSelector(selectVideosLoading);
  const videoError = useSelector(selectVideoError);
  const userPrimaryChannel = useSelector(selectUserPrimaryChannel(currentUser?.userId));

  // Local routing state
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');
  const [currentSearch, setCurrentSearch] = useState(() => window.location.search || '');

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setCurrentSearch(window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync videos and channels on mount and when database updates
  useEffect(() => {
    dispatch(fetchVideosThunk());
    dispatch(fetchChannelsThunk());

    const handleVideoDatabaseUpdate = () => {
      dispatch(fetchVideosThunk());
    };
    const handleChannelDatabaseUpdate = () => {
      dispatch(fetchChannelsThunk());
    };

    window.addEventListener('yt-video-updated', handleVideoDatabaseUpdate);
    window.addEventListener('yt-channel-updated', handleChannelDatabaseUpdate);
    return () => {
      window.removeEventListener('yt-video-updated', handleVideoDatabaseUpdate);
      window.removeEventListener('yt-channel-updated', handleChannelDatabaseUpdate);
    };
  }, [dispatch]);

  // Determine current active route (declared before effects that use it)
  const isAuthRoute = currentPath === '/signin' || currentPath === '/login' || currentPath === '/register';
  const watchVideoId = extractVideoId(currentPath, currentSearch);
  const isWatchRoute = Boolean(watchVideoId);
  const channelId = extractChannelId(currentPath, currentSearch);
  const isChannelRoute = Boolean(channelId);

  // Record watch history whenever a video is opened
  useEffect(() => {
    if (watchVideoId) recordWatch(watchVideoId);
  }, [watchVideoId]);

  // Navigation helpers
  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    const url = new URL(path, window.location.origin);
    setCurrentPath(url.pathname);
    setCurrentSearch(url.search);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectVideo = (videoId) => {
    navigateTo(`/watch?v=${videoId}`);
  };

  const handleNavigateChannel = (channelId) => {
    navigateTo(`/channel?id=${channelId}`);
  };

  const handleOpenCreateChannel = () => {
    dispatch(setCreateChannelModalOpen(true));
  };

  const handleCloseCreateChannel = () => {
    dispatch(setCreateChannelModalOpen(false));
  };

  const handleSignInClick = () => {
    navigateTo('/signin');
  };

  const handleAuthSuccess = (user) => {
    dispatch(setUser(user));
    navigateTo('/');
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  // Toggle sidebar
  const handleToggleSidebar = () => {
    if (isWatchRoute) {
      dispatch(toggleWatchSidebar());
    } else {
      dispatch(toggleSidebar());
    }
  };

  // Close sidebar on mobile / overlay click
  const handleCloseSidebar = () => {
    dispatch(setSidebarOpen(false));
    dispatch(setWatchSidebarOpen(false));
  };

  const handleSelectTab = (tab) => {
    dispatch(setActiveTab(tab));
    if (tab === 'Home') {
      navigateTo('/');
    }
  };

  const handleSearchChange = (query) => {
    dispatch(setSearchQuery(query));
  };

  const handleSearchSubmit = (query) => {
    dispatch(setSearchQuery(query));
    if (query && query.trim()) {
      dispatch(youtubeSearchThunk(query.trim()));
    }
    if (isWatchRoute || isAuthRoute || isChannelRoute) {
      navigateTo('/');
    }
  };

  const handleSelectCategory = (category) => {
    dispatch(setSelectedCategory(category));
    dispatch(setActiveTab('Home'));
    dispatch(fetchTabFeedThunk(category === 'All' ? 'Home' : category));
  };

  const handleResetFilters = () => {
    dispatch(setSelectedCategory('All'));
    dispatch(setSearchQuery(''));
    dispatch(setActiveTab('Home'));
    dispatch(fetchTabFeedThunk('Home'));
  };

  // Discovery feeds and search results come from the YouTube API; library tabs
  // only select from videos already fetched from YouTube.
  const displayVideos = searchQuery && searchQuery.trim()
    ? searchResults
    : activeFeedTab
      ? (tabVideos || [])
      : filteredVideos;
  const isFeedLoading = searchQuery?.trim()
    ? videosLoading
    : activeFeedTab
      ? tabLoading
      : videosLoading;
  const retryFeed = () => {
    if (searchQuery?.trim()) {
      dispatch(youtubeSearchThunk(searchQuery.trim()));
    } else if (activeFeedTab) {
      dispatch(fetchTabFeedThunk(activeFeedTab));
    } else {
      dispatch(fetchVideosThunk());
    }
  };
  const featuredVideo = displayVideos?.[0];
  const featuredLabel = searchQuery?.trim()
    ? 'SEARCH PICK'
    : activeFeedTab && activeFeedTab !== 'Home'
      ? `${activeFeedTab.toUpperCase()} PICK`
      : selectedCategory !== 'All'
        ? `${selectedCategory.toUpperCase()} PICK`
        : 'PICKED FOR YOU';

  return (
    <div
      className={`yt-app min-h-screen flex flex-col bg-[#0f0f0f] text-[#f1f1f1] ${
        !isWatchRoute && (isSidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed')
      }`}
    >
      {/* YouTube Header */}
      <Header
        onToggleSidebar={handleToggleSidebar}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        currentUser={currentUser}
        onNavigateSignIn={handleSignInClick}
        onNavigateHome={() => navigateTo('/')}
        onLogout={handleLogout}
        onNavigateChannel={handleNavigateChannel}
        onOpenCreateChannel={handleOpenCreateChannel}
        userChannelId={userPrimaryChannel?.channelId}
      />

      {isAuthRoute ? (
        <AuthPage
          onAuthSuccess={handleAuthSuccess}
          onNavigateHome={() => navigateTo('/')}
        />
      ) : isWatchRoute ? (
        /* Video Watch Layout */
        <div className="yt-watch-layout relative flex flex-1">
          {/* Watch Page Drawer Sidebar (when opened via hamburger) */}
          {isWatchSidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/60 z-50 backdrop-blur-[2px] transition-opacity"
                onClick={() => dispatch(setWatchSidebarOpen(false))}
                aria-hidden="true"
              />
              <div className="fixed top-14 left-0 bottom-0 z-50 w-60 bg-[#0f0f0f] shadow-2xl">
                <Sidebar
                  isOpen={true}
                  activeTab={activeTab}
                  onSelectTab={(tab) => {
                    handleSelectTab(tab);
                    dispatch(setWatchSidebarOpen(false));
                  }}
                  userChannelId={userPrimaryChannel?.channelId}
                  onNavigateChannel={(chId) => {
                    dispatch(setWatchSidebarOpen(false));
                    handleNavigateChannel(chId);
                  }}
                  onOpenCreateChannel={() => {
                    dispatch(setWatchSidebarOpen(false));
                    handleOpenCreateChannel();
                  }}
                />
              </div>
            </>
          )}

          <main className="flex-1 min-w-0 bg-[#0f0f0f]">
            <VideoWatchPage
              key={watchVideoId}
              videoId={watchVideoId}
              currentUser={currentUser}
              onNavigateVideo={handleSelectVideo}
              onNavigateHome={() => navigateTo('/')}
              onNavigateChannel={handleNavigateChannel}
            />
          </main>
        </div>
      ) : isChannelRoute ? (
        /* Channel Page Layout */
        <div className="yt-body-layout flex flex-1 relative min-h-[calc(100vh-3.5rem)]">
          {/* Mobile drawer backdrop */}
          {isSidebarOpen && (
            <div
              className="yt-sidebar-overlay md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-[2px]"
              onClick={handleCloseSidebar}
              aria-hidden="true"
            />
          )}

          {/* Static / Collapsible Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            userChannelId={userPrimaryChannel?.channelId}
            onNavigateChannel={handleNavigateChannel}
            onOpenCreateChannel={handleOpenCreateChannel}
          />

          <main className="yt-main-content flex-1 min-w-0 flex flex-col bg-[#0f0f0f]">
            <ChannelPage
              key={channelId}
              channelId={channelId}
              currentUser={currentUser}
              onNavigateVideo={handleSelectVideo}
              onNavigateHome={() => navigateTo('/')}
              onOpenCreateChannel={handleOpenCreateChannel}
            />
          </main>
        </div>
      ) : (
        /* Home Feed Layout */
        <div className="yt-body-layout flex flex-1 relative min-h-[calc(100vh-3.5rem)]">
          {/* Mobile drawer backdrop */}
          {isSidebarOpen && (
            <div
              className="yt-sidebar-overlay md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-[2px]"
              onClick={handleCloseSidebar}
              aria-hidden="true"
            />
          )}

          {/* Static / Collapsible Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            userChannelId={userPrimaryChannel?.channelId}
            onNavigateChannel={handleNavigateChannel}
            onOpenCreateChannel={handleOpenCreateChannel}
          />

          {/* Main Content Area */}
          <main className="yt-main-content flex-1 min-w-0 flex flex-col bg-[#0f0f0f]">
            <FilterBar
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
            />

            <div className="yt-content-inner p-4 sm:p-6 flex-1">
              {featuredVideo && (
                <section className="yt-home-hero" key={featuredVideo.videoId} aria-label="Featured video">
                  {featuredVideo.thumbnailUrl && (
                    <img
                      className="yt-home-hero-image"
                      src={featuredVideo.thumbnailUrl}
                      alt=""
                      aria-hidden="true"
                      onError={(event) => {
                        event.currentTarget.style.visibility = 'hidden';
                      }}
                    />
                  )}
                  <div className="yt-home-hero-content">
                    <span className="yt-home-hero-label">{featuredLabel}</span>
                    <h2>{featuredVideo.title}</h2>
                    <p>{featuredVideo.channelName || featuredVideo.uploader || 'Creator spotlight'}</p>
                    <button
                      type="button"
                      className="yt-home-hero-button"
                      onClick={() => handleSelectVideo(featuredVideo.videoId)}
                    >
                      <span aria-hidden="true">▶</span>
                      Watch featured
                    </button>
                  </div>
                  <span className="yt-home-hero-mark" aria-hidden="true">01</span>
                </section>
              )}
              <h1 className="text-white text-xl font-bold mb-4">
                {searchQuery && searchQuery.trim()
                  ? `Search results for "${searchQuery}"`
                  : activeFeedTab && activeFeedTab !== 'Home'
                    ? activeFeedTab
                    : ''}
              </h1>
              <VideoGrid
                videos={displayVideos || []}
                isLoading={isFeedLoading}
                error={videoError}
                onRetry={retryFeed}
                onResetFilter={handleResetFilters}
                onSelectVideo={handleSelectVideo}
                onNavigateChannel={handleNavigateChannel}
              />
            </div>
          </main>
        </div>
      )}

      {/* Modal to Create Channel (available after user signs in) */}
      <CreateChannelModal
        isOpen={isCreateChannelModalOpen}
        onClose={handleCloseCreateChannel}
        currentUser={currentUser}
        onNavigateSignIn={handleSignInClick}
        onChannelCreated={(newChannel) => {
          handleNavigateChannel(newChannel.channelId);
        }}
      />
      {!isAuthRoute && <Chatbot onSearch={handleSearchSubmit} />}
    </div>
  );
}
