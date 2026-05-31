import { toAbsoluteStrapiUrl } from "../services/strapiBaseURL";

function pickMediaUrl(media) {
  if (!media) return "";
  if (typeof media === "string") return media.trim();

  const fromObject =
    media.url ||
    media?.attributes?.url ||
    media?.data?.url ||
    media?.data?.attributes?.url ||
    "";

  if (fromObject) return String(fromObject).trim();

  if (Array.isArray(media) && media.length > 0) {
    return pickMediaUrl(media[0]);
  }

  if (Array.isArray(media?.data) && media.data.length > 0) {
    return pickMediaUrl(media.data[0]);
  }

  return "";
}

export function resolveMediaUrl(media, fallback = "") {
  const raw = pickMediaUrl(media);
  if (!raw) return fallback;
  return toAbsoluteStrapiUrl(raw);
}

