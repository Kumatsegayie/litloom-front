import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import podcastsAPI from "../../services/podcastsAPI";
import AdvancedPodcastPlayer from "./AdvancedPodcastPlayer";
import { usePodcastPlayer } from '../../contexts/PodcastPlayerContext';
import { formatRichTextToHtml } from "../../utils/richText";
import { buildConnectionErrorMessage } from "../../utils/errorUtils";
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

const FloatingPodcast = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const handleBack = () => navigateBackOr(navigate, "/podcasts");
  const toast = useToast();
  const [podcast, setPodcast] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [nowPlayingUrl, setNowPlayingUrl] = useState(null);
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
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await podcastsAPI.getPodcastBySlug(slug);
        if (!p) {
          if (mounted) setPodcast(null);
          return;
        }
        if (!mounted) return;
        // Floating podcast suggestions: only items sharing at least one tag.
        const all = await podcastsAPI.getAllPodcasts();
        const suggestions = (all || [])
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
        setPodcast({ ...p, suggestions });
      } catch (err) {
        if (mounted) setError(err);
        if (mounted) setPodcast(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  useEffect(() => {
    setIsPlayerFullscreen(false);
  }, [slug]);

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

  const handleDownload = async () => {
    const mediaUrl = nowPlayingUrl || (podcast && podcast.audio) || null;
    if (!mediaUrl) {
      toast.info("No audio available to download");
      return;
    }
    const filename = sanitizeFilename(podcast?.title || "podcast", "podcast");
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
          {podcast ? (
            <>
              {playerCtx.currentTrack && String(playerCtx.currentTrack.id) === String(podcast.id) ? (
                <div className="global-now-playing">This episode is playing in the global player.</div>
              ) : (
                <AdvancedPodcastPlayer
                  src={podcast.audio}
                  embedUrl={podcast.embedUrl || null}
                  cover={podcast.cover}
                  title={podcast.title}
                  titleBelowCover={true}
                  suggestions={podcast.suggestions || []}
                  currentSuggestionIndex={-1}
                  onSuggestionChange={(idx, opts) => {
                    if (opts && opts.navigate && podcast.suggestions && podcast.suggestions[idx] && podcast.suggestions[idx].slug) {
                      navigate(`/podcasts/floating/${podcast.suggestions[idx].slug}`);
                    }
                  }}
                  onAudioChange={(url) => setNowPlayingUrl(url)}
                  onRequestGlobalPlay={(meta) => {
                    // play as single-track in global player
                    if (meta && meta.audio) playerCtx.playTrack({ audio: meta.audio, title: meta.title, cover: meta.cover });
                  }}
                  onFullscreenChange={setIsPlayerFullscreen}
                />
              )}

              <div className="podcast-description-section">
                <h3>Description</h3>
                <div className="description-content">
                  <div dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(podcast.description) }} />
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
                {/* write comment button intentionally removed; comments handled via modal trigger elsewhere */}
              </div>
            </>
          ) : null}
        </div>

        <div className="series-episodes">
          <h3>Related podcasts</h3>
          <div className="suggestion-list">
            {podcast.suggestions && podcast.suggestions.length > 0 ? (
              podcast.suggestions.map((s) => {
                const coverUrl = s.cover || PLACEHOLDER_COVER;
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
            { key: "download", label: "Download", onClick: handleDownload, disabled: !(nowPlayingUrl || podcast?.audio) },
            { key: "share", label: "Share", onClick: () => setShowShareModal(true) },
            { key: "comment", label: "Comment", onClick: () => setShowCommentForm(true) }
          ]}
        />
      )}
      <ShareDialog
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share this podcast"
        shareUrl={`${window.location.origin}/podcasts/floating/${podcast?.slug || slug}`}
        shareTitle={podcast?.title}
      />
      <CommentDialog
        open={showCommentForm}
        onClose={() => setShowCommentForm(false)}
        onSubmit={handleCommentSubmit}
      />
    </section>
  );
};

export default FloatingPodcast;
