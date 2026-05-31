import React from "react";

function formatCommentDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const CommentCard = ({ comment }) => {
  if (!comment) return null;

  return (
    <div className="comment-card">
      <div className="comment-head">
        <strong className="comment-author">{comment.name || "Anonymous"}</strong>
        <span className="comment-time">{formatCommentDate(comment.submittedAt)}</span>
      </div>

      <p className="comment-body">{comment.comment}</p>

      {comment.adminNotes && (
        <div className="comment-admin-reply">
          <span className="reply-label">
            {comment.reviewedBy ? `Admin reply by ${comment.reviewedBy}` : "Admin reply"}
          </span>
          <p>{comment.adminNotes}</p>
        </div>
      )}
    </div>
  );
};

export default CommentCard;
