import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBook } from "../../services/booksAPI";
import { toAbsoluteStrapiUrl } from "../../services/strapiBaseURL";
import { formatRichTextToHtml } from "../../utils/richText";
import { buildConnectionErrorMessage } from "../../utils/errorUtils";
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
import { directDownload, openPdfReader, sanitizeFilename } from "../../utils/directDownload";
import "./Books.css";

const BookSingle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const handleBack = () => navigateBackOr(navigate, "/books");
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const toast = useToast();
  const {
    comments,
    loadingComments,
    commentsError,
    submitComment
  } = useModeratedComments({
    contentType: "book",
    contentId: book?.id || id,
    contentTitle: book?.title || "",
    contentSlug: book?.slug || ""
  });

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const bookData = await getBook(id);
        if (bookData) {
          setBook(bookData);
        } else {
          setError('Book not found');
        }
      } catch (err) {
        setError(err);
        console.error('Error fetching book:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBook();
    }
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

  const handleDownload = async () => {
    if (!book?.pdf?.url) return;
    const pdfUrl = toAbsoluteStrapiUrl(book.pdf.url);
    if (!pdfUrl) {
      toast.error("Download link is not available.");
      return;
    }
    const filename = sanitizeFilename(book.title || "book", "book");
    try {
      await directDownload(pdfUrl, `${filename}.pdf`);
    } catch (err) {
      console.error("Book download failed", err);
      toast.error("Download failed. Please try again.");
    }
  };

  const handleRead = async () => {
    if (!book?.pdf?.url) return;
    const pdfUrl = toAbsoluteStrapiUrl(book.pdf.url);
    if (!pdfUrl) {
      toast.error("Read link is not available.");
      return;
    }
    try {
      await openPdfReader(pdfUrl);
    } catch (err) {
      console.error("Book reader open failed", err);
      toast.error("Unable to open reader. Please try again.");
    }
  };

  if (loading) {
    return (
      <section className="home-container">
        <PageSkeleton variant="detail" />
      </section>
    );
  }

  if (error || !book) {
    return (
      <section className="home-container">
        <PageErrorState
          title={error ? "Unable to load book" : "Book not found"}
          message={error ? buildConnectionErrorMessage("Books", error) : "The requested book could not be found."}
          onRetry={error ? () => window.location.reload() : undefined}
          onBack={handleBack}
        />
      </section>
    );
  }

  return (
    <section className="book-single home-container">
      <div className="split-section">
        <div className="book-cover">
          <img
            src={resolveMediaUrl(book.cover, "https://via.placeholder.com/400x550/0f3d2f/ffffff?text=No+Cover")}
            alt={book.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/400x550/0f3d2f/ffffff?text=No+Cover";
            }}
          />
        </div>

        <div className="book-info">
          <h1>{book.title}</h1>
          <p className="book-author">By {book.author}</p>
          <p className="book-genre-year">{book.genre} • Published in {book.year}</p>

          <div className="book-description">
            <div dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(book.description) }} />
          </div>
        </div>
      </div>

      {/* Comments section - outside split-section like articles */}
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
      <FixedBackButton onClick={handleBack} ariaLabel="Back to Books" />
      <ContentActionDock
        actions={[
          {
            key: "read",
            label: "Read",
            onClick: handleRead,
            disabled: !book.pdf?.url
          },
          { key: "download", label: "Download", onClick: handleDownload, disabled: !book.pdf?.url },
          { key: "share", label: "Share", onClick: () => setShowShareModal(true) },
          { key: "comment", label: "Comment", onClick: () => setShowCommentForm(true) }
        ]}
      />
      <ShareDialog
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share this book"
        shareTitle={book.title}
      />
      <CommentDialog
        open={showCommentForm}
        onClose={() => setShowCommentForm(false)}
        onSubmit={handleCommentSubmit}
      />
    </section>
  );
};

export default BookSingle;
