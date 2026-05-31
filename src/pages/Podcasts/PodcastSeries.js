import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import podcastsAPI from "../../services/podcastsAPI"; 
import AdvancedPodcastPlayer from "./AdvancedPodcastPlayer";
import { usePodcastPlayer } from '../../contexts/PodcastPlayerContext';
import { formatRichTextToHtml } from "../../utils/richText";
import { buildConnectionErrorMessage } from "../../utils/errorUtils";
import { toAbsoluteStrapiUrl } from "../../services/strapiBaseURL";
import useModeratedComments from "../../hooks/useModeratedComments";
import CommentCard from "../../components/comments/CommentCard";
import PageSkeleton from "../../components/ui/PageSkeleton";
import PageErrorState from "../../components/ui/PageErrorState";
import "./Podcasts.css";
import { PLACEHOLDER_COVER } from "../../utils/placeholder";
import { navigateBackOr } from "../../utils/navigation";
import ContentActionDock from "../../components/contentActions/ContentActionDock";
import ShareDialog from "../../components/contentActions/ShareDialog";
import CommentDialog from "../../components/contentActions/CommentDialog";
import FixedBackButton from "../../components/contentActions/FixedBackButton";
import { useToast } from "../../components/toast/ToastProvider";
import { directDownload, sanitizeFilename } from "../../utils/directDownload";

const resolveMedia = (media) => {
  if (!media) return null;
  if (typeof media === 'string') return toAbsoluteStrapiUrl(media);
  const data = media.data || media;
  const attrs = data.attributes || {};
  const formats = attrs.formats || {};
  // prefer direct url, then formats, then url on root
  const url = attrs.url || formats.thumbnail?.url || formats.small?.url || data.url || null;
  if (!url) return null;
  return toAbsoluteStrapiUrl(url);
};

