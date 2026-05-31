import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Clock, Upload, Layers, Mic } from "lucide-react";
import podcastsAPI from "../../services/podcastsAPI";
import { getRichTextPreview } from "../../utils/richText";
import { buildConnectionErrorMessage } from "../../utils/errorUtils";
import PageSkeleton from "../../components/ui/PageSkeleton";
import PageErrorState from "../../components/ui/PageErrorState";
import PageDiscoverTitle from "../../components/ui/PageDiscoverTitle";
import "./Podcasts.css";
import { PLACEHOLDER_COVER } from "../../utils/placeholder";

const PodcastsList = () => {
  const navigate = useNavigate();
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const list = await podcastsAPI.getAllPodcasts();
        if (!mounted) return;
        setPodcasts(list || []);
      } catch (err) {
        console.error('Failed to load podcasts', err);
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const makeSlug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  if (loading) {
    return (
      <section className="podcasts-page">
        <PageDiscoverTitle title="Podcasts" />
        <PageSkeleton
          variant="feed"
          cardCount={6}
          feedClassName="podcasts-feed"
          cardClassName="podcast-card"
          thumbClassName="podcast-thumb"
          bodyClassName="podcast-info"
          rows={["short", "mid", "full"]}
        />
      </section>
    );
  }

  if (error) {
    return (
      <section className="podcasts-page">
        <PageDiscoverTitle title="Podcasts" />
        <PageErrorState
          title="Unable to load podcasts"
          message={buildConnectionErrorMessage("Podcasts", error)}
          onRetry={() => window.location.reload()}
          onBack={() => navigate("/")}
        />
      </section>
    );
  }

  return (
    <section className="podcasts-page">
      <PageDiscoverTitle title="Podcasts" />

      <div className="podcasts-feed">
        {podcasts.length === 0 && (
          <p>No podcasts found.</p>
        )}

        {podcasts.map(podcast => (
          <article
            key={podcast.id}
            className={`podcast-card ${podcast.type === 'series' ? 'podcast-series-card' : ''}`}
            onClick={() => {
              const slug = podcast.slug || makeSlug(podcast.title || '');
              if (podcast.type === "series") navigate(`/podcasts/series/${slug}`);
              else navigate(`/podcasts/floating/${slug}`);
            }}
          >
            <div className="podcast-thumb">
              <img src={podcast.cover || podcast.coverUrl || PLACEHOLDER_COVER} alt={podcast.title} />
              {podcast.type === 'series' && (
                <>
                  <div className="thumb-overlay" aria-hidden="true"></div>
                  <div className="thumb-badge">
                    <Layers size={14} />
                    <span className="badge-text">{(podcast.episodes && podcast.episodes.length) || (typeof podcast.duration === 'string' ? podcast.duration : '')}</span>
                  </div>
                </>
              )}
              <div className="play-overlay">
                <Play size={24} fill="white" />
              </div>
            </div>

            <div className="podcast-info">
              <div className="info-top-row">
                <span className="uploader-left">{podcast.host}</span>
                {podcast.type === 'floating' && (
                  <span className="episode-duration-top">
                    <span className="duration-text"><Clock size={14} /> {podcast.duration || ''}</span>
                  </span>
                )}
              </div>
              <h2>{podcast.title}</h2>
              {podcast.description && (
                <p className="podcast-preview">{getRichTextPreview(podcast.description, 120)}</p>
              )}
              <div className="podcast-meta">
                <span className="podcast-type" aria-label={podcast.type === 'floating' ? 'Episode' : 'Series'} title={podcast.type === 'floating' ? 'Episode' : 'Series'}>
                  {podcast.type === 'floating' ? <Mic size={16} /> : <Layers size={16} />}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      

      {/* Floating Action Button */}
      <div className="podcast-actions">
        <button className="action-btn upload-btn" onClick={() => navigate('/podcast-submission')} aria-label="Submit a podcast">
          <Upload size={20} />
        </button>
      </div>
    </section>
  );
};

export default PodcastsList;
