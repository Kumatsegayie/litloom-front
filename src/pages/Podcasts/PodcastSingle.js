import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import { useParams, useNavigate } from "react-router-dom";
import AdvancedPodcastPlayer from "./AdvancedPodcastPlayer";
import podcastsAPI from "../../services/podcastsAPI";
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
  const url = attrs.url || formats.thumbnail?.url || formats.small?.url || data.url || null;
  if (!url) return null;
  return toAbsoluteStrapiUrl(url);
};

const normalizeTag = (value) => String(value || "").trim().toLowerCase();

const countSharedTags = (left, right) => {
  const leftSet = new Set((Array.isArray(left) ? left : []).map(normalizeTag).filter(Boolean));
  if (leftSet.size === 0) return 0;
  let count = 0;
  (Array.isArray(right) ? right : []).forEach((tag) => {
    const normalized = normalizeTag(tag);
    if (!normalized) return;
    if (leftSet.has(normalized)) count += 1;
  });
  return count;
};
const PodcastSingle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const handleBack = () => navigateBackOr(navigate, "/podcasts");
  const toast = useToast();
  const location = useLocation();
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [podcast, setPodcast] = useState(null);
  const [error, setError] = useState(null);
  const [forcePlay, setForcePlay] = useState(Boolean(location?.state?.autoplay));
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);
  const playerCtx = usePodcastPlayer();
  const {
    comments,
    loadingComments,
    commentsError,
    submitComment
  } = useModeratedComments({
    contentType: "podcast",
    contentId: podcast?.slug || slug,
    contentTitle: podcast?.title || "",
    contentSlug: podcast?.slug || slug
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Try backend first (by slug)
        const p = await podcastsAPI.getPodcastBySlug(slug);
        if (!mounted) return;
        if (!p) {
          setPodcast(null);
          setIsLoading(false);
          return;
        }

        // Prepare episodes and suggestions
        let episodes = [];
        let suggestions = [];

        if (p.series && p.series.id) {
          const series = await podcastsAPI.getSeries(p.series.id);
          if (series && series.episodes) {
            episodes = series.episodes.map(e => ({
              id: e.id,
              title: e.title,
              audio: e.audio,
              cover: e.cover,
              duration: e.duration,
              episodeNumber: e.episodeNumber,
              publishDate: e.publishDate
            }));
          }
          // suggestions are other episodes in the same series (excluding current)
          suggestions = episodes.filter(e => String(e.id) !== String(p.id));
        } else {
          // Floating podcast: suggest only podcasts sharing at least one tag.
          const all = await podcastsAPI.getAllPodcasts();
          const related = all
            .filter((item) => String(item.id) !== String(p.id) && item.type === "floating")
            .map((item) => ({
              item,
              sharedTagCount: countSharedTags(p.tags, item.tags)
            }))
            .filter((entry) => entry.sharedTagCount > 0)
            .sort((a, b) => {
              if (b.sharedTagCount !== a.sharedTagCount) return b.sharedTagCount - a.sharedTagCount;
              return String(a.item.title || "").localeCompare(String(b.item.title || ""));
            })
            .slice(0, 6)
            .map(({ item }) => item);

          suggestions = related.map((s) => ({
            id: s.id,
            title: s.title,
            audio: s.audio,
            cover: s.cover,
            duration: s.duration,
            slug: s.slug,
            tags: Array.isArray(s.tags) ? s.tags : []
          }));
        }

        setPodcast({ ...p, episodes, suggestions });
      } catch (err) {
        console.error('Failed loading podcast', err);
        setError(err);
        setPodcast(null);
      } finally {
        setIsLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [slug]);

  useEffect(() => {
    // if navigated with autoplay flag, clear it after mounting
    if (location && location.state && location.state.autoplay) {
      setForcePlay(true);
      try {
        navigate(location.pathname, { replace: true, state: { ...location.state, autoplay: false } });
      } catch (e) {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setIsPlayerFullscreen(false);
  }, [slug]);

  if (isLoading) {
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
          title="Unable to load podcast"
          message={buildConnectionErrorMessage("Podcasts", error)}
          onBack={handleBack}
          onRetry={() => window.location.reload()}
        />
      </section>
    );
  }
  if (!podcast) {
    return (
      <section className="podcast-series-page">
        <PageErrorState
          title="Podcast not found"
          message="This podcast does not exist or is no longer available."
          onBack={handleBack}
          onRetry={() => window.location.reload()}
        />
      </section>
    );
  }

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

  const currentAudio = podcast?.audio;
  const currentEmbed = podcast?.embedUrl;
  const currentCover = podcast?.cover;
  const currentTitle = podcast?.title;
  const currentDescription = podcast?.description;
  const shareUrl = `${window.location.origin}/podcasts/${podcast?.slug || slug}`;

  const handleDownload = async () => {
    if (!podcast || !currentAudio) return;
    const output = sanitizeFilename(currentTitle || "podcast", "podcast");
    try {
      await directDownload(currentAudio, `${output}.mp3`);
    } catch (err) {
      console.error("Podcast download failed", err);
      toast.error("Download failed. Please try again.");
    }
  };

  // hide local page player when the global player is actively playing this same episode
  const isGlobalPlayingSame = (() => {
    try {
      if (!playerCtx || !playerCtx.currentTrack) return false;
      const g = playerCtx.currentTrack;
      if (g.id && String(g.id) === String(podcast.id)) return playerCtx.isPlaying;
      // compare resolved audio URLs when ids are not present
      const ga = g.audio || null;
      const ca = resolveMedia(currentAudio) || currentAudio || null;
      if (!ga || !ca) return false;
      return String(ga).startsWith('http') && String(ca).startsWith('http') && String(ga) === String(ca) && playerCtx.isPlaying;
    } catch (e) {
      return false;
    }
  })();

  return (
    <section className="podcast-series-page">
      <div className="podcast-series-layout">
        <div className="series-player">
          {!isGlobalPlayingSame && (
            <AdvancedPodcastPlayer
            src={currentAudio}
            embedUrl={currentEmbed}
            onRequestGlobalPlay={(meta) => {
              // prepare queue from podcast episodes if available, otherwise suggestions
              let tracks = [];
              if (podcast.episodes && podcast.episodes.length > 0) {
                tracks = podcast.episodes.map(e => ({
                  id: e.id,
                  title: e.title,
                  audio: e.audio,
                  cover: e.cover,
                  description: e.description,
                  slug: e.slug
                }));
                // start at current podcast index
                const idx = podcast.episodes.findIndex(e => String(e.id) === String(podcast.id));
                playerCtx.playTrack(tracks, idx >= 0 ? idx : 0);
              } else if (podcast.suggestions && podcast.suggestions.length > 0) {
                tracks = podcast.suggestions.map(s => ({
                  id: s.id,
                  title: s.title,
                  audio: s.audio,
                  cover: s.cover,
                  description: s.description,
                  slug: s.slug
                }));
                playerCtx.playTrack(tracks, 0);
              } else if (meta && meta.audio) {
                playerCtx.playTrack({ audio: meta.audio, title: meta.title, cover: meta.cover, description: meta.description });
              }
            }}
            cover={currentCover}
            title={currentTitle}
            description={currentDescription}
            titleBelowCover={true}
            episodes={podcast.episodes || []}
            currentEpisodeIndex={podcast.episodes ? podcast.episodes.findIndex(e => String(e.id) === String(podcast.id)) : -1}
            onEpisodeChange={(idx, opts) => {
              if (opts && opts.navigate && podcast.episodes && podcast.episodes[idx] && podcast.episodes[idx].slug) {
                navigate(`/podcasts/${podcast.episodes[idx].slug}`, { state: { autoplay: true } });
              }
            }}
            suggestions={podcast.suggestions || []}
            currentSuggestionIndex={-1}
            onSuggestionChange={(idx, opts) => {
              if (opts && opts.navigate && podcast.suggestions && podcast.suggestions[idx] && podcast.suggestions[idx].slug) {
                navigate(`/podcasts/${podcast.suggestions[idx].slug}`, { state: { autoplay: true } });
              }
            }}
            forcePlay={forcePlay}
            onAutoPlayHandled={() => setForcePlay(false)}
            isSeries={Boolean(podcast.episodes && podcast.episodes.length)}
            onFullscreenChange={setIsPlayerFullscreen}
            />
          )}
          {isGlobalPlayingSame && (
            <div className="global-now-playing">This episode is playing in the global player.</div>
          )}

          <div className="podcast-description-section">
            <h3>Description</h3>
            <div className="description-content">
              <div dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(currentDescription) }} />
            </div>
          </div>

          <div className="podcast-meta-info">
            <p className="podcast-host">By {podcast.uploader}</p>
          </div>

          <section className="comments-public">
            <h3>Comments</h3>
            <div className="comments-list">
              {loadingComments && <p>Loading comments...</p>}
              {!loadingComments && comments.length === 0 && <p>No public comments yet.</p>}
              {!loadingComments && comments.map((c) => (
                <CommentCard key={c.id || `${c.name}-${c.submittedAt}`} comment={c} />
              ))}
            </div>
            {commentsError && <p>{commentsError}</p>}
          </section>
        </div>

        <div className="series-episodes">
          <h3>Related podcasts</h3>
          <div className="suggestion-list">
            {podcast.suggestions && podcast.suggestions.length > 0 ? (
              podcast.suggestions.map((s) => {
                const coverUrl = resolveMedia(s.cover) || PLACEHOLDER_COVER;
                return (
                  <div key={s.id} className="suggestion-item" onClick={() => navigate(`/podcasts/floating/${s.slug}`)}>
                    <img src={coverUrl} alt={s.title} className="suggestion-thumb" />
                    <div className="suggestion-meta">
                      <p className="suggestion-title">{s.title}</p>
                      <p className="suggestion-sub">{s.duration || ''}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p>No podcast</p>
            )}
          </div>
        </div>
      </div>
      {!isPlayerFullscreen && (
        <FixedBackButton onClick={handleBack} ariaLabel="Back to Podcasts" />
      )}
      {!isPlayerFullscreen && (
        <ContentActionDock
          actions={[
            { key: "download", label: "Download", onClick: handleDownload, disabled: !currentAudio },
            { key: "share", label: "Share", onClick: () => setShowShareModal(true) },
            { key: "comment", label: "Comment", onClick: () => setShowCommentForm(true) }
          ]}
        />
      )}
      <ShareDialog
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share this podcast"
        shareUrl={shareUrl}
        shareTitle={currentTitle}
      />
      <CommentDialog
        open={showCommentForm}
        onClose={() => setShowCommentForm(false)}
        onSubmit={handleCommentSubmit}
      />
    </section>
  );
};

export default PodcastSingle;
