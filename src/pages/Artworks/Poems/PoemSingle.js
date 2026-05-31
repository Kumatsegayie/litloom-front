import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPoem } from "../../../services/poemsAPI";
import { formatRichTextToHtml } from "../../../utils/richText";
import { resolveMediaUrl } from "../../../utils/media";
import useModeratedComments from "../../../hooks/useModeratedComments";
import CommentCard from "../../../components/comments/CommentCard";
import PageSkeleton from "../../../components/ui/PageSkeleton";
import PageErrorState from "../../../components/ui/PageErrorState";
import { navigateBackOr } from "../../../utils/navigation";
import ContentActionDock from "../../../components/contentActions/ContentActionDock";
import ShareDialog from "../../../components/contentActions/ShareDialog";
import CommentDialog from "../../../components/contentActions/CommentDialog";
import FixedBackButton from "../../../components/contentActions/FixedBackButton";
import { useToast } from "../../../components/toast/ToastProvider";
import "./Poems.css";

const PoemSingle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const handleBack = () => navigateBackOr(navigate, "/poems");
  const toast = useToast();
  const [poem, setPoem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);
  const {
    comments,
    loadingComments,
    commentsError,
    submitComment
  } = useModeratedComments({
    contentType: "poem",
    contentId: poem?.id || id,
    contentTitle: poem?.title || "",
    contentSlug: poem?.slug || ""
  });

  useEffect(() => {
    const fetchPoem = async () => {
      try {
        const data = await getPoem(id);
        if (data) {
          setPoem(data);
        } else {
          setError("Poem not found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPoem();
  }, [id]);

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

  const handleShowMoreImages = () => {
    setShowAllImages(true);
  };

  if (loading) {
    return (
      <section className="poem-single-page">
        <PageSkeleton variant="detail" />
      </section>
    );
  }
  if (error) {
    return (
      <section className="poem-single-page">
        <PageErrorState
          title="Unable to load poem"
          message={error}
          onRetry={() => window.location.reload()}
          onBack={handleBack}
        />
      </section>
    );
  }
  if (!poem) {
    return (
      <section className="poem-single-page">
        <PageErrorState
          title="Poem not found"
          message="This poem does not exist or is no longer available."
          onBack={handleBack}
        />
      </section>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <section className="poem-single-page">
      <div className="poem-single-layout">
        <div className="poem-header">
          <h1>{poem.title}</h1>
        </div>

        <div className="poem-single-meta">
          <span className="poem-author">By {poem.author}</span>
          <span className="poem-date">{formatDate(poem.createdAt)}</span>
        </div>

        <div className="poem-content">
          <div className="poem-text" dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(poem.content) }} />

          {poem.images && poem.images.length > 0 && (
            <div className={`poem-images-grid ${showAllImages ? 'show-all' : ''}`} data-total-images={poem.images.length}>
              {poem.images.map((img, i) => (
                <img
                  key={i}
                  src={resolveMediaUrl(img, "/placeholder.jpg")}
                  alt={`poem visual ${i + 1}`}
                  className={i === 2 && poem.images.length > 3 && !showAllImages ? 'has-overlay' : ''}
                  data-extra-count={poem.images.length - 3}
                  onClick={i === 2 && poem.images.length > 3 && !showAllImages ? handleShowMoreImages : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <section className="comments-public">
          <h3>Comments</h3>
          <div className="comments-list">
            {loadingComments && <p>Loading comments...</p>}
            {!loadingComments && comments.length === 0 && <p>No public comments yet.</p>}
            {!loadingComments && comments.map(c => (
              <CommentCard key={c.id || `${c.name}-${c.submittedAt}`} comment={c} />
            ))}
          </div>
          {commentsError && <p>{commentsError}</p>}
        </section>
      </div>
      <FixedBackButton onClick={handleBack} ariaLabel="Back to Poems" />
      <ContentActionDock
        actions={[
          { key: "share", label: "Share", onClick: () => setShowShareModal(true) },
          { key: "comment", label: "Comment", onClick: () => setShowCommentForm(true) }
        ]}
      />
      <ShareDialog
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share this poem"
        shareTitle={poem.title}
      />
      <CommentDialog
        open={showCommentForm}
        onClose={() => setShowCommentForm(false)}
        onSubmit={handleCommentSubmit}
      />
    </section>
  );
};

export default PoemSingle;
