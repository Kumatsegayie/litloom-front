import { createAppError } from "../utils/errorUtils";
import { STRAPI_URL, toAbsoluteStrapiUrl } from "./strapiBaseURL";
export { STRAPI_URL };

async function safeFetchJson(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) return { ok: false, status: res.status, data: null, error: null };
    return { ok: true, status: res.status, data: await res.json(), error: null };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: e };
  }
}

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

async function fetchPublicPodcasts() {
  const publicUrl = `${STRAPI_URL}/api/podcasts/public`;
  const res = await safeFetchJson(publicUrl);
  if (!res.ok || !res.data) {
    throw buildLoadError("podcasts", res);
  }
  return res.data;
}

const buildMediaUrl = (strapiUrl, media) => {
  if (!media) return null;
  if (typeof media === 'string') return toAbsoluteStrapiUrl(media);
  const data = media.data || media;
  const attrs = data.attributes || {};

  const tryUrl = (u) => (u && typeof u === 'string' ? u : null);

  // prefer attributes.url or data.url
  let url = tryUrl(attrs.url) || tryUrl(data.url) || null;

  // check formats object for audio or image urls
  if (!url && attrs.formats && typeof attrs.formats === 'object') {
    const formats = attrs.formats;
    const audioExts = ['.mp3', '.m4a', '.ogg', '.wav', '.aac', '.flac'];
    const candidates = Object.values(formats)
      .map((f) => tryUrl(f?.url) || tryUrl(f?.path) || null)
      .filter(Boolean);
    // prefer audio-like file
    const audioCandidate = candidates.find((c) => audioExts.some((ext) => c.toLowerCase().endsWith(ext)));
    url = audioCandidate || candidates[0] || null;
  }

  if (!url) return null;
  if (url.startsWith('http')) return toAbsoluteStrapiUrl(url);
  return toAbsoluteStrapiUrl(`${strapiUrl}${url}`);
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

export async function getAllPodcasts() {
  const strapiUrl = STRAPI_URL;
  const data = await fetchPublicPodcasts();

  const seriesList = (data.series || []).map(s => ({
    id: s.id,
    type: 'series',
    title: s.title,
    host: s.host || 'Unknown',
    cover: buildMediaUrl(strapiUrl, s.cover),
    description: s.description,
    duration: `${(s.episodes && s.episodes.length) || 0} episodes`,
    slug: s.slug,
    tags: extractTagNames(s.tags),
    episodes: (s.episodes || []).map(e => ({
      id: e.id,
      title: e.title,
      audio: buildMediaUrl(strapiUrl, e.audio),
      embedUrl: e.embedUrl || null,
      cover: buildMediaUrl(strapiUrl, e.cover),
      tags: extractTagNames(e.tags),
      duration: e.duration,
      episodeNumber: e.episodeNumber,
      publishDate: e.publishDate
    }))
  }));

  const floatingList = (data.floating || []).map(f => ({
    id: f.id,
    type: 'floating',
    title: f.title,
    host: f.host || 'Unknown',
    cover: buildMediaUrl(strapiUrl, f.cover),
    description: f.description,
    audio: buildMediaUrl(strapiUrl, f.audio),
    embedUrl: f.embedUrl || null,
    duration: f.duration,
    slug: f.slug,
    tags: extractTagNames(f.tags)
  }));

  return [...seriesList, ...floatingList];
}

export async function getSeriesBySlug(slug) {
  // Prefer unified public endpoint provided by backend
  const publicData = await fetchPublicPodcasts();
  if (!publicData || !publicData.series) return null;
  const found = publicData.series.find(s => String(s.slug) === String(slug) || String(s.id) === String(slug));
  if (!found) return null;
  return {
    id: found.id,
    title: found.title,
    description: found.description,
    thumbnail: buildMediaUrl(STRAPI_URL, found.cover) || buildMediaUrl(STRAPI_URL, found.thumbnail),
    slug: found.slug,
    tags: extractTagNames(found.tags),
    uploader: found.uploader || 'Unknown',
    episodes: (found.episodes || []).map(ep => ({
      id: ep.id,
      title: ep.title,
      audio: buildMediaUrl(STRAPI_URL, ep.audio),
      embedUrl: ep.embedUrl || null,
      cover: buildMediaUrl(STRAPI_URL, ep.cover),
      tags: extractTagNames(ep.tags),
      duration: ep.duration,
      episodeNumber: ep.episodeNumber,
      publishDate: ep.publishDate
    }))
  };
}

export async function getSeries(id) {
  if (!id) return null;
  const publicData = await fetchPublicPodcasts();
  if (!publicData || !publicData.series) return null;
  const found = publicData.series.find(s => String(s.id) === String(id) || String(s.slug) === String(id));
  if (!found) return null;
  return {
    id: found.id,
    title: found.title,
    description: found.description,
    thumbnail: buildMediaUrl(STRAPI_URL, found.cover) || buildMediaUrl(STRAPI_URL, found.thumbnail),
    slug: found.slug,
    tags: extractTagNames(found.tags),
    uploader: found.uploader || 'Unknown',
    episodes: (found.episodes || []).map(ep => ({
      id: ep.id,
      title: ep.title,
      audio: buildMediaUrl(STRAPI_URL, ep.audio),
      embedUrl: ep.embedUrl || null,
      cover: buildMediaUrl(STRAPI_URL, ep.cover),
      tags: extractTagNames(ep.tags),
      duration: ep.duration,
      episodeNumber: ep.episodeNumber,
      publishDate: ep.publishDate
    }))
  };
}

export async function getPodcastBySlug(slug) {
  // Prefer unified public endpoint to find episodes
  const publicData = await fetchPublicPodcasts();
  if (publicData && publicData.series && publicData.series.length > 0) {
    for (const s of publicData.series) {
      const eps = s.episodes || [];
      const found = eps.find(ep => String(ep.slug) === String(slug) || String(ep.id) === String(slug));
      if (found) {
        return {
          id: found.id,
          title: found.title,
          description: found.description,
          audio: buildMediaUrl(STRAPI_URL, found.audio),
          embedUrl: found.embedUrl || null,
          cover: buildMediaUrl(STRAPI_URL, found.cover),
          duration: found.duration,
          episodeNumber: found.episodeNumber,
          publishDate: found.publishDate,
          slug: found.slug,
          uploader: found.uploader || s.uploader || 'Unknown',
          series: {
            id: s.id,
            title: s.title
          },
          tags: extractTagNames(found.tags),
          comments: []
        };
      }
    }
  }
  // Check floating podcasts in publicData (if available)
  if (publicData && publicData.floating && publicData.floating.length > 0) {
    const found = publicData.floating.find(p => String(p.slug) === String(slug) || String(p.id) === String(slug));
    if (found) {
      return {
        id: found.id,
        title: found.title,
        description: found.description,
        audio: buildMediaUrl(STRAPI_URL, found.audio),
        embedUrl: found.embedUrl || null,
        cover: buildMediaUrl(STRAPI_URL, found.cover),
        duration: found.duration,
        episodeNumber: found.episodeNumber,
        publishDate: found.publishDate,
        slug: found.slug,
        uploader: found.uploader || 'Unknown',
        series: null,
        tags: extractTagNames(found.tags),
        comments: []
      };
    }
  }

  return null;
}

const podcastsAPI = { getAllPodcasts, getSeriesBySlug, getPodcastBySlug, getSeries };

export default podcastsAPI;

// expose helpers for other modules (normalize media URLs)
export { buildMediaUrl };
