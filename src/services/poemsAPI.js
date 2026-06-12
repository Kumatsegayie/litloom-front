import { STRAPI_URL } from "./strapiBaseURL";
export { STRAPI_URL };

async function parseErrorBody(res) {
  try {
    const text = await res.text();
    if (!text) return "";
    try {
      const json = JSON.parse(text);
      return json?.error?.message || json?.message || text;
    } catch {
      return text;
    }
  } catch {
    return "";
  }
}

async function handleResponse(res) {
  const contentType = String(res.headers.get("content-type") || "").toLowerCase();
  if (!res.ok) {
    const text = await parseErrorBody(res);
    const error = new Error(text || `Request failed with status ${res.status}`);
    error.status = res.status;
    throw error;
  }
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    const error = new Error(text || "Unexpected non-JSON response");
    error.status = res.status;
    throw error;
  }
  return res.json();
}

function mapPoem(item) {
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
    `${STRAPI_URL}/api/poems?` +
    `filters[slug][$eq]=${encodeURIComponent(safeSlug)}` +
    `&populate[]=thumbnail&populate[]=images&populate[]=tags&pagination[limit]=1`;
  const res = await fetch(url, { method: "GET" });
  const data = await handleResponse(res);
  const row = Array.isArray(data?.data) ? data.data[0] : null;
  return row ? mapPoem(row) : null;
}

export async function getPoem(id) {
  const docId = String(id || "").trim();
  if (!docId) return null;

  const bySlug = await tryFetchBySlug(docId);
  if (bySlug) return bySlug;

  try {
    const url = `${STRAPI_URL}/api/poems/${docId}?populate[]=thumbnail&populate[]=images&populate[]=tags`;
    const res = await fetch(url, { method: "GET" });
    const data = await handleResponse(res);
    if (data && data.data) {
      return mapPoem(data.data);
    }
  } catch (error) {
    if (Number(error?.status) === 404 || String(error?.message || "").includes("404")) {
      return null;
    }
    throw error;
  }
  return null;
}

export async function getPoems() {
  const url = `${STRAPI_URL}/api/poems?populate[]=thumbnail&populate[]=images&populate[]=tags`;
  const res = await fetch(url, { method: 'GET' });
  const data = await handleResponse(res);
  if (data && data.data) {
    return data.data.map((item) => mapPoem(item)).filter(Boolean);
  }
  return [];
}

const poemsAPI = { getPoem, getPoems };

export default poemsAPI;
