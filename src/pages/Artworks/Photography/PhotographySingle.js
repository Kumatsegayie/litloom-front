import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Share2, Maximize, Download, MessageCircle } from "lucide-react";
import { getPhoto } from "../../../services/photographyAPI";
import { formatRichTextToHtml } from "../../../utils/richText";
import { buildConnectionErrorMessage } from "../../../utils/errorUtils";
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
import { directDownload, sanitizeFilename } from "../../../utils/directDownload";
import useSwipeNavigation from "../../../hooks/useSwipeNavigation";
import "../Paintings/Paintings.css";

const PhotographySingle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const handleBack = () => navigateBackOr(navigate, "/photos");
  const toast = useToast();
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setFullScreen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (fullScreen) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("fullscreen-open");
    } else {
      document.body.style.overflow = "";
      document.body.classList.remove("fullscreen-open");
    }
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("fullscreen-open");
    };
  }, [fullScreen]);

  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const imagesArray = photo && photo.images
    ? (Array.isArray(photo.images) ? photo.images : [photo.images])
    : [];
  const hasMultipleImages = imagesArray.length > 1;

  const goPreviousImage = useCallback(() => {
    setGalleryIndex((index) => Math.max(0, index - 1));
  }, []);

  const goNextImage = useCallback(() => {
    setGalleryIndex((index) => Math.min(imagesArray.length - 1, index + 1));
  }, [imagesArray.length]);

  const gallerySwipeHandlers = useSwipeNavigation({
    enabled: hasMultipleImages,
    onSwipeLeft: goNextImage,
    onSwipeRight: goPreviousImage
  });

  const fullscreenSwipeHandlers = useSwipeNavigation({
    enabled: fullScreen && hasMultipleImages,
    onSwipeLeft: goNextImage,
    onSwipeRight: goPreviousImage
  });

  const {
    comments,
    loadingComments,
    commentsError,
    submitComment
  } = useModeratedComments({
    contentType: "photo",
    contentId: photo?.id || id,
    contentTitle: photo?.title || "",
    contentSlug: photo?.slug || ""
  });

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
    const mediaUrl = imagesArray[galleryIndex] || photo.image;
    if (!mediaUrl) return;
    const file = sanitizeFilename(photo.title || "photo", "photo");
    try {
      await directDownload(mediaUrl, `${file}.jpg`);
    } catch (err) {
      console.error("Photo download failed", err);
      toast.error("Download failed. Please try again.");
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getPhoto(id)
      .then((p) => { if (!mounted) return; setPhoto(p); })
      .catch((err) => { if (!mounted) return; setError(err); })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    setGalleryIndex(0);
  }, [photo?.id]);

  useEffect(() => {
    if (!fullScreen || !hasMultipleImages) return undefined;
    const handleKey = (event) => {
      if (event.key === "ArrowLeft") goPreviousImage();
      if (event.key === "ArrowRight") goNextImage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [fullScreen, hasMultipleImages, goPreviousImage, goNextImage]);

  if (loading) {
    return (
      <section className="home-container">
        <PageSkeleton variant="detail" />
      </section>
    );
  }
  if (error || !photo) {
    return (
      <section className="home-container">
        <PageErrorState
          title={error ? "Unable to load photo" : "Photo not found"}
          message={error ? buildConnectionErrorMessage("Photography", error) : "This photo does not exist or is no longer available."}
          onRetry={error ? () => window.location.reload() : undefined}
          onBack={handleBack}
        />
      </section>
    );
  }

  return (
    <section className="painting-single home-container">
      <div className="painting-header">
        <h1>{photo.title}</h1>
      </div>

      <div className="painting-single-layout">
        <div className="painting-full">
          {(() => {
            if (imagesArray.length > 0) {
              return (
                <div className="gallery-view" {...gallerySwipeHandlers}>
                  <img src={imagesArray[galleryIndex]} alt={`${photo.title} ${galleryIndex + 1}`} />
                  {hasMultipleImages && (
                    <div className="gallery-controls">
                      <button onClick={goPreviousImage} aria-label="Previous image">◀</button>
                      <span>{galleryIndex + 1} / {imagesArray.length}</span>
                      <button onClick={goNextImage} aria-label="Next image">▶</button>
                    </div>
                  )}
                </div>
              );
            }
            return <img src={photo.image} alt={photo.title} />;
          })()}
          <button className="image-overlay-btn" onClick={() => setFullScreen(true)} aria-label="View fullscreen">
            <Maximize size={16} />
          </button>
        </div>

        <div className="painting-details">
          <p className="painting-author">{photo.photographer}</p>
          <p className="painting-meta">{photo.category} • {photo.year}</p>

          <div className="painting-description">
            <div dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(photo.description) }} />
          </div>
        </div>
      </div>

      <section className="comments-public">
        <h3>Others’ comments</h3>

        <div className="comments-list">
          {loadingComments && <p>Loading comments...</p>}
          {!loadingComments && comments.length === 0 && <p>No public comments yet.</p>}
          {!loadingComments && comments.map((c) => (
            <CommentCard key={c.id || `${c.name}-${c.submittedAt}`} comment={c} />
          ))}
        </div>
        {commentsError && <p>{commentsError}</p>}
      </section>

      {fullScreen && (
        <div className="fullscreen-overlay" onClick={() => setFullScreen(false)}>
          <div className="fullscreen-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fullscreen-toolbar">
              <button className="modal-close" onClick={() => setFullScreen(false)}>✕</button>
              <div className="toolbar-actions">
                <button className="action-btn" onClick={() => setShowCommentForm(true)} aria-label="Comment">
                  <MessageCircle size={16} />
                </button>
                <button className="action-btn" onClick={() => setShowShareModal(true)} aria-label="Share">
                  <Share2 size={16} />
                </button>
                <button className="action-btn" onClick={handleDownload} aria-label="Download">
                  <Download size={16} />
                </button>
              </div>
            </div>
            <div className="fullscreen-image-wrap" {...fullscreenSwipeHandlers}>
              {(() => {
                const src = imagesArray.length > 0 ? imagesArray[galleryIndex] : photo.image;
                return <img src={src} alt={photo.title} className="fullscreen-image" />;
              })()}
              {hasMultipleImages && (
                <div className="fullscreen-gallery-controls">
                  <button onClick={goPreviousImage} aria-label="Previous image">◀</button>
                  <span>{galleryIndex + 1} / {imagesArray.length}</span>
                  <button onClick={goNextImage} aria-label="Next image">▶</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {!fullScreen && (
        <FixedBackButton onClick={handleBack} ariaLabel="Back to Photography" />
      )}
      {!fullScreen && (
        <ContentActionDock
          actions={[
            { key: "download", label: "Download", onClick: handleDownload },
            { key: "share", label: "Share", onClick: () => setShowShareModal(true) },
            { key: "comment", label: "Comment", onClick: () => setShowCommentForm(true) }
          ]}
        />
      )}
      <ShareDialog
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share this photo"
        shareTitle={photo.title}
      />
      <CommentDialog
        open={showCommentForm}
        onClose={() => setShowCommentForm(false)}
        onSubmit={handleCommentSubmit}
      />
    </section>
  );
};

export default PhotographySingle;
