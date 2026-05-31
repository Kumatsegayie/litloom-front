import { createAppError } from "../utils/errorUtils";
import { STRAPI_URL, toAbsoluteStrapiUrl } from "./strapiBaseURL";
const FALLBACK_IMAGE = '/podcast-placeholder.svg';
let paintingsPromise = null;
let paintingsCache = null;
const paintingCacheById = new Map();
const paintingPromiseById = new Map();

const toHttpCode = (status) => `ERR_HTTP_${status}`;
const buildLoadError = (resource, result) => {
  if (result?.status === 0) {
    return createAppError(`Could not connect to ${resource} service`, { code: "ERR_NETWORK" });
  }
  if (typeof result?.status === "number" && result.status > 0) {
    return createAppError(`Failed to load ${resource} (HTTP ${result.status})`, {
      code: toHttpCode(result.status),
      status: result.status
    });
  }
  return createAppError(`Failed to load ${resource}`, { code: "ERR_UNKNOWN" });
};

async function safeFetchJson(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) return { status: res.status, data: null, error: null };
    return { status: res.status, data: await res.json(), error: null };
  } catch (e) {
    return { status: 0, data: null, error: e };
  }
}

const buildMediaUrl = (strapiUrl, media) => {
  if (!media) return null;
  if (typeof media === 'string') return toAbsoluteStrapiUrl(media);
  const data = media.data || media;
  const attrs = data.attributes || {};

  const tryUrl = (u) => (u && typeof u === 'string' ? u : null);
  let url = tryUrl(attrs.url) || tryUrl(data.url) || null;

  if (!url && attrs.formats && typeof attrs.formats === 'object') {
    const candidates = Object.values(attrs.formats)
      .map((f) => tryUrl(f?.url) || tryUrl(f?.path) || null)
      .filter(Boolean);
    url = candidates[0] || null;
  }

  if (!url) return null;
  if (url.startsWith('http')) return toAbsoluteStrapiUrl(url);
  return toAbsoluteStrapiUrl(`${strapiUrl.replace(/\/$/, '')}${url}`);
};

const extractTagNames = (tagsField) => {
  if (!tagsField) return [];
  const list = Array.isArray(tagsField)
    ? tagsField
    : (Array.isArray(tagsField.data) ? tagsField.data : []);
  return list
    .map((tag) => {
      const attrs = tag?.attributes || tag;
      return (attrs?.name || "").trim();
    })
    .filter(Boolean);
};

const normalizeList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const toPainting = (strapiUrl, item) => {
  if (!item) return null;

  const attrs = item.attributes || item;
  const imagesField = attrs.images || null;
  let images = [];

  if (imagesField) {
    const d = imagesField.data || imagesField;
    if (Array.isArray(d)) images = d.map((i) => buildMediaUrl(strapiUrl, i)).filter(Boolean);
    else images = [buildMediaUrl(strapiUrl, d)].filter(Boolean);
  }

  const mapped = {
    id: item.documentId || item.id,
    slug: attrs.slug || '',
    title: attrs.title,
    artist: attrs.artist,
    year: attrs.year,
    category: attrs.category,
    description: attrs.description,
    image: images[0] || buildMediaUrl(strapiUrl, attrs.image) || FALLBACK_IMAGE,
    images,
    isGallery: images.length > 1,
    tags: extractTagNames(attrs.tags),
  };

  if (!mapped.id) return null;
  return mapped;
};

export async function getPaintings() {
  if (paintingsCache) return paintingsCache;
  if (paintingsPromise) return paintingsPromise;

  const strapiUrl = STRAPI_URL;

  paintingsPromise = (async () => {
    // Primary endpoint for this project: stable custom public route.
    let res = await safeFetchJson(`${strapiUrl}/api/paintings-public`);

    // Fallback to core endpoints when custom route is unavailable.
    if (res && res.status === 404) {
      res = await safeFetchJson(`${strapiUrl}/api/paintings?populate[]=images&populate[]=tags`);
      if (res && res.status === 404) {
        res = await safeFetchJson(`${strapiUrl}/api/paintings`);
      }
    }

    if (!res || !res.data) {
      throw buildLoadError("paintings", res);
    }

    const list = normalizeList(res.data)
      .map((item) => toPainting(strapiUrl, item))
      .filter(Boolean);

    paintingsCache = list;
    list.forEach((item) => paintingCacheById.set(String(item.id), item));
    return list;
  })().finally(() => {
    paintingsPromise = null;
  });

  return paintingsPromise;
}

export async function getPainting(id) {
  if (!id) {
    throw createAppError("Painting ID is required", { code: "ERR_BAD_REQUEST" });
  }
  const key = String(id);
  if (paintingCacheById.has(key)) return paintingCacheById.get(key);
  if (paintingPromiseById.has(key)) return paintingPromiseById.get(key);

  const promise = (async () => {
    // Keep a single source of truth and avoid unstable core single-item endpoint.
    const list = await getPaintings();
    const painting =
      list.find((item) => String(item.id) === key || String(item.slug || "") === key) || null;
    if (painting) {
      paintingCacheById.set(key, painting);
      return painting;
    }
    throw createAppError("Painting not found", { code: "ERR_NOT_FOUND", status: 404 });
  })().finally(() => {
    paintingPromiseById.delete(key);
  });

  paintingPromiseById.set(key, promise);
  return promise;
}

const paintingsAPI = { getPaintings, getPainting };

export default paintingsAPI;
