import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Blogs.css";
import { getBlog } from "../../services/blogsAPI";
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

const BlogSingle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const handleBack = () => navigateBackOr(navigate, "/blogs");
  const toast = useToast();
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const {
    comments,
    loadingComments,
    commentsError,
    submitComment
  } = useModeratedComments({
    contentType: "blog",
    contentId: blog?.id || id,
    contentTitle: blog?.title || "",
    contentSlug: blog?.slug || ""
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getBlog(id)
      .then(raw => {
        if (!mounted) return;
        if (!raw) {
          setError('Blog not found');
          setBlog(null);
          return;
        }

        setBlog(raw);
      })
      .catch(err => {
        if (!mounted) return;
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.error && parsed.error.status === 404) {
            setNotFound(true);
            setBlog(null);
            return;
          }
        } catch (e) {
          // not JSON, fallthrough
        }

        setError(err.message || 'Failed to load blog');
        setBlog(null);
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const galleryImages = [
    ...(blog?.thumbnail ? [{
      url: blog.thumbnail?.url || blog.thumbnail?.data?.attributes?.url,
      alt: blog.title || "Blog image"
    }] : []),
    ...((blog?.images || []).map((img, i) => ({
      url: img?.url || img?.data?.attributes?.url,
      alt: `blog visual ${i + 1}`
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
      <section className="blog-single-page">
        <PageSkeleton variant="detail" />
      </section>
    );
  }
  if (notFound) {
    return (
      <section className="blog-single-page">
        <PageErrorState
          title="Blog not found"
          message="This blog post does not exist or is no longer available."
          onBack={handleBack}
        />
      </section>
    );
  }
  if (error) {
    return (
      <section className="blog-single-page">
        <PageErrorState
          title="Unable to load blog"
          message={error}
          onRetry={() => window.location.reload()}
          onBack={handleBack}
        />
      </section>
    );
  }
  if (!blog) {
    return (
      <section className="blog-single-page">
        <PageErrorState
          title="Blog unavailable"
          message="The blog data is not available right now."
          onBack={handleBack}
        />
      </section>
    );
  }

  return (
    <section className="blog-single-page">
      <div className="blog-single-layout">
        <div className="blog-header">
          <h1>{blog.title}</h1>
        </div>

        <div className="blog-single-meta">
          <span className="blog-author">By {blog.author || 'Lit·loom'}</span>
          <span className="blog-date">{formatDate(blog.publishDate || blog.createdAt)}</span>
        </div>

        <div className="blog-content" dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(blog.content) }} />

        {galleryImages.length > 0 && (
          <div className="blog-images-grid" data-count={visibleGridImages.length}>
            {visibleGridImages.map((img, i) => (
              <button
                key={`${img.url}-${i}`}
                type="button"
                className={`blog-image-tile ${i === 0 && visibleGridImages.length >= 3 ? "is-main" : ""}`}
                onClick={() => openImageModal(i)}
                aria-label={`Open blog image ${i + 1}`}
              >
                <img src={resolveMediaUrl(img.url, "/placeholder.jpg")} alt={img.alt} />
                {hiddenImagesCount > 0 && i === visibleGridImages.length - 1 ? (
                  <span className="blog-image-more">+{hiddenImagesCount}</span>
                ) : null}
              </button>
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
      <FixedBackButton onClick={handleBack} ariaLabel="Back to Blogs" />
      <ContentActionDock
        actions={[
          { key: "share", label: "Share", onClick: () => setShowShareModal(true) },
          { key: "comment", label: "Comment", onClick: () => setShowCommentForm(true) }
        ]}
      />
      <ShareDialog
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share this blog"
        shareTitle={blog.title}
      />
      <CommentDialog
        open={showCommentForm}
        onClose={() => setShowCommentForm(false)}
        onSubmit={handleCommentSubmit}
      />
      {isImageModalOpen && galleryImages[activeImageIndex] && (
        <div className="blog-image-lightbox" onClick={closeImageModal} role="dialog" aria-modal="true" aria-label="Blog image viewer">
          <div
            className="blog-image-lightbox-panel"
            onClick={(event) => event.stopPropagation()}
            {...lightboxSwipeHandlers}
          >
            <button type="button" className="blog-lightbox-close" onClick={closeImageModal} aria-label="Close image viewer">
              x
            </button>
            <img
              src={resolveMediaUrl(galleryImages[activeImageIndex].url, "/placeholder.jpg")}
              alt={galleryImages[activeImageIndex].alt}
              className="blog-lightbox-image"
            />
            {galleryImages.length > 1 && (
              <>
                <button type="button" className="blog-lightbox-nav prev" onClick={showPreviousImage} aria-label="Previous image">
                  ‹
                </button>
                <button type="button" className="blog-lightbox-nav next" onClick={showNextImage} aria-label="Next image">
                  ›
                </button>
                <div className="blog-lightbox-counter">
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

export default BlogSingle;
