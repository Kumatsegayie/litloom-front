import { createAppError } from "../utils/errorUtils";
import { STRAPI_URL, toAbsoluteStrapiUrl } from "./strapiBaseURL";
const FALLBACK_IMAGE = "/podcast-placeholder.svg";
let photosPromise = null;
let photosCache = null;
const photoCacheById = new Map();
const photoPromiseById = new Map();

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
  if (typeof media === "string") return toAbsoluteStrapiUrl(media);
  const data = media.data || media;
  const attrs = data.attributes || {};

  const tryUrl = (u) => (u && typeof u === "string" ? u : null);
  let url = tryUrl(attrs.url) || tryUrl(data.url) || null;

  if (!url && attrs.formats && typeof attrs.formats === "object") {
    const candidates = Object.values(attrs.formats)
      .map((f) => tryUrl(f?.url) || tryUrl(f?.path) || null)
      .filter(Boolean);
    url = candidates[0] || null;
  }

  if (!url) return null;
  if (url.startsWith("http")) return toAbsoluteStrapiUrl(url);
  return toAbsoluteStrapiUrl(`${strapiUrl.replace(/\/$/, "")}${url}`);
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

const toPhoto = (strapiUrl, item) => {
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
    title: attrs.title,
    photographer: attrs.photographer || attrs.artist || "Unknown",
    year: attrs.year,
    category: attrs.category,
    description: attrs.description,
    image: images[0] || FALLBACK_IMAGE,
    images,
    isGallery: images.length > 1,
    slug: attrs.slug,
    tags: extractTagNames(attrs.tags),
  };

  if (!mapped.id) return null;
  return mapped;
};

export async function getPhotos() {
  if (photosCache) return photosCache;
  if (photosPromise) return photosPromise;

  const strapiUrl = STRAPI_URL;

  photosPromise = (async () => {
    let res = await safeFetchJson(`${strapiUrl}/api/photos-public`);

    if (res && res.status === 404) {
      res = await safeFetchJson(`${strapiUrl}/api/photos?populate[]=images&populate[]=tags`);
      if (res && res.status === 404) {
        res = await safeFetchJson(`${strapiUrl}/api/photos`);
      }
    }

    if (!res || !res.data) {
      throw buildLoadError("photography", res);
    }

    const list = normalizeList(res.data)
      .map((item) => toPhoto(strapiUrl, item))
      .filter(Boolean);

    photosCache = list;
    list.forEach((item) => photoCacheById.set(String(item.id), item));
    return list;
  })().finally(() => {
    photosPromise = null;
  });

  return photosPromise;
}

export async function getPhoto(id) {
  if (!id) {
    throw createAppError("Photo ID is required", { code: "ERR_BAD_REQUEST" });
  }
  const key = String(id);
  if (photoCacheById.has(key)) return photoCacheById.get(key);
  if (photoPromiseById.has(key)) return photoPromiseById.get(key);

  const promise = (async () => {
    const list = await getPhotos();
    const photo = list.find((item) => String(item.id) === key || String(item.slug || "") === key) || null;
    if (photo) {
      photoCacheById.set(key, photo);
      return photo;
    }
    throw createAppError("Photo not found", { code: "ERR_NOT_FOUND", status: 404 });
  })().finally(() => {
    photoPromiseById.delete(key);
  });

  photoPromiseById.set(key, promise);
  return promise;
}

const photographyAPI = { getPhotos, getPhoto };

export default photographyAPI;
