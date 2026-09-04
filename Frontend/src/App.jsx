import { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import VideoGrid from './components/VideoGrid';
import AuthPage from './components/AuthPage';
import { allVideos } from './data/sampleVideos';
import { getCurrentUser, logoutUser } from './utils/auth';
import './App.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Home');

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation helpers
  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignInClick = () => {
    navigateTo('/signin');
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    // After signing in, redirect to home page and display user's name at top
    navigateTo('/');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // Toggle sidebar between expanded and compact
  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Close sidebar on mobile overlay click
  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Filter videos based on category selection and search query
  const filteredVideos = useMemo(() => {
    return allVideos.filter((video) => {
      // Search matching
      const matchesSearch = searchQuery.trim() === '' ||
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.channelName && video.channelName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (video.uploader && video.uploader.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Category matching
      if (selectedCategory === 'All') return true;

      const catLower = selectedCategory.toLowerCase();
      if (video.category && video.category.toLowerCase() === catLower) return true;
      if (video.title.toLowerCase().includes(catLower)) return true;
      if (video.description && video.description.toLowerCase().includes(catLower)) return true;

      return false;
    });
  }, [selectedCategory, searchQuery]);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
  };

  const isAuthRoute = currentPath === '/signin' || currentPath === '/login' || currentPath === '/register';

  return (
    <div className={`yt-app min-h-screen flex flex-col bg-[#0f0f0f] text-[#f1f1f1] ${isSidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      {/* YouTube Header */}
      <Header
        onToggleSidebar={handleToggleSidebar}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={setSearchQuery}
        currentUser={currentUser}
        onNavigateSignIn={handleSignInClick}
        onNavigateHome={() => navigateTo('/')}
        onLogout={handleLogout}
      />

      {isAuthRoute ? (
        <AuthPage
          onAuthSuccess={handleAuthSuccess}
          onNavigateHome={() => navigateTo('/')}
        />
      ) : (
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
            onSelectTab={setActiveTab}
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
              />
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
