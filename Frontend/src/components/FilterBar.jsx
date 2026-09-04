import { useRef } from 'react';

const CATEGORIES = [
  'All',
  'React',
  'JavaScript',
  'Web Development',
  'Music',
  'Vite',
  'CSS',
  'Tools',
  'Next.js',
  'Computer programming',
  'Podcasts',
  'Live',
  'Recently uploaded',
  'New to you'
];

export default function FilterBar({ selectedCategory = 'All', onSelectCategory }) {
  const scrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="yt-filter-bar-container sticky top-14 z-40 bg-[#0f0f0f] flex items-center px-6 py-3 gap-2 border-b border-white/5 select-none">
      <button
        className="yt-filter-scroll-btn left w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors text-xl shrink-0 cursor-pointer"
        onClick={() => handleScroll('left')}
        aria-label="Scroll filters left"
      >
        ‹
      </button>

      <div className="yt-filter-chips flex items-center gap-3 overflow-x-auto scroll-smooth flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" ref={scrollRef}>
        {CATEGORIES.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              className={`yt-filter-chip whitespace-nowrap px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer shrink-0 ${
                isActive
                  ? 'active bg-white text-black font-semibold'
                  : 'bg-white/10 hover:bg-white/15 text-white font-medium'
              }`}
              onClick={() => onSelectCategory(category)}
            >
              {category}
            </button>
          );
        })}
      </div>

      <button
        className="yt-filter-scroll-btn right w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors text-xl shrink-0 cursor-pointer"
        onClick={() => handleScroll('right')}
        aria-label="Scroll filters right"
      >
        ›
      </button>
    </div>
  );
}
