import React, { createContext, useContext, useState, useCallback } from 'react';
import { buildMediaUrl, STRAPI_URL } from '../services/podcastsAPI';
import { toAbsoluteStrapiUrl } from '../services/strapiBaseURL';

const PodcastPlayerContext = createContext(null);

export const usePodcastPlayer = () => useContext(PodcastPlayerContext);

export const PodcastPlayerProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAt = useCallback((index) => {
    if (index < 0 || index >= queue.length) return;
    setCurrentIndex(index);
    setIsPlaying(true);
  }, [queue]);

  const playTrack = useCallback((track, index = 0) => {
    const resolve = (m) => {
      if (!m) return null;
      if (typeof m === 'string') return toAbsoluteStrapiUrl(m) || buildMediaUrl(STRAPI_URL, m) || m;
      return toAbsoluteStrapiUrl(buildMediaUrl(STRAPI_URL, m) || '') || null;
    };

    const normalizeTrack = (t) => ({
      id: t?.id ?? t?.slug ?? null,
      title: t?.title || t?.name || 'Untitled',
      audio: resolve(t?.audio || t?.src || t?.url),
      cover: resolve(t?.cover || t?.thumbnail || t?.image) || t?.cover || null,
      description: t?.description || t?.summary || null,
      slug: t?.slug || null,
    });

    if (Array.isArray(track)) {
      const normalized = track.map(normalizeTrack);
      setQueue(normalized);
      setCurrentIndex(Math.max(0, Math.min(index, normalized.length - 1)));
      setIsPlaying(true);
      return;
    }

    const single = normalizeTrack(track);
    setQueue([single]);
    setCurrentIndex(0);
    setIsPlaying(true);
  }, []);

  const enqueue = useCallback((tracks = []) => {
    setQueue(prev => [...prev, ...tracks]);
  }, []);

  const next = useCallback(() => {
    setCurrentIndex(i => {
      const ni = i + 1;
      if (ni < queue.length) {
        return ni;
      }
      return i;
    });
  }, [queue.length]);

  const previous = useCallback(() => {
    setCurrentIndex(i => Math.max(0, i - 1));
  }, []);

  const value = {
    queue,
    currentIndex,
    currentTrack: queue[currentIndex] || null,
    isPlaying,
    setIsPlaying,
    playTrack,
    playAt,
    enqueue,
    next,
    previous,
    setQueue,
  };

  return (
    <PodcastPlayerContext.Provider value={value}>
      {children}
    </PodcastPlayerContext.Provider>
  );
};

export default PodcastPlayerContext;
