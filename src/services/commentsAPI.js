import { STRAPI_URL } from "./strapiBaseURL";
export { STRAPI_URL };

async function safeFetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch (error) {
    json = {};
  }
  if (!res.ok) {
    const message = json?.error?.message || json?.message || text || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return json;
}

function normalizeComment(item) {
  const attrs = item?.attributes || item || {};
  return {
    id: item?.documentId || item?.id || attrs?.documentId || attrs?.id || null,
    name: attrs?.name || attrs?.commenterName || "Anonymous",
    comment: attrs?.comment || attrs?.content || "",
    submittedAt: attrs?.submittedAt || attrs?.createdAt || null,
    adminNotes: attrs?.adminNotes || "",
    reviewedAt: attrs?.reviewedAt || null,
    reviewedBy: attrs?.reviewedBy || ""
  };
}

export async function getPublicComments({ contentType, contentId, contentSlug }) {
  if (!contentType || (!contentId && !contentSlug)) return [];
  const params = new URLSearchParams({
    contentType: String(contentType)
  });
  if (contentId) params.set("contentId", String(contentId));
  if (contentSlug) params.set("contentSlug", String(contentSlug));
  const url = `${STRAPI_URL.replace(/\/$/, "")}/api/comments/public?${params.toString()}`;
  const json = await safeFetchJson(url, { method: "GET" });
  const rawList = Array.isArray(json?.data) ? json.data : [];
  return rawList.map(normalizeComment).filter((c) => c.comment);
}

export async function submitComment(payload) {
  const url = `${STRAPI_URL.replace(/\/$/, "")}/api/comments/submit`;
  return safeFetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

const commentsAPI = {
  getPublicComments,
  submitComment
};

export default commentsAPI;
