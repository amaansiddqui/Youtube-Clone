import { useState } from 'react';
import { MenuIcon, YouTubeLogo, SearchIcon, MicIcon, CreateIcon, BellIcon, UserCircleIcon } from './Icons';

export default function Header({
  onToggleSidebar,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  currentUser = null,
  onNavigateSignIn,
  onNavigateHome,
  onLogout
}) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(localSearch);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setLocalSearch(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const clearSearch = () => {
    setLocalSearch('');
    if (onSearchChange) {
      onSearchChange('');
    }
    if (onSearchSubmit) {
      onSearchSubmit('');
    }
  };

  return (
    <header className="yt-header sticky top-0 z-50 h-14 bg-[#0f0f0f] flex items-center justify-between px-4 border-b border-white/10 select-none">
      {/* Left section: Hamburger & Logo */}
      <div className="yt-header-left flex items-center gap-4 min-w-[170px]">
        <button
          className="yt-icon-btn yt-hamburger-btn w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation drawer"
          title="Guide"
        >
          <MenuIcon size={22} />
        </button>

        <div className="yt-brand flex items-center cursor-pointer" title="YouTube Home" onClick={onNavigateHome}>
          <YouTubeLogo countryCode="US" />
        </div>
      </div>

      {/* Center section: Search bar & Mic */}
      <div className="yt-header-center flex items-center justify-center flex-1 max-w-[732px] mx-4 gap-3">
        <form className="yt-search-form flex w-full max-w-[600px] items-center" onSubmit={handleSubmit} role="search">
          <div className="yt-search-input-wrapper relative flex items-center flex-1 bg-[#121212] border border-[#303030] focus-within:border-[#1c62b9] rounded-l-full px-4 h-10 transition-colors">
            <input
              type="text"
              placeholder="Search"
              value={localSearch}
              onChange={handleInputChange}
              className="yt-search-input w-full bg-transparent border-none outline-none text-white text-base placeholder-[#717171]"
              aria-label="Search"
            />
            {localSearch && (
              <button
                type="button"
                className="yt-search-clear-btn text-[#aaa] hover:text-white text-xl p-1 cursor-pointer"
                onClick={clearSearch}
                aria-label="Clear search query"
              >
                &times;
              </button>
            )}
          </div>
          <button
            type="submit"
            className="yt-search-submit-btn w-16 h-10 bg-[#222222] hover:bg-[#272727] border border-[#303030] border-l-0 rounded-r-full text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Search"
            aria-label="Search"
          >
            <SearchIcon size={19} />
          </button>
        </form>

        <button className="yt-icon-btn yt-mic-btn w-10 h-10 rounded-full bg-[#181818] hover:bg-[#272727] text-white flex items-center justify-center transition-colors cursor-pointer" title="Search with your voice" aria-label="Search with your voice">
          <MicIcon size={20} />
        </button>
      </div>

      {/* Right section: Create, Notifications, Avatar / Sign In */}
      <div className="yt-header-right flex items-center gap-2 min-w-[170px] justify-end">
        {currentUser ? (
          <>
            <button className="yt-create-btn flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white px-3.5 h-9 rounded-full text-sm font-medium transition-colors cursor-pointer" title="Create">
              <CreateIcon size={20} />
              <span className="yt-create-text hidden sm:inline">Create</span>
            </button>

            <div className="yt-notification-wrapper relative">
              <button className="yt-icon-btn yt-bell-btn w-10 h-10 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer" title="Notifications" aria-label="Notifications">
                <BellIcon size={22} />
                <span className="yt-badge absolute top-1 right-1 bg-[#cc0000] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none leading-none">9+</span>
              </button>
            </div>

            {/* User display badge & avatar */}
            <div className="yt-user-menu-container relative">
              <button
                className="yt-user-profile-btn flex items-center gap-2 bg-white/10 hover:bg-white/15 px-3 py-1 rounded-full cursor-pointer text-white transition-colors border border-white/15"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                title={`Signed in as ${currentUser.username}`}
                aria-label="User Account"
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="yt-avatar-img w-7 h-7 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="yt-avatar-initial w-7 h-7 rounded-full bg-gradient-to-br from-[#cc0000] to-[#4285f4] text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
                <span className="yt-header-username text-sm font-medium text-white max-w-[120px] truncate">{currentUser.username}</span>
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="yt-profile-dropdown absolute top-[calc(100%+8px)] right-0 bg-[#282828] border border-white/10 rounded-xl py-2 min-w-[200px] shadow-2xl z-50">
                  <div className="yt-dropdown-user-info px-4 py-2">
                    <p className="yt-dropdown-name text-sm font-semibold text-white">{currentUser.username}</p>
                    <p className="yt-dropdown-email text-xs text-[#aaa] break-all">{currentUser.email}</p>
                  </div>
                  <hr className="yt-dropdown-divider border-t border-white/10 my-1.5" />
                  <button
                    className="yt-dropdown-item logout w-full text-left px-4 py-2 hover:bg-white/10 text-[#ff6b6b] text-sm cursor-pointer transition-colors"
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onLogout) onLogout();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            className="yt-signin-btn flex items-center gap-2 border border-white/20 hover:bg-[#3ea6ff]/10 hover:border-transparent text-[#3ea6ff] px-3.5 h-9 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
            onClick={onNavigateSignIn}
            aria-label="Sign in"
          >
            <UserCircleIcon size={22} className="yt-signin-icon text-[#3ea6ff]" />
            <span className="yt-signin-text text-[#3ea6ff] font-medium">Sign in</span>
          </button>
        )}
      </div>
    </header>
  );
}