import { STRAPI_URL } from "./strapiBaseURL";
export { STRAPI_URL };

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    const error = new Error(text || res.statusText || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.body = text;
    throw error;
  }
  return res.json();
}

function mapArticle(item) {
  if (!item) return null;
  const { id: oldId, ...rest } = item;
  return {
    id: item.documentId || oldId,
    slug: item.slug || "",
    ...rest
  };
}

async function tryFetchBySlug(slug) {
  const safeSlug = String(slug || "").trim();
  if (!safeSlug) return null;
  const url =
    `${STRAPI_URL}/api/articles?` +
    `filters[slug][$eq]=${encodeURIComponent(safeSlug)}` +
    `&populate[]=thumbnail&populate[]=images&populate[]=category&populate[]=tags&pagination[limit]=1`;
  const res = await fetch(url, { method: "GET" });
  const data = await handleResponse(res);
  const row = Array.isArray(data?.data) ? data.data[0] : null;
  return row ? mapArticle(row) : null;
}

export async function getArticle(id) {
  // Strapi v5 public REST: GET /api/articles/:documentId?populate[]=thumbnail&populate[]=images&populate[]=category&populate[]=tags
  const docId = String(id || "").trim();
  const url = `${STRAPI_URL}/api/articles/${docId}?populate[]=thumbnail&populate[]=images&populate[]=category&populate[]=tags`;
  try {
    const res = await fetch(url, { method: "GET" });
    const data = await handleResponse(res);
    if (data && data.data) {
      return mapArticle(data.data);
    }
  } catch (error) {
    if (error?.status === 404 || String(error?.message || "").includes("404")) {
      const fallback = await tryFetchBySlug(docId);
      if (fallback) return fallback;
      return null;
    }
    throw error;
  }
  const fallback = await tryFetchBySlug(docId);
  return fallback;
}

export async function getArticles() {
  const url = `${STRAPI_URL}/api/articles?populate[]=thumbnail&populate[]=images&populate[]=category&populate[]=tags`;
  const res = await fetch(url, { method: 'GET' });
  const data = await handleResponse(res);
  if (data && data.data) {
    return data.data.map((item) => mapArticle(item)).filter(Boolean);
  }
  return [];
}

const articlesAPI = { getArticle, getArticles };

export default articlesAPI;
