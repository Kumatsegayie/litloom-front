import React, { useState, useRef, useEffect } from "react";
import { PLACEHOLDER_COVER } from "../../utils/placeholder";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronLeft, ChevronRight, Minimize, Maximize, Gauge } from "lucide-react";
import { toAbsoluteStrapiUrl } from "../../services/strapiBaseURL";

const AdvancedPodcastPlayer = ({
  src,
  embedUrl,
  cover,
  title,
  description,
  episodes = [],
  currentEpisodeIndex = -1,
  onEpisodeChange,
  enableKeyboard = true,
  onAudioChange,
  forcePlay = false,
  onAutoPlayHandled,
  onRequestGlobalPlay,
  suggestions = [],
  currentSuggestionIndex = -1,
  onSuggestionChange,
  isSeries = false,
  allowNavigation = true,
  preferGlobalOnPlay = false,
  titleBelowCover = false,
  onFullscreenChange,
}) => {
  const audioRef = useRef(null);
  const playerRef = useRef(null);
  const lastPlayPromiseRef = useRef(null);
  const isPlayPendingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedDropdown, setShowSpeedDropdown] = useState(false);

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    if (typeof onFullscreenChange === "function") {
      onFullscreenChange(isFullscreen);
    }
  }, [isFullscreen, onFullscreenChange]);

  useEffect(() => {
    return () => {
      if (typeof onFullscreenChange === "function") {
        onFullscreenChange(false);
      }
    };
  }, [onFullscreenChange]);

  const toEmbedUrl = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https:\/\/open\.spotify\.com\/episode\//i.test(raw)) {
      return raw.replace("https://open.spotify.com/episode/", "https://open.spotify.com/embed/episode/");
    }
    if (/^https:\/\/open\.spotify\.com\/show\//i.test(raw)) {
      return raw.replace("https://open.spotify.com/show/", "https://open.spotify.com/embed/show/");
    }
    if (/^https:\/\/(www\.)?youtube\.com\/watch\?v=/i.test(raw)) {
      const match = raw.match(/[?&]v=([^&]+)/i);
      const id = match ? match[1] : "";
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (/^https:\/\/youtu\.be\//i.test(raw)) {
      const id = raw.split("/").pop() || "";
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (/^https?:\/\/.+/i.test(raw)) return raw;
    return "";
  };

  const getMediaUrl = (media) => {
    if (!media) return null;
    // if already a string URL
    if (typeof media === 'string') return toAbsoluteStrapiUrl(media);
    // handle direct data object from normalized API
    const data = media.data || media;
    const attrs = data.attributes || {};
    const formats = attrs.formats || {};

    // prefer explicit audio format urls (mp3, m4a, ogg, wav)
    const audioExts = ['.mp3', '.m4a', '.ogg', '.wav', '.aac', '.flac'];
    const tryUrl = (u) => {
      if (!u) return null;
      if (typeof u !== 'string') return null;
      return u;
    };

    // 1) attributes.url (often the original)
    let url = tryUrl(attrs.url) || tryUrl(data.url) || null;

    // 2) check formats for audio-like files (choose best match)
    if (!url && formats && typeof formats === 'object') {
      // formats may be an object with keys whose values have a url
      const candidates = Object.values(formats)
        .map((f) => (f && (f.url || f.formats || f.path) ? (f.url || f.path) : null))
        .filter(Boolean);
      // prefer candidate containing known audio extension
      const audioCandidate = candidates.find((c) => audioExts.some((ext) => c.toLowerCase().endsWith(ext)));
      url = audioCandidate || candidates[0] || null;
    }
    if (!url) return null;
    return toAbsoluteStrapiUrl(url);
  };

  // watch audioSrc and safely load it into the audio element
  const audioSrc = getMediaUrl(src);
  const embedSrc = toEmbedUrl(embedUrl);
  const coverUrl = getMediaUrl(cover) || PLACEHOLDER_COVER;
  const hasAudio = Boolean(audioSrc);
  const hasEmbeddedPlayer = !hasAudio && Boolean(embedSrc);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // debug logging removed for production clarity

    // Pause and cancel any pending play promise before changing src
    try {
      if (!audio.paused) audio.pause();
    } catch (e) {
      /* ignore */
    }

    // assign and load (or clear if no src)
    try {
      if (audioSrc) {
        audio.src = audioSrc;
      } else {
        // remove source and reset player
        try {
          audio.removeAttribute('src');
        } catch (e) {}
        audio.src = '';
      }
      // call load to update media resource
      audio.load();
    } catch (e) {}

    // If the UI thinks it should be playing, attempt to play safely
    if (isPlaying && audioSrc) {
      // avoid concurrent play calls
      if (!isPlayPendingRef.current) {
        const playPromise = audio.play();
        lastPlayPromiseRef.current = playPromise;
        isPlayPendingRef.current = true;
        playPromise
          .catch((err) => {
            if (!(err && (err.name === 'AbortError' || /removed from the document/i.test(err.message || '')))) {
              console.warn('Auto-play error after src change:', err);
            }
          })
          .finally(() => {
            if (lastPlayPromiseRef.current === playPromise) lastPlayPromiseRef.current = null;
            isPlayPendingRef.current = false;
          });
      }
    }

    // If parent requested forcePlay (e.g. next/previous), attempt to play the new src
    if (forcePlay && audioSrc) {
      if (!isPlayPendingRef.current) {
        const playPromise = audio.play();
        lastPlayPromiseRef.current = playPromise;
        isPlayPendingRef.current = true;
        playPromise
          .catch((err) => {
            if (!(err && (err.name === 'AbortError' || /removed from the document/i.test(err.message || '')))) {
              console.warn('Forced auto-play error after src change:', err);
            }
          })
          .finally(() => {
            if (lastPlayPromiseRef.current === playPromise) lastPlayPromiseRef.current = null;
            isPlayPendingRef.current = false;
            try { if (typeof onAutoPlayHandled === 'function') onAutoPlayHandled(); } catch (e) {}
          });
      } else {
        try { if (typeof onAutoPlayHandled === 'function') onAutoPlayHandled(); } catch (e) {}
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSrc]);

  useEffect(() => {
    if (typeof onAudioChange === 'function') {
      onAudioChange(audioSrc);
    }
  }, [audioSrc, onAudioChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.playbackRate = playbackSpeed;

      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration || 0);
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleWaiting = () => setIsBuffering(true);
      const handleCanPlay = () => setIsBuffering(false);
      const handleEnded = () => {
        // Auto-play next episode or suggestion when current ends
        if (isSeries && episodes.length > 0 && currentEpisodeIndex < episodes.length - 1) {
          onEpisodeChange && onEpisodeChange(currentEpisodeIndex + 1);
        } else if (!isSeries && suggestions.length > 0 && currentSuggestionIndex < suggestions.length - 1) {
          onSuggestionChange && onSuggestionChange(currentSuggestionIndex + 1);
        }
      };

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('waiting', handleWaiting);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('waiting', handleWaiting);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [src, volume, playbackSpeed, isSeries, episodes, currentEpisodeIndex, onEpisodeChange, suggestions, currentSuggestionIndex, onSuggestionChange]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        if (audio.paused) {
          // If parent provided a handler to request global playback and the player prefers global handoff,
          // call it and bail out. By default `preferGlobalOnPlay` is false so clicking Play stays inline.
          if (preferGlobalOnPlay && typeof onRequestGlobalPlay === 'function' && audioSrc) {
            try {
              onRequestGlobalPlay({ audio: audioSrc, title, cover: coverUrl, description });
            } catch (e) {}
            return;
          }
          // avoid concurrent play() calls
          if (isPlayPendingRef.current) return;
          const playPromise = audio.play();
          lastPlayPromiseRef.current = playPromise;
          isPlayPendingRef.current = true;
          try {
            await playPromise;
          } catch (err) {
            // Silently ignore AbortError and media-removed errors
            if (err && (err.name === 'AbortError' || /removed from the document/i.test(err.message || ''))) {
              return;
            }
            console.warn('Audio play error:', err);
          } finally {
            if (lastPlayPromiseRef.current === playPromise) lastPlayPromiseRef.current = null;
            isPlayPendingRef.current = false;
          }
        } else {
          audio.pause();
        }
      } catch (error) {
        // Only warn on unexpected errors (not AbortError/media-removed)
        if (!(error && (error.name === 'AbortError' || /removed from the document/i.test(error.message || '')))) {
          console.warn('Audio play/pause error:', error);
        }
      }
    }
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.max(0, audio.currentTime - 30);
    }
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (audio && !isNaN(audio.duration)) {
      audio.currentTime = Math.min(audio.duration, audio.currentTime + 30);
    }
  };

  const skipToPrevious = () => {
  if (isSeries && episodes.length > 0 && typeof onEpisodeChange === 'function') {
      const newIndex = currentEpisodeIndex > 0 ? currentEpisodeIndex - 1 : episodes.length - 1;
      onEpisodeChange(newIndex, { navigate: allowNavigation });
      return;
    }
    if (!isSeries && suggestions.length > 0 && typeof onSuggestionChange === 'function') {
      const newIndex = currentSuggestionIndex > 0 ? currentSuggestionIndex - 1 : suggestions.length - 1;
      onSuggestionChange(newIndex, { navigate: allowNavigation });
    }
  };

  const skipToNext = () => {
    if (isSeries && episodes.length > 0 && typeof onEpisodeChange === 'function') {
      const newIndex = currentEpisodeIndex < episodes.length - 1 ? currentEpisodeIndex + 1 : 0;
      onEpisodeChange(newIndex, { navigate: allowNavigation });
      return;
    }
    if (!isSeries && suggestions.length > 0 && typeof onSuggestionChange === 'function') {
      const newIndex = currentSuggestionIndex < suggestions.length - 1 ? currentSuggestionIndex + 1 : 0;
      onSuggestionChange(newIndex, { navigate: allowNavigation });
    }
  };

  const changePlaybackSpeed = (speed) => {
    setPlaybackSpeed(speed);
    setShowSpeedDropdown(false);
  };

  const toggleSpeedDropdown = () => {
    setShowSpeedDropdown(!showSpeedDropdown);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcuts for player controls, plus hold-space for 2x speed and F-row media keys
  useEffect(() => {
    if (!enableKeyboard) return; // keyboard handling disabled for this instance
    const spacePressedRef = { current: false };
    const spaceHeldRef = { current: false };
    let spaceTimer = null;

    const handleKeyDown = (e) => {
      // ignore when typing in inputs or editable elements
      const ae = document.activeElement;
      if (!ae) return;
      const tag = (ae.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (ae.isContentEditable) return;

      // Prefer numeric keyCode for left/right to avoid cross-environment mapping issues
      const keyCode = e.which || e.keyCode || 0;
      if (keyCode === 37) {
        e.preventDefault();
        e.stopPropagation();
        skipBackward();
        return;
      }
      if (keyCode === 39) {
        e.preventDefault();
        e.stopPropagation();
        skipForward();
        return;
      }

      const keyRaw = e.key || '';
      const key = (keyRaw || '').toLowerCase();

      // Handle function-row media keys (F7/F8/F9) — map to prev/play/next
      if (key === 'f7' || key === 'f8' || key === 'f9' || keyCode === 118 || keyCode === 119 || keyCode === 120) {
        e.preventDefault();
        e.stopPropagation();
        if (key === 'f7' || keyCode === 118) skipToPrevious();
        if (key === 'f8' || keyCode === 119) togglePlay();
        if (key === 'f9' || keyCode === 120) skipToNext();
        return;
      }

      switch (key) {
        case ' ':
          // prevent default page scroll on space
          e.preventDefault();
          e.stopPropagation();
          // start hold detection — if held longer than 250ms we go 2x speed
          if (spacePressedRef.current) return;
          spacePressedRef.current = true;
          spaceHeldRef.current = false;
          spaceTimer = setTimeout(() => {
            // if still pressed, enable 2x speed
            if (spacePressedRef.current) {
              spaceHeldRef.current = true;
              setPlaybackSpeed(2);
              if (audioRef.current) audioRef.current.playbackRate = 2;
            }
          }, 250);
          break;
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          // Left arrow -> seek backward
          skipBackward();
          break;
        case 'arrowright':
          e.preventDefault();
          // Right arrow -> seek forward
          skipForward();
          break;
        case ',':
        case '<':
          e.preventDefault();
          // comma / < -> seek backward
          skipBackward();
          break;
        case '.':
        case '>':
          e.preventDefault();
          // period / > -> seek forward
          skipForward();
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((v) => Math.min(1, +(v + 0.1).toFixed(2)));
          if (audioRef.current) audioRef.current.volume = Math.min(1, (audioRef.current.volume || 0) + 0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((v) => Math.max(0, +(v - 0.1).toFixed(2)));
          if (audioRef.current) audioRef.current.volume = Math.max(0, (audioRef.current.volume || 0) - 0.1);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'escape':
          // integrate Escape with fullscreen: toggle fullscreen state
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'n':
          e.preventDefault();
          skipToNext();
          break;
        case 'p':
          e.preventDefault();
          skipToPrevious();
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      const key = (e.key || '').toLowerCase();
      if (key === ' ') {
        // prevent default page scroll on keyup as well
        e.preventDefault && e.preventDefault();
        // clear timer
        if (spaceTimer) {
          clearTimeout(spaceTimer);
          spaceTimer = null;
        }
        // if it was held long enough to enter 2x, restore speed to 1
        if (spaceHeldRef.current) {
          spaceHeldRef.current = false;
          spacePressedRef.current = false;
          setPlaybackSpeed(1);
          if (audioRef.current) audioRef.current.playbackRate = 1;
        } else {
          // short press -> toggle play/pause
          spacePressedRef.current = false;
          togglePlay();
        }
      }
    };

    // keep fullscreen state in sync when user exits via Escape or other fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (spaceTimer) {
        clearTimeout(spaceTimer);
        spaceTimer = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close speed dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (playerRef.current && !playerRef.current.contains(event.target)) {
        setShowSpeedDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    if (audio && !isNaN(audio.duration)) {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      audio.currentTime = percentage * audio.duration;
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !audio.muted;
      setIsMuted(audio.muted);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasSequenceNavigation = isSeries
    ? episodes.length > 0 && typeof onEpisodeChange === "function"
    : suggestions.length > 0 && typeof onSuggestionChange === "function";
  const previousTitle = hasSequenceNavigation ? "Previous" : "No previous podcast suggestion";
  const nextTitle = hasSequenceNavigation ? "Next" : "No next podcast suggestion";

  if (hasEmbeddedPlayer) {
    return (
      <div ref={playerRef} className={`modern-podcast-player ${isFullscreen ? 'fullscreen' : ''}`}>
        <div className="player-cover-header">
          <div className="cover-image-container">
            <img src={coverUrl || null} alt={title} className="cover-image" />
            <div className="cover-overlay">
              <div className="cover-info">
                <h2 className="cover-title">{title}</h2>
              </div>
            </div>
          </div>
        </div>
        <div className="podcast-embed-wrap">
          <iframe
            title={`${title || "Podcast"} embed`}
            src={embedSrc}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={playerRef} className={`modern-podcast-player ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* on-screen debug indicator removed */}
      {/* debug overlay removed */}
      {/* Dominant Cover Header */}
      <div className="player-cover-header">
        <div className="cover-image-container">
          <img src={coverUrl || null} alt={title} className="cover-image" />
          <div className="cover-overlay">
            {!titleBelowCover && (
              <div className="cover-info">
                <h2 className="cover-title">{title}</h2>
              </div>
            )}
          </div>
        </div>
      </div>

      {titleBelowCover && (
        <div className="cover-title-below">
          <h2 className="cover-title below">{title}</h2>
        </div>
      )}

      {/* Player Controls Below */}
      <div className="player-controls-section">
        <div className="progress-container">
          <div className="progress-bar" onClick={handleProgressClick}>
            <div
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="controls-row">
          <div className="control-buttons">
            <button className="ctrl-btn" onClick={(e) => { e.stopPropagation(); skipBackward(); }} title="Skip -30s">
              <ChevronLeft size={20} />
            </button>
            <button
              className={`ctrl-btn ${hasSequenceNavigation ? "" : "is-disabled"}`}
              onClick={(e) => { e.stopPropagation(); skipToPrevious(); }}
              title={previousTitle}
              disabled={!hasSequenceNavigation}
            >
              <SkipBack size={20} />
            </button>
            <button className="ctrl-btn play-main" onClick={(e) => { e.stopPropagation(); togglePlay(); }} disabled={!hasAudio} title={!hasAudio ? 'No audio available' : 'Play'}>
              {isBuffering ? (
                <div className="spinner"></div>
              ) : isPlaying ? (
                <Pause size={24} />
              ) : (
                <Play size={24} />
              )}
            </button>
            <button
              className={`ctrl-btn ${hasSequenceNavigation ? "" : "is-disabled"}`}
              onClick={(e) => { e.stopPropagation(); skipToNext(); }}
              title={nextTitle}
              disabled={!hasSequenceNavigation}
            >
              <SkipForward size={20} />
            </button>
            <button className="ctrl-btn" onClick={(e) => { e.stopPropagation(); skipForward(); }} title="Skip +30s">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="secondary-controls">
            <div className="speed-controller">
              <button className="ctrl-btn speed-btn" onClick={toggleSpeedDropdown} title="Playback speed">
                <Gauge size={18} />
              </button>
              {showSpeedDropdown && (
                <div className="speed-dropdown">
                  {speedOptions.map((speed) => (
                    <button
                      key={speed}
                      className={`speed-option ${playbackSpeed === speed ? 'active' : ''}`}
                      onClick={() => changePlaybackSpeed(speed)}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="volume-control">
              <button className="volume-btn" onClick={toggleMute}>
                {isMuted || volume === 0 ? (
                  <VolumeX size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  setVolume(newVolume);
                  if (audioRef.current) {
                    audioRef.current.volume = newVolume;
                    audioRef.current.muted = false;
                    setIsMuted(false);
                  }
                }}
                className="volume-slider"
              />
            </div>
            {/* popup button removed */}
            <button className="ctrl-btn fullscreen-btn" onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>

      <audio key={audioSrc || 'no-src'} ref={audioRef} src={audioSrc || ''} />
    </div>
  );
};

export default AdvancedPodcastPlayer;
