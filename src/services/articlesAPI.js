import { STRAPI_URL } from "./strapiBaseURL";
export { STRAPI_URL };

async function handleResponse(res) {
  const contentType = String(res.headers.get("content-type") || "").toLowerCase();
  if (!res.ok) {
    const text = await res.text();
    const error = new Error(text || res.statusText || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.body = text;
    throw error;
  }
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    const error = new Error(text || "Unexpected non-JSON response");
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
  const lookupValue = String(id || "").trim();
  try {
    const slugFirst = await tryFetchBySlug(lookupValue);
    if (slugFirst) return slugFirst;
  } catch (error) {
    return null;
  }
  return null;
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
