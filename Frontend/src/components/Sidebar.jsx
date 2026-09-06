/**
 * Main Navigation Sidebar
 * Renders in two states:
 * 1. Compact Mini-Sidebar (72px): When drawer is toggled closed, showing essential icons & labels
 * 2. Full Expanded Sidebar (240px): Full drawer with primary, library, and explore sections
 */

import { useState } from 'react';
import {
  HomeIcon,
  ShortsIcon,
  SubscriptionsIcon,
  HistoryIcon,
  PlaylistsIcon,
  WatchLaterIcon,
  LikedIcon,
  TrendingIcon,
  MusicIcon,
  GamingIcon,
  SettingsIcon,
  UserCircleIcon
} from './Icons';

export default function Sidebar({
  isOpen,
  activeTab = 'Home',
  onSelectTab,
  userChannelId,
  onNavigateChannel,
  onOpenCreateChannel
}) {
  const [currentTab, setCurrentTab] = useState(activeTab);

  const handleItemClick = (title) => {
    setCurrentTab(title);
    if (onSelectTab) {
      onSelectTab(title);
    }
  };


  const primaryItems = [
    { title: 'Home', icon: HomeIcon },
    { title: 'Shorts', icon: ShortsIcon },
    { title: 'Subscriptions', icon: SubscriptionsIcon }
  ];

  const libraryItems = [
    { title: 'History', icon: HistoryIcon },
    { title: 'Playlists', icon: PlaylistsIcon },
    { title: 'Watch Later', icon: WatchLaterIcon },
    { title: 'Liked videos', icon: LikedIcon }
  ];

  const exploreItems = [
    { title: 'Trending', icon: TrendingIcon },
    { title: 'Music', icon: MusicIcon },
    { title: 'Gaming', icon: GamingIcon }
  ];

  // When isOpen is false on desktop, render the compact mini-sidebar (icon + small text)
  if (!isOpen) {
    return (
      <aside className="yt-sidebar yt-sidebar-mini sticky top-14 h-[calc(100vh-3.5rem)] w-[72px] bg-[#0f0f0f] overflow-y-auto py-2 flex flex-col items-center gap-1 shrink-0 select-none border-r border-white/10" aria-label="Mini Navigation">
        {primaryItems.map((item) => {
          const IconComp = item.icon;
          const isActive = currentTab === item.title;
          return (
            <button
              key={item.title}
              className={`yt-sidebar-mini-item flex flex-col items-center justify-center w-16 h-18 rounded-xl transition-colors cursor-pointer gap-1.5 ${
                isActive ? 'bg-white/15 text-white font-medium' : 'text-white hover:bg-white/10'
              }`}
              onClick={() => handleItemClick(item.title)}
              title={item.title}
            >
              <IconComp size={22} active={isActive} />
              <span className="yt-mini-label text-[10px] text-center truncate max-w-[60px]">{item.title}</span>
            </button>
          );
        })}
        <button
          className={`yt-sidebar-mini-item flex flex-col items-center justify-center w-16 h-18 rounded-xl transition-colors cursor-pointer gap-1.5 ${
            currentTab === 'You' ? 'bg-white/15 text-white font-medium' : 'text-white hover:bg-white/10'
          }`}
          onClick={() => handleItemClick('You')}
          title="You"
        >
          <HistoryIcon size={22} />
          <span className="yt-mini-label text-[10px] text-center truncate max-w-[60px]">You</span>
        </button>
      </aside>
    );
  }

  // Expanded full sidebar
  return (
    <aside className="yt-sidebar yt-sidebar-expanded sticky top-14 h-[calc(100vh-3.5rem)] w-60 bg-[#0f0f0f] overflow-y-auto p-3 flex flex-col shrink-0 select-none border-r border-white/10" aria-label="Primary Navigation">
      <div className="yt-sidebar-section flex flex-col gap-0.5">
        {primaryItems.map((item) => {
          const IconComp = item.icon;
          const isActive = currentTab === item.title;
          return (
            <button
              key={item.title}
              className={`yt-sidebar-item flex items-center gap-6 w-full px-3 py-2.5 rounded-xl text-left text-sm cursor-pointer transition-colors ${
                isActive ? 'bg-white/15 text-white font-medium' : 'text-white hover:bg-white/10'
              }`}
              onClick={() => handleItemClick(item.title)}
            >
              <span className="yt-sidebar-icon flex items-center justify-center w-6 h-6">
                <IconComp size={22} active={isActive} />
              </span>
              <span className="yt-sidebar-text truncate">{item.title}</span>
            </button>
          );
        })}
      </div>

      <hr className="yt-sidebar-divider border-t border-white/10 my-2.5" />

      <div className="yt-sidebar-section flex flex-col gap-0.5">
        <div className="yt-sidebar-section-title text-sm font-semibold text-white px-3 py-1.5">You ›</div>
        {userChannelId ? (
          <button
            className="yt-sidebar-item flex items-center gap-6 w-full px-3 py-2.5 rounded-xl text-left text-sm cursor-pointer transition-colors text-white hover:bg-white/10"
            onClick={() => {
              if (onNavigateChannel) onNavigateChannel(userChannelId);
            }}
          >
            <span className="yt-sidebar-icon flex items-center justify-center w-6 h-6">
              <UserCircleIcon size={22} />
            </span>
            <span className="yt-sidebar-text truncate">Your channel</span>
          </button>
        ) : (
          onOpenCreateChannel && (
            <button
              className="yt-sidebar-item flex items-center gap-6 w-full px-3 py-2.5 rounded-xl text-left text-sm cursor-pointer transition-colors text-white hover:bg-white/10"
              onClick={onOpenCreateChannel}
            >
              <span className="yt-sidebar-icon flex items-center justify-center w-6 h-6">
                <UserCircleIcon size={22} />
              </span>
              <span className="yt-sidebar-text truncate">Create a channel</span>
            </button>
          )
        )}
        {libraryItems.map((item) => {
          const IconComp = item.icon;
          const isActive = currentTab === item.title;
          return (
            <button
              key={item.title}
              className={`yt-sidebar-item flex items-center gap-6 w-full px-3 py-2.5 rounded-xl text-left text-sm cursor-pointer transition-colors ${
                isActive ? 'bg-white/15 text-white font-medium' : 'text-white hover:bg-white/10'
              }`}
              onClick={() => handleItemClick(item.title)}
            >
              <span className="yt-sidebar-icon flex items-center justify-center w-6 h-6">
                <IconComp size={22} active={isActive} />
              </span>
              <span className="yt-sidebar-text truncate">{item.title}</span>
            </button>
          );
        })}
      </div>

      <hr className="yt-sidebar-divider border-t border-white/10 my-2.5" />

      <div className="yt-sidebar-section flex flex-col gap-0.5">
        <div className="yt-sidebar-section-title text-sm font-semibold text-white px-3 py-1.5">Explore</div>
        {exploreItems.map((item) => {
          const IconComp = item.icon;
          const isActive = currentTab === item.title;
          return (
            <button
              key={item.title}
              className={`yt-sidebar-item flex items-center gap-6 w-full px-3 py-2.5 rounded-xl text-left text-sm cursor-pointer transition-colors ${
                isActive ? 'bg-white/15 text-white font-medium' : 'text-white hover:bg-white/10'
              }`}
              onClick={() => handleItemClick(item.title)}
            >
              <span className="yt-sidebar-icon flex items-center justify-center w-6 h-6">
                <IconComp size={22} active={isActive} />
              </span>
              <span className="yt-sidebar-text truncate">{item.title}</span>
            </button>
          );
        })}
      </div>

      <hr className="yt-sidebar-divider border-t border-white/10 my-2.5" />

      <div className="yt-sidebar-section flex flex-col gap-0.5">
        <button
          className={`yt-sidebar-item flex items-center gap-6 w-full px-3 py-2.5 rounded-xl text-left text-sm cursor-pointer transition-colors ${
            currentTab === 'Settings' ? 'bg-white/15 text-white font-medium' : 'text-white hover:bg-white/10'
          }`}
          onClick={() => handleItemClick('Settings')}
        >
          <span className="yt-sidebar-icon flex items-center justify-center w-6 h-6">
            <SettingsIcon size={22} />
          </span>
          <span className="yt-sidebar-text truncate">Settings</span>
        </button>
      </div>

      <div className="yt-sidebar-footer px-3 py-4 text-xs text-[#717171] leading-relaxed">
        <p className="yt-footer-links mb-2">
          About &bull; Press &bull; Copyright &bull; Contact us &bull; Creators &bull; Advertise &bull; Developers
        </p>
        <p className="yt-footer-copyright text-[11px]">
          &copy; {new Date().getFullYear()} Google LLC
        </p>
      </div>
    </aside>
  );
}
