import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Articles.css";
import { getArticle } from "../../services/articlesAPI";
import { formatRichTextToHtml } from "../../utils/richText";
import { resolveMediaUrl } from "../../utils/media";
import useModeratedComments from "../../hooks/useModeratedComments";
import CommentCard from "../../components/comments/CommentCard";
import PageSkeleton from "../../components/ui/PageSkeleton";
import PageErrorState from "../../components/ui/PageErrorState";
import { navigateBackOr } from "../../utils/navigation";
import ContentActionDock from "../../components/contentActions/ContentActionDock";
import ShareDialog from "../../components/contentActions/ShareDialog";
import CommentDialog from "../../components/contentActions/CommentDialog";
import FixedBackButton from "../../components/contentActions/FixedBackButton";
import { useToast } from "../../components/toast/ToastProvider";
import useSwipeNavigation from "../../hooks/useSwipeNavigation";

const ArticleSingle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const handleBack = () => navigateBackOr(navigate, "/articles");
  const toast = useToast();
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const {
    comments,
    loadingComments,
    commentsError,
    submitComment
  } = useModeratedComments({
    contentType: "article",
    contentId: article?.id || id,
    contentTitle: article?.title || "",
    contentSlug: article?.slug || ""
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getArticle(id)
      .then(raw => {
        if (!mounted) return;
        if (!raw) {
          setError('Article not found');
          setArticle(null);
          return;
        }

        // Article data is already normalized by the API service
        setArticle(raw);
      })
      .catch(err => {
        if (!mounted) return;
        // detect Strapi-style JSON 404 responses thrown as text
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.error && parsed.error.status === 404) {
            setNotFound(true);
            setArticle(null);
            return;
          }
        } catch (e) {
          // not JSON, fallthrough
        }

        setError(err.message || 'Failed to load article');
        setArticle(null);
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const galleryImages = [
    ...(article?.thumbnail ? [{
      url: article.thumbnail?.url || article.thumbnail?.data?.attributes?.url,
      alt: article.title || "Article image"
    }] : []),
    ...((article?.images || []).map((img, i) => ({
      url: img?.url || img?.data?.attributes?.url,
      alt: `article visual ${i + 1}`
    })))
  ].filter((img) => Boolean(img.url));

  const visibleGridImages = galleryImages.slice(0, 5);
  const hiddenImagesCount = Math.max(galleryImages.length - visibleGridImages.length, 0);

  const openImageModal = (index) => {
    setActiveImageIndex(index);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  const showPreviousImage = () => {
    if (galleryImages.length < 2) return;
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const showNextImage = () => {
    if (galleryImages.length < 2) return;
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const lightboxSwipeHandlers = useSwipeNavigation({
    enabled: isImageModalOpen && galleryImages.length > 1,
    onSwipeLeft: showNextImage,
    onSwipeRight: showPreviousImage
  });

  useEffect(() => {
    if (!isImageModalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsImageModalOpen(false);
        return;
      }
      if (galleryImages.length > 1 && event.key === "ArrowLeft") {
        setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
      }
      if (galleryImages.length > 1 && event.key === "ArrowRight") {
        setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImageModalOpen, galleryImages.length]);

  if (loading) {
    return (
      <section className="article-single-page">
        <PageSkeleton variant="detail" />
      </section>
    );
  }
  if (notFound) {
    return (
      <section className="article-single-page">
        <PageErrorState
          title="Article not found"
          message="This article does not exist or is no longer available."
          onBack={handleBack}
        />
      </section>
    );
  }
  if (error) {
    return (
      <section className="article-single-page">
        <PageErrorState
          title="Unable to load article"
          message={error}
          onRetry={() => window.location.reload()}
          onBack={handleBack}
        />
      </section>
    );
  }
  if (!article || article.type !== "post") {
    return (
      <section className="article-single-page">
        <PageErrorState
          title="Article unavailable"
          message="The article data is not available right now."
          onBack={handleBack}
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

  return (
    <section className="article-single-page">
      <div className="article-single-layout">
        <div className="article-header">
          <h1>{article.title}</h1>
        </div>

        <div className="article-single-meta">
          <span className="article-author">By {article.author}</span>
          <span className="article-date">{formatDate(article.publishDate || article.createdAt)}</span>
        </div>

        <div className="article-content" dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(article.content) }} />

        {galleryImages.length > 0 && (
          <div className="article-images-grid" data-count={visibleGridImages.length}>
            {visibleGridImages.map((img, i) => (
              <button
                key={`${img.url}-${i}`}
                type="button"
                className={`article-image-tile ${i === 0 && visibleGridImages.length >= 3 ? "is-main" : ""}`}
                onClick={() => openImageModal(i)}
                aria-label={`Open article image ${i + 1}`}
              >
                <img src={resolveMediaUrl(img.url, "/placeholder.jpg")} alt={img.alt} />
                {hiddenImagesCount > 0 && i === visibleGridImages.length - 1 ? (
                  <span className="article-image-more">+{hiddenImagesCount}</span>
                ) : null}
              </button>
            ))}
          </div>
        )}

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
      <FixedBackButton onClick={handleBack} ariaLabel="Back to Articles" />
      <ContentActionDock
        actions={[
          { key: "share", label: "Share", onClick: () => setShowShareModal(true) },
          { key: "comment", label: "Comment", onClick: () => setShowCommentForm(true) }
        ]}
      />
      <ShareDialog
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share this article"
        shareTitle={article.title}
      />
      <CommentDialog
        open={showCommentForm}
        onClose={() => setShowCommentForm(false)}
        onSubmit={handleCommentSubmit}
      />
      {isImageModalOpen && galleryImages[activeImageIndex] && (
        <div className="article-image-lightbox" onClick={closeImageModal} role="dialog" aria-modal="true" aria-label="Article image viewer">
          <div
            className="article-image-lightbox-panel"
            onClick={(event) => event.stopPropagation()}
            {...lightboxSwipeHandlers}
          >
            <button type="button" className="article-lightbox-close" onClick={closeImageModal} aria-label="Close image viewer">
              x
            </button>
            <img
              src={resolveMediaUrl(galleryImages[activeImageIndex].url, "/placeholder.jpg")}
              alt={galleryImages[activeImageIndex].alt}
              className="article-lightbox-image"
            />
            {galleryImages.length > 1 && (
              <>
                <button type="button" className="article-lightbox-nav prev" onClick={showPreviousImage} aria-label="Previous image">
                  ‹
                </button>
                <button type="button" className="article-lightbox-nav next" onClick={showNextImage} aria-label="Next image">
                  ›
                </button>
                <div className="article-lightbox-counter">
                  {activeImageIndex + 1} / {galleryImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ArticleSingle;
