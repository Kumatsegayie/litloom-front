import { STRAPI_URL } from "./strapiBaseURL";

const SUBMIT_ENDPOINT = `${STRAPI_URL}/api/submissions/submit`;

async function parseResponse(response) {
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      text ||
      "Failed to submit.";
    throw new Error(message);
  }

  return data || {};
}

async function submitSubmission(formData) {
  const response = await fetch(SUBMIT_ENDPOINT, {
    method: "POST",
    body: formData
  });
  return parseResponse(response);
}

export async function submitArticleSubmission(payload) {
  const formData = new FormData();
  formData.append("submissionType", "article");
  formData.append("title", payload.title || "");
  formData.append("content", payload.content || "");
  formData.append("excerpt", payload.excerpt || "");
  formData.append("category", payload.category || "");
  formData.append("tags", payload.tags || "");
  formData.append("submitterName", payload.submitterName || "");
  formData.append("submitterEmail", payload.submitterEmail || "");
  formData.append("anonymous", payload.anonymous ? "true" : "false");

  if (payload.featuredImage) {
    formData.append("featuredImage", payload.featuredImage);
  }

  const galleryImages = Array.isArray(payload.galleryImages) ? payload.galleryImages : [];
  for (let i = 0; i < galleryImages.length; i += 1) {
    formData.append("galleryImages", galleryImages[i]);
  }

  return submitSubmission(formData);
}

export async function submitPodcastSubmission(payload) {
  const formData = new FormData();
  formData.append("submissionType", "podcast");
  formData.append("title", payload.title || "");
  formData.append("description", payload.description || "");
  formData.append("duration", payload.duration || "");
  formData.append("category", payload.category || "");
  formData.append("tags", payload.tags || "");
  formData.append("submitterName", payload.submitterName || "");
  formData.append("submitterEmail", payload.submitterEmail || "");
  formData.append("anonymous", payload.anonymous ? "true" : "false");

  if (payload.coverImage) {
    formData.append("coverImage", payload.coverImage);
  }

  if (payload.audioFile) {
    formData.append("audioFile", payload.audioFile);
  }

  return submitSubmission(formData);
}

const submissionsAPI = {
  submitArticleSubmission,
  submitPodcastSubmission
};

export default submissionsAPI;
