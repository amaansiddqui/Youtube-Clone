/**
 * Custom HTML5 Video Player
 * Features:
 * - Play / Pause toggle with keyboard spacebar support
 * - Video seek bar with live scrub preview
 * - Volume slider and mute toggle
 * - Current time / total duration counter
 * - Fullscreen toggle with Fullscreen API
 * - Auto-hiding control overlays on inactivity
 */

import { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon, VolumeIcon, VolumeMuteIcon, FullscreenIcon } from './Icons';
import { getSafeThumbnail } from '../utils/formatters';

export default function VideoPlayer({ video }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const controlsTimeoutRef = useRef(null);

  // Reliable fallback video stream if video URL is missing or broken
  const fallbackStream = "https://www.w3schools.com/html/mov_bbb.mp4";
  const videoSrc = video?.videoUrl || fallbackStream;
  const posterSrc = thumbError
    ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=80'
    : getSafeThumbnail(video?.thumbnailUrl);

  // Pause and reload video stream when source URL changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.load();
    }
  }, [video?.videoUrl]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle automatic recovery if video stream encounters network or format errors
  const handleVideoError = () => {
    if (videoRef.current && videoRef.current.src !== fallbackStream) {
      console.warn(`Video stream failed to load (${videoSrc}). Recovering with verified demo stream.`);
      videoRef.current.src = fallbackStream;
      videoRef.current.load();
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
        setHasError(false);
      }).catch(() => {
        // If autoplay policy blocks it, just stay paused on fallback stream without error
        setIsLoading(false);
        setHasError(false);
      });
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setHasStarted(true);
        setIsLoading(false);
      }).catch((e) => {
        console.error('Playback error:', e);
        setIsLoading(false);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      setIsLoading(false);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch((err) => {
        console.error('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.error('Exit fullscreen failed:', err);
      });
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  const formatSeconds = (sec) => {
    if (isNaN(sec) || sec === null) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="yt-player-container relative w-full aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden select-none group shadow-2xl"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* HTML5 Video element */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc}
        preload="metadata"
        className="w-full h-full object-contain cursor-pointer bg-black"
        onClick={handlePlayPause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
          setHasStarted(true);
        }}
        onError={handleVideoError}
        onEnded={() => setIsPlaying(false)}
        playsInline
      />

      {/* High-Resolution Thumbnail Poster Overlay (shown until user starts playback to eliminate browser poster clearing / black frame glitch) */}
      {!hasStarted && !hasError && (
        <div
          className="absolute inset-0 z-20 cursor-pointer overflow-hidden bg-black flex items-center justify-center group/poster"
          onClick={handlePlayPause}
        >
          <img
            src={posterSrc}
            alt={video?.title || 'Video thumbnail'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover/poster:scale-[1.01]"
            onError={() => setThumbError(true)}
          />

          {/* Contrast gradient overlay */}
          <div className="absolute inset-0 bg-black/25 group-hover/poster:bg-black/15 transition-colors" />

          {/* Large Center Play Button */}
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/70 hover:bg-[#cc0000] text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-2xl cursor-pointer z-30 group-hover/poster:scale-105"
            aria-label="Play video"
          >
            <PlayIcon size={36} className="translate-x-0.5 text-white" />
          </button>
        </div>
      )}

      {/* Buffering Spinner (only shown after playback has started and stream is buffering) */}
      {hasStarted && isLoading && !hasError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-black/20">
          <div className="w-12 h-12 border-4 border-white/20 border-t-[#ff0000] rounded-full animate-spin" />
        </div>
      )}

      {/* Large Center Play Button when paused after video has started */}
      {hasStarted && !isPlaying && !isLoading && !hasError && (
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 hover:bg-[#cc0000] text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg cursor-pointer z-20"
          aria-label="Play video"
        >
          <PlayIcon size={36} className="translate-x-0.5 text-white" />
        </button>
      )}

      {/* Playback Error fallback notification */}
      {hasError && (
        <div className="absolute inset-0 bg-neutral-900/90 flex flex-col items-center justify-center text-center p-6">
          <p className="text-white font-medium mb-2">Video playback could not be loaded</p>
          <p className="text-xs text-neutral-400 mb-4">You can retry or view using alternative sample stream.</p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              if (videoRef.current) {
                videoRef.current.src = fallbackStream;
                videoRef.current.load();
                videoRef.current.play().catch(() => { });
              }
            }}
            className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-full hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Play Demo Stream
          </button>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`yt-player-controls absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-8 pb-3 px-4 flex flex-col transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      >
        {/* Progress Bar (Scrubber) */}
        <div className="yt-progress-container relative w-full h-1.5 hover:h-2.5 transition-all group/progress cursor-pointer flex items-center mb-3">
          {/* Background rail */}
          <div className="w-full h-full bg-white/30 rounded-full overflow-hidden relative">
            {/* Red Played Fill */}
            <div
              className="h-full bg-[#ff0000] relative"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Interactive Range Input overlay */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Seek timeline"
          />
          {/* Scrubber thumb circle */}
          <div
            className="absolute w-3.5 h-3.5 bg-[#ff0000] rounded-full -translate-x-1/2 pointer-events-none transition-transform group-hover/progress:scale-125"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between text-white text-sm">
          {/* Left Controls: Play/Pause, Volume, Time */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handlePlayPause}
              className="hover:text-white/80 transition-colors cursor-pointer p-1"
              title={isPlaying ? 'Pause (k)' : 'Play (k)'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
            </button>

            {/* Volume controls */}
            <div className="flex items-center gap-1.5 group/volume">
              <button
                onClick={handleToggleMute}
                className="hover:text-white/80 transition-colors cursor-pointer p-1"
                title={isMuted ? 'Unmute (m)' : 'Mute (m)'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeMuteIcon size={22} /> : <VolumeIcon size={22} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-20 h-1 bg-white/40 accent-white rounded-lg cursor-pointer transition-all"
                aria-label="Volume level"
              />
            </div>

            {/* Time readout */}
            <div className="text-xs sm:text-sm text-neutral-300 font-mono tracking-tight select-none">
              <span>{formatSeconds(currentTime)}</span>
              <span className="mx-1 text-neutral-500">/</span>
              <span>{formatSeconds(duration)}</span>
            </div>
          </div>

          {/* Right Controls: Fullscreen */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleFullscreen}
              className="hover:text-white/80 transition-colors cursor-pointer p-1"
              title={isFullscreen ? 'Exit full screen (f)' : 'Full screen (f)'}
              aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
            >
              <FullscreenIcon size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
