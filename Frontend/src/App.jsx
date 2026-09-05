import { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import VideoGrid from './components/VideoGrid';
import VideoWatchPage from './components/VideoWatchPage';
import ChannelPage from './components/ChannelPage';
import CreateChannelModal from './components/CreateChannelModal';
import AuthPage from './components/AuthPage';
import { getCurrentUser, logoutUser } from './utils/auth';
import { getVideos } from './utils/videoService';
import { getUserPrimaryChannel } from './utils/channelService';
import './App.css';

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
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');
  const [currentSearch, setCurrentSearch] = useState(() => window.location.search || '');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isWatchSidebarOpen, setIsWatchSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Home');
  const [videosList, setVideosList] = useState(() => getVideos());
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [channelsUpdateTick, setChannelsUpdateTick] = useState(0);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setCurrentSearch(window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen to video database changes
  useEffect(() => {
    const handleVideoDatabaseUpdate = () => {
      setVideosList(getVideos());
    };
    const handleChannelDatabaseUpdate = () => {
      setChannelsUpdateTick((prev) => prev + 1);
    };

    window.addEventListener('yt-video-updated', handleVideoDatabaseUpdate);
    window.addEventListener('yt-channel-updated', handleChannelDatabaseUpdate);
    return () => {
      window.removeEventListener('yt-video-updated', handleVideoDatabaseUpdate);
      window.removeEventListener('yt-channel-updated', handleChannelDatabaseUpdate);
    };
  }, []);

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
    setIsCreateChannelModalOpen(true);
  };

  const handleSignInClick = () => {
    navigateTo('/signin');
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    navigateTo('/');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // Toggle sidebar
  const handleToggleSidebar = () => {
    if (isWatchRoute) {
      setIsWatchSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarOpen((prev) => !prev);
    }
  };

  // Close sidebar on mobile / overlay click
  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setIsWatchSidebarOpen(false);
  };

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'Home') {
      navigateTo('/');
    }
  };

  // Determine current active route
  const isAuthRoute = currentPath === '/signin' || currentPath === '/login' || currentPath === '/register';
  const watchVideoId = extractVideoId(currentPath, currentSearch);
  const isWatchRoute = Boolean(watchVideoId);
  const channelId = extractChannelId(currentPath, currentSearch);
  const isChannelRoute = Boolean(channelId);

  // User primary channel (if any)
  const userPrimaryChannel = useMemo(() => {
    if (channelsUpdateTick < 0) return null;
    return currentUser ? getUserPrimaryChannel(currentUser.userId) : null;
  }, [currentUser, channelsUpdateTick]);

  // Filter videos based on category selection and search query
  const filteredVideos = useMemo(() => {
    return videosList.filter((video) => {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const matchesSearch =
        normalizedQuery === '' ||
        video.title.toLowerCase().includes(normalizedQuery) ||
        (video.channelName && video.channelName.toLowerCase().includes(normalizedQuery)) ||
        (video.description && video.description.toLowerCase().includes(normalizedQuery));

      if (!matchesSearch) return false;

      if (selectedCategory === 'All') return true;

      return video.category?.toLowerCase() === selectedCategory.toLowerCase();
    });
  }, [videosList, selectedCategory, searchQuery]);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
  };

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
        onSearchChange={setSearchQuery}
        onSearchSubmit={(query) => {
          setSearchQuery(query);
          if (isWatchRoute || isAuthRoute || isChannelRoute) {
            navigateTo('/');
          }
        }}
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
                onClick={() => setIsWatchSidebarOpen(false)}
                aria-hidden="true"
              />
              <div className="fixed top-14 left-0 bottom-0 z-50 w-60 bg-[#0f0f0f] shadow-2xl">
                <Sidebar
                  isOpen={true}
                  activeTab={activeTab}
                  onSelectTab={(tab) => {
                    handleSelectTab(tab);
                    setIsWatchSidebarOpen(false);
                  }}
                  userChannelId={userPrimaryChannel?.channelId}
                  onNavigateChannel={(chId) => {
                    setIsWatchSidebarOpen(false);
                    handleNavigateChannel(chId);
                  }}
                  onOpenCreateChannel={() => {
                    setIsWatchSidebarOpen(false);
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
              onSelectCategory={setSelectedCategory}
            />

            <div className="yt-content-inner p-4 sm:p-6 flex-1">
              <VideoGrid
                videos={filteredVideos}
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
        onClose={() => setIsCreateChannelModalOpen(false)}
        currentUser={currentUser}
        onNavigateSignIn={handleSignInClick}
        onChannelCreated={(newChannel) => {
          handleNavigateChannel(newChannel.channelId);
        }}
      />
    </div>
  );
}
