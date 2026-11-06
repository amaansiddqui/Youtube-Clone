import { useState, useRef, useEffect } from 'react';

// Loads the IFrame API script once per page
let apiPromise = null;
function loadYouTubeApi() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve(window.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return apiPromise;
}

const ERROR_MESSAGES = {
  2: 'This video is invalid.',
  5: 'This video could not be played.',
  100: 'This video has been removed or is private.',
  101: 'The uploader has restricted this video (embedding or region).',
  150: 'The uploader has restricted this video (embedding or region).'
};

export default function YouTubePlayer({ video, onNextVideo }) {
  const ytId = video?.youtubeVideoId;
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    setErrorInfo(null);
    if (!ytId) return;

    let cancelled = false;
    let player = null;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;

      player = new YT.Player(containerRef.current, {
        videoId: ytId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3
        },
        events: {
          onError: (e) => {
            if (cancelled) return;
            const code = e?.data ?? 150;
            setErrorInfo(ERROR_MESSAGES[code] || 'This video cannot be played here.');
            // Auto-advance to the next recommended video after a short pause
            if (onNextVideo) {
              setTimeout(() => {
                if (!cancelled) onNextVideo();
              }, 2500);
            }
          }
        }
      });
      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      try {
        player?.destroy?.();
      } catch {
        // player already gone
      }
      playerRef.current = null;
    };
  }, [ytId]);

  if (!ytId) return null;

  if (errorInfo) {
    return (
      <div className="yt-player-container relative w-full aspect-video bg-[#0f0f0f] rounded-xl sm:rounded-2xl overflow-hidden select-none shadow-2xl flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          </svg>
        </div>
        <h3 className="text-white text-lg font-semibold mb-1">Video unavailable</h3>
        <p className="text-neutral-400 text-sm max-w-md mb-5">{errorInfo}</p>
        {onNextVideo && (
          <div className="flex items-center gap-3">
            <button
              onClick={onNextVideo}
              className="px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-full hover:bg-neutral-200 transition-colors"
            >
              Playing next video…
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="yt-player-container relative w-full aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden select-none shadow-2xl">
      {/* The YT API replaces this div with the iframe player (with full native controls) */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
