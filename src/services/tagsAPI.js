import { STRAPI_URL } from "./strapiBaseURL";
export { STRAPI_URL };

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

const normalizeTag = (value = "") =>
  String(value || "").trim().replace(/\s+/g, " ");

const mapTag = (tag) => {
  const attrs = tag?.attributes || tag;
  const name = normalizeTag(attrs?.name);
  const slug = attrs?.slug || "";
  const links = attrs?.links && typeof attrs.links === "object" ? attrs.links : {};
  const normalizeRelationIds = (value) => {
    const list = Array.isArray(value) ? value : (Array.isArray(value?.data) ? value.data : []);
    return list
      .map((entry) => {
        const entryAttrs = entry?.attributes || entry;
        const id = entry?.documentId || entryAttrs?.documentId || entry?.id || entryAttrs?.id || null;
        return id ? String(id) : null;
      })
      .filter(Boolean);
  };
  const normalizeIdList = (value) =>
    Array.isArray(value) ? value.map((id) => String(id)).filter(Boolean) : [];
  if (!name) return null;
  return {
    id: tag?.id || tag?.documentId || attrs?.id || name,
    name,
    slug,
    links: {
      article: normalizeIdList(links.article).length > 0 ? normalizeIdList(links.article) : normalizeRelationIds(attrs.articles),
      blog: normalizeIdList(links.blog).length > 0 ? normalizeIdList(links.blog) : normalizeRelationIds(attrs.blogs),
      book: normalizeIdList(links.book).length > 0 ? normalizeIdList(links.book) : normalizeRelationIds(attrs.books),
      poem: normalizeIdList(links.poem).length > 0 ? normalizeIdList(links.poem) : normalizeRelationIds(attrs.poems),
      painting: normalizeIdList(links.painting).length > 0 ? normalizeIdList(links.painting) : normalizeRelationIds(attrs.paintings),
      photo: normalizeIdList(links.photo).length > 0 ? normalizeIdList(links.photo) : normalizeRelationIds(attrs.photos),
      podcast: normalizeIdList(links.podcast).length > 0 ? normalizeIdList(links.podcast) : normalizeRelationIds(attrs.podcasts),
      series: normalizeIdList(links.series).length > 0 ? normalizeIdList(links.series) : normalizeRelationIds(attrs.serieses),
    },
  };
};

export async function getPublicTags() {
  const primaryUrl = `${STRAPI_URL}/api/tags/public`;
  const primaryRes = await fetch(primaryUrl, { method: "GET" });
  if (primaryRes.ok) {
    const payload = await handleResponse(primaryRes);
    const list = Array.isArray(payload?.data) ? payload.data : [];
    return list.map(mapTag).filter(Boolean);
  }

  // Fallback for environments where custom route is not yet loaded.
  const fallbackUrl =
    `${STRAPI_URL}/api/tags` +
    `?fields[0]=name&fields[1]=slug` +
    `&populate[articles][fields][0]=documentId` +
    `&populate[blogs][fields][0]=documentId` +
    `&populate[books][fields][0]=documentId` +
    `&populate[poems][fields][0]=documentId` +
    `&populate[paintings][fields][0]=documentId` +
    `&populate[photos][fields][0]=documentId` +
    `&populate[podcasts][fields][0]=documentId` +
    `&populate[serieses][fields][0]=documentId` +
    `&pagination[pageSize]=200`;
  const fallbackRes = await fetch(fallbackUrl, { method: "GET" });
  const fallbackPayload = await handleResponse(fallbackRes);
  const fallbackList = Array.isArray(fallbackPayload?.data) ? fallbackPayload.data : [];
  return fallbackList.map(mapTag).filter(Boolean);
}

export async function suggestTags(query, limit = 15) {
  const q = normalizeTag(query);
  const search = new URLSearchParams();
  if (q) search.set("q", q);
  search.set("limit", String(limit));
  const url = `${STRAPI_URL}/api/tags/suggest?${search.toString()}`;
  const res = await fetch(url, { method: "GET" });
  const payload = await handleResponse(res);
  const list = Array.isArray(payload?.data) ? payload.data : [];
  return list.map(mapTag).filter(Boolean);
}

export async function ensureTags(names) {
  const input = Array.isArray(names) ? names : [names];
  const cleaned = input.map(normalizeTag).filter(Boolean);
  if (!cleaned.length) return [];

  const url = `${STRAPI_URL}/api/tags/ensure`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ names: cleaned }),
  });

  const payload = await handleResponse(res);
  const list = Array.isArray(payload?.data) ? payload.data : [];
  return list.map(mapTag).filter(Boolean);
}

const tagsAPI = { getPublicTags, suggestTags, ensureTags };

export default tagsAPI;
