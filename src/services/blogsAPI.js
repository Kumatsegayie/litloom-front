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

function mapBlog(item) {
  if (!item) return null;
  return {
    ...item,
    id: item.documentId || item.id,
    slug: item.slug || ""
  };
}

async function tryFetchBySlug(slug) {
  const safeSlug = String(slug || "").trim();
  if (!safeSlug) return null;
  const url =
    `${STRAPI_URL}/api/blogs?` +
    `filters[slug][$eq]=${encodeURIComponent(safeSlug)}` +
    `&populate[]=thumbnail&populate[]=images&populate[]=tags&pagination[limit]=1`;
  const res = await fetch(url, { method: "GET" });
  const data = await handleResponse(res);
  const row = Array.isArray(data?.data) ? data.data[0] : null;
  return row ? mapBlog(row) : null;
}

export async function getBlog(id) {
  const lookupValue = String(id || "").trim();
  try {
    const slugFirst = await tryFetchBySlug(lookupValue);
    if (slugFirst) return slugFirst;
  } catch (error) {
    return null;
  }
  return null;
}

export async function getBlogs() {
  const url = `${STRAPI_URL}/api/blogs?populate[]=thumbnail&populate[]=images&populate[]=tags`;
  const res = await fetch(url, { method: 'GET' });
  const data = await handleResponse(res);
  if (data && data.data) {
    return data.data.map((item) => mapBlog(item)).filter(Boolean);
  }
  return [];
}

const blogsAPI = { getBlog, getBlogs };

export default blogsAPI;
