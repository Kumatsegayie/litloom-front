import { useCallback, useEffect, useState } from "react";
import commentsAPI from "../services/commentsAPI";

const FALLBACK_SUBMIT_MESSAGE =
  "Comment submitted. It will appear after admin approval.";

export default function useModeratedComments({
  contentType,
  contentId,
  contentTitle,
  contentSlug
}) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");

  const refreshComments = useCallback(async () => {
    if (!contentType || (!contentId && !contentSlug)) {
      setComments([]);
      return;
    }

    setLoadingComments(true);
    setCommentsError(null);
    try {
      const list = await commentsAPI.getPublicComments({
        contentType,
        contentId,
        contentSlug
      });
      setComments(list);
    } catch (error) {
      setCommentsError(error.message || "Failed to load comments");
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [contentType, contentId, contentSlug]);

  useEffect(() => {
    refreshComments();
  }, [refreshComments]);

  const submitComment = useCallback(
    async ({ name, email, comment, pageUrl }) => {
      if (!contentType || !contentId) {
        return { ok: false, message: "Missing content reference" };
      }

      setSubmittingComment(true);
      setCommentsError(null);
      setSubmitMessage("");

      try {
        const response = await commentsAPI.submitComment({
          commenterName: name,
          commenterEmail: email,
          comment,
          contentType,
          contentId: String(contentId),
          contentTitle: contentTitle || "",
          contentSlug: contentSlug || "",
          pageUrl: pageUrl || (typeof window !== "undefined" ? window.location.href : "")
        });

        const message = response?.message || FALLBACK_SUBMIT_MESSAGE;
        setSubmitMessage(message);
        return { ok: true, message };
      } catch (error) {
        const message = error.message || "Failed to submit comment";
        setCommentsError(message);
        return { ok: false, message };
      } finally {
        setSubmittingComment(false);
      }
    },
    [contentType, contentId, contentTitle, contentSlug]
  );

  return {
    comments,
    loadingComments,
    submittingComment,
    commentsError,
    submitMessage,
    submitComment,
    refreshComments
  };
}
