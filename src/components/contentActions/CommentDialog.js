import React from "react";
import { X } from "lucide-react";
import "./contentActions.css";

const CommentDialog = ({
  open,
  onClose,
  onSubmit,
  title = "Leave a comment",
  subtitle = "Share your thoughts with the community",
  submitLabel = "Send"
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const form = e.currentTarget;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const content = form.content.value.trim();
    if (!name || !email || !content) return;
    setIsSubmitting(true);
    try {
      await Promise.resolve(
        onSubmit?.({
          name,
          email,
          content,
          reset: () => form.reset()
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="content-overlay" onClick={onClose}>
      <div className="content-modal" onClick={(e) => e.stopPropagation()}>
        <div className="content-modal-head">
          <div>
            <h2 className="content-modal-title">{title}</h2>
            <p className="content-modal-subtitle">{subtitle}</p>
          </div>
          <button type="button" className="content-modal-close" onClick={onClose} aria-label="Close comment dialog">
            <X size={18} />
          </button>
        </div>

        <form className="comment-form-modern" onSubmit={handleSubmit}>
          <input type="text" name="name" placeholder="Your name" required disabled={isSubmitting} />
          <input type="email" name="email" placeholder="Your email" required disabled={isSubmitting} />
          <textarea name="content" rows="5" placeholder="Write your comment..." required disabled={isSubmitting} />
          <button type="submit" className="comment-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="comment-submit-inline-spinner" aria-hidden="true" />
                Sending...
              </>
            ) : (
              submitLabel
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommentDialog;
