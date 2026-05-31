import { STRAPI_URL } from "./strapiBaseURL";
export { STRAPI_URL };

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
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
  const url = `${STRAPI_URL}/api/poems/${docId}?populate[]=thumbnail&populate[]=images&populate[]=tags`;
  try {
    const res = await fetch(url, { method: "GET" });
    const data = await handleResponse(res);
    if (data && data.data) {
      return mapPoem(data.data);
    }
  } catch (error) {
    if (String(error?.message || "").includes("404")) {
      const fallback = await tryFetchBySlug(docId);
      if (fallback) return fallback;
      return null;
    }
    throw error;
  }
  const fallback = await tryFetchBySlug(docId);
  return fallback;
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
