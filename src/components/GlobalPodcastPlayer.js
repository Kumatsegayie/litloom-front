import React from 'react';
import { usePodcastPlayer } from '../contexts/PodcastPlayerContext';
import AdvancedPodcastPlayer from '../pages/Podcasts/AdvancedPodcastPlayer';

const GlobalPodcastPlayer = () => {
  const ctx = usePodcastPlayer();
  const track = ctx.currentTrack;

  // don't render the global player when there's no queue
  if (!ctx.queue || ctx.queue.length === 0 || !track) return null;

  const handleEpisodeChange = (idx, opts = {}) => {
    // Do not auto-navigate from the global player — only change the queue index and keep playing.
    // Navigation is handled by page-level players when the user specifically requests it.
    ctx.playAt(idx);
    ctx.setIsPlaying(true);
  };

  return (
    <div style={{position: 'fixed', right: 16, bottom: 16, zIndex: 2147483647}}>
      <AdvancedPodcastPlayer
        src={track.audio}
        cover={track.cover}
        title={track.title}
        description={track.description}
        episodes={ctx.queue}
        currentEpisodeIndex={ctx.currentIndex}
        onEpisodeChange={handleEpisodeChange}
        onAudioChange={(url) => { /* keep in sync if needed */ }}
        forcePlay={ctx.isPlaying}
        allowNavigation={false}
        enableKeyboard={false}
        onAutoPlayHandled={() => { /* keep global playback state intact */ }}
        isSeries={Boolean(ctx.queue && ctx.queue.length > 0)}
      />
    </div>
  );
};

export default GlobalPodcastPlayer;