const PodcastSeries = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const handleBack = () => navigateBackOr(navigate, "/podcasts");
  const toast = useToast();
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [series, setSeries] = useState(null);
  const [error, setError] = useState(null);
  const [floatingFallbackAudio, setFloatingFallbackAudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [nowPlayingUrl, setNowPlayingUrl] = useState(null);
  const [forcePlay, setForcePlay] = useState(false);
  const [fetchedDescription, setFetchedDescription] = useState(null);
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);
  const playerCtx = usePodcastPlayer();
  const {
    comments,
    loadingComments,
    commentsError,
    submitComment
  } = useModeratedComments({
    contentType: "podcast",
    contentId: String(currentEpisode?.slug || currentEpisode?.id || slug),
    contentTitle: currentEpisode?.title || series?.title || "",
    contentSlug: currentEpisode?.slug || series?.slug || slug
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      let data = null;
      setError(null);
      try {
        data = await podcastsAPI.getSeriesBySlug(slug);
        // also fetch floating podcasts to use as fallback audio if episodes don't have audio
        try {
          const all = await podcastsAPI.getAllPodcasts();
          const floating = (all || []).find(i => i.type === 'floating');
          if (floating && floating.audio) setFloatingFallbackAudio(floating.audio);
        } catch {}
        if (mounted) {
          // normalize/sort episodes so series always starts with the first episode
          if (data && data.episodes && data.episodes.length > 0) {
            const sorted = [...data.episodes].sort((a, b) => {
              const aKey = (a.episodeNumber ?? a.id) || 0;
              const bKey = (b.episodeNumber ?? b.id) || 0;
              return aKey - bKey;
            });
            data.episodes = sorted;
          }
          setSeries(data);
          // ensure we start on the first episode
          if (data && data.episodes && data.episodes.length > 0) {
            setCurrentEpisode(data.episodes[0]);
          }
        }
      } catch (err) {
        if (mounted) setError(err);
        if (mounted) setSeries(null);
      } finally {
        // default to first episode when viewing a series
        if (data && data.episodes && data.episodes.length > 0) {
          setCurrentEpisode(data.episodes[0]);
        }
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  useEffect(() => {
    setIsPlayerFullscreen(false);
  }, [slug]);

  // Fetch full episode details (description) when currentEpisode changes
  const currentEpisodeSlug = currentEpisode?.slug || "";
  const currentEpisodeId = currentEpisode?.id || "";

  useEffect(() => {
    let mounted = true;
    setFetchedDescription(null);
    if (!currentEpisodeSlug && !currentEpisodeId) return () => { mounted = false; };
    (async () => {
      try {
        const detail = await podcastsAPI.getPodcastBySlug(currentEpisodeSlug || currentEpisodeId);
        if (!mounted) return;
        setFetchedDescription(detail?.description || null);
      } catch {
        if (mounted) setFetchedDescription(null);
      }
    })();
    return () => { mounted = false; };
  }, [currentEpisodeSlug, currentEpisodeId]);

  if (loading) {
    return (
      <section className="podcast-series-page">
        <PageSkeleton variant="detail" />
      </section>
    );
  }
  if (error) {
    return (
      <section className="podcast-series-page">
        <PageErrorState
          title="Unable to load podcast series"
          message={buildConnectionErrorMessage("Podcasts", error)}
          onBack={handleBack}
          onRetry={() => window.location.reload()}
        />
      </section>
    );
  }
  if (!series) {
    return (
      <section className="podcast-series-page">
        <PageErrorState
          title="Series not found"
          message="This podcast series does not exist or is no longer available."
          onBack={handleBack}
          onRetry={() => window.location.reload()}
        />
      </section>
    );
  }

  const currentEpisodeIndex = currentEpisode ? series.episodes.findIndex(ep => ep.id === currentEpisode.id) : -1;

  const handleEpisodeChange = (newIndex, opts = {}) => {
    if (series.episodes[newIndex]) {
      const ep = series.episodes[newIndex];
      // If parent requested navigation (player next/previous), navigate to the episode page
      if (opts && opts.navigate && ep.slug) {
        navigate(`/podcasts/${ep.slug}`, { state: { autoplay: true } });
        return;
      }
      setCurrentEpisode(ep);
      setForcePlay(true);
    }
  };

  // compute the src to pass to player: prefer currentEpisode.audio, then any episode with audio, then floating fallback
  const playerSrc = (
    (currentEpisode && currentEpisode.audio) ||
    (series && series.episodes && series.episodes.find(ep => ep.audio)?.audio) ||
    floatingFallbackAudio ||
    null
  );

  const handleCommentSubmit = async ({ name, email, content, reset }) => {
    const result = await submitComment({
      name,
      email,
      comment: content,
      pageUrl: window.location.href
    });
    if (!result.ok) {
      toast.error(result.message || "Failed to submit comment");
      return;
    }
    toast.success("Comment submitted. It will be visible after admin approval.");
    setShowCommentForm(false);
    if (typeof reset === "function") reset();
  };

  const getMediaUrl = (media) => {
    if (!media) return null;
    if (typeof media === 'string') return toAbsoluteStrapiUrl(media);
    const data = media.data || media;
    const url = data?.attributes?.url || data?.url || null;
    if (!url) return null;
    return toAbsoluteStrapiUrl(url);
  };

  const handleRequestGlobalPlay = (meta) => {
    if (!series || !series.episodes) return;
    const tracks = series.episodes.map(ep => ({
      id: ep.id,
      title: ep.title,
      audio: getMediaUrl(ep.audio),
      cover: resolveMedia(ep.cover) || resolveMedia(series?.thumbnail) || resolveMedia(series?.cover) || PLACEHOLDER_COVER,
      description: ep.description,
      slug: ep.slug
    }));
    const idx = currentEpisodeIndex >= 0 ? currentEpisodeIndex : 0;
    playerCtx.playTrack(tracks, idx);
  };

  const handleDownload = async () => {
    // prefer the currently playing audio URL if available
    const mediaUrl = nowPlayingUrl || getMediaUrl(currentEpisode?.audio);
    if (!mediaUrl) {
      toast.info("No audio available to download");
      return;
    }
    const filename = sanitizeFilename(currentEpisode?.title || series?.title || "podcast", "podcast");
    try {
      await directDownload(mediaUrl, `${filename}.mp3`);
    } catch (err) {
      toast.error("Download failed. Please try again.");
    }
  };

  return (
    <section className="podcast-series-page">
      <div className="podcast-series-layout">
        <div className="series-player">
          {currentEpisode ? (
            <>
              {/* If the global player is active and playing this episode, hide local player UI */}
              {playerCtx.currentTrack && String(playerCtx.currentTrack.id) === String(currentEpisode.id) ? (
                <div className="global-now-playing">This episode is playing in the global player.</div>
              ) : (
                <AdvancedPodcastPlayer
                  src={playerSrc}
                  embedUrl={currentEpisode?.embedUrl || null}
                  onRequestGlobalPlay={handleRequestGlobalPlay}
                  cover={currentEpisode.cover || series.thumbnail || series.cover}
                  title={currentEpisode.title}
                  description={currentEpisode.description}
                  titleBelowCover={true}
                  episodes={series.episodes}
                  currentEpisodeIndex={currentEpisodeIndex}
                  onEpisodeChange={handleEpisodeChange}
                  onAudioChange={(url) => setNowPlayingUrl(url)}
                  forcePlay={forcePlay}
                  onAutoPlayHandled={() => setForcePlay(false)}
                  isSeries={true}
                  onFullscreenChange={setIsPlayerFullscreen}
                />
              )}

              {/* description shown below in the Description section above comments */}
            </>
          ) : (
            <>
              <h1>{series.title}</h1>
              <h4>{series.host}</h4>
              <p>{series.description}</p>
            </>
          )}

              <div className="podcast-description-section">
                <h3>Description</h3>
                <div className="description-content">
                  <div dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(fetchedDescription || currentEpisode?.description || series?.description) }} />
                </div>
              </div>

          <div className="comments-public">
            <h3>Comments</h3>
            <div className="comments-list">
              {loadingComments && <p>Loading comments...</p>}
              {!loadingComments && comments.length === 0 && <p>No public comments yet.</p>}
              {!loadingComments && comments.map(c => (
                <CommentCard key={c.id || `${c.name}-${c.submittedAt}`} comment={c} />
              ))}
            </div>
            {commentsError && <p>{commentsError}</p>}
          </div>
        </div>

        <div className="series-episodes">
          <h3>Episodes ({series.episodes.length})</h3>
          {series.episodes
            .sort((a, b) => a.id - b.id) // Sort by episode ID (assuming ID represents episode number)
                .map((ep, index) => {
              const coverUrl = resolveMedia(ep.cover) || resolveMedia(series?.thumbnail) || resolveMedia(series?.cover) || PLACEHOLDER_COVER;

              return (
                <div
                  key={ep.id}
                  className={`episode-card suggestion-item ${currentEpisode && currentEpisode.id === ep.id ? 'active' : ''}`}
                      onClick={() => handleEpisodeChange(index)}
                >
                  <img src={coverUrl} alt={ep.title} className="suggestion-thumb" />
                  <div className="episode-content suggestion-meta">
                          <h4 className="episode-title suggestion-title">{ep.title}</h4>
                          <div className="episode-meta">
                        <span className="episode-duration">{ep.duration}</span>
                        {ep.publishDate && (
                          <span className="episode-date">{new Date(ep.publishDate).toLocaleDateString()}</span>
                        )}
                        {currentEpisode && currentEpisode.id === ep.id && (
                          <span className="now-playing">Now Playing</span>
                        )}
                      
                      </div>
                      
                    </div>
                </div>
              );
            })}

          </div>
        </div>
        {!isPlayerFullscreen && (
          <FixedBackButton onClick={handleBack} ariaLabel="Back to Podcasts" />
        )}
        {!isPlayerFullscreen && (
          <ContentActionDock
            actions={[
              { key: "download", label: "Download", onClick: handleDownload, disabled: !(nowPlayingUrl || getMediaUrl(currentEpisode?.audio)) },
              { key: "share", label: "Share", onClick: () => setShowShareModal(true) },
              { key: "comment", label: "Comment", onClick: () => setShowCommentForm(true) }
            ]}
          />
        )}
        <ShareDialog
          open={showShareModal}
          onClose={() => setShowShareModal(false)}
          title="Share this episode"
          shareUrl={`${window.location.origin}/podcasts/${currentEpisode?.slug || series?.slug}`}
          shareTitle={currentEpisode?.title || series?.title}
        />
        <CommentDialog
          open={showCommentForm}
          onClose={() => setShowCommentForm(false)}
          onSubmit={handleCommentSubmit}
        />
      </section>
    );

};

// Share Modal outside component return for clarity (rendered conditionally via state)

export default PodcastSeries;

