import Fuse from "fuse.js";
import { getArticles } from "./articlesAPI";
import { getBlogs } from "./blogsAPI";
import { getBooks } from "./booksAPI";
import { getAllPodcasts } from "./podcastsAPI";
import { getPoems } from "./poemsAPI";
import { getPaintings } from "./paintingsAPI";
import { getPhotos } from "./photographyAPI";
import { toAbsoluteStrapiUrl } from "./strapiBaseURL";

const SEARCH_CACHE_TTL_MS = 60 * 1000;
const MAX_RESULTS = 120;

let cachedAt = 0;
let cachedDocuments = [];

const asArray = (value) => (Array.isArray(value) ? value : []);

const toPlainText = (value, depth = 0) => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (depth > 5) return "";
  if (Array.isArray(value)) {
    return value.map((item) => toPlainText(item, depth + 1)).filter(Boolean).join(" ");
  }
  if (typeof value === "object") {
    if (typeof value.text === "string") return value.text;
    const values = Object.values(value);
    return values.map((item) => toPlainText(item, depth + 1)).filter(Boolean).join(" ");
  }
  return "";
};

const getEntityId = (item) => {
  const id = item?.id || item?.documentId || item?._id || "";
  return String(id || "").trim();
};

const getEntitySlug = (item) => {
  const slug = item?.slug || "";
  return String(slug || "").trim();
};

const getMediaUrl = (media) => {
  if (!media) return null;
  if (typeof media === "string") return media;
  if (Array.isArray(media)) return getMediaUrl(media[0]);
  if (media.url) return media.url;
  if (media.data) return getMediaUrl(media.data);
  if (media.attributes) return getMediaUrl(media.attributes);
  if (media.formats && typeof media.formats === "object") {
    const first = Object.values(media.formats)[0];
    return getMediaUrl(first);
  }
  return null;
};

const toAbsoluteMediaUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  return toAbsoluteStrapiUrl(url);
};

const getNamesFromRelation = (relation) => {
  if (!relation) return [];
  const list = Array.isArray(relation) ? relation : (Array.isArray(relation.data) ? relation.data : [relation]);
  return list
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") return item.trim();
      const attrs = item.attributes || item;
      return (attrs.name || attrs.title || attrs.slug || "").trim();
    })
    .filter(Boolean);
};

const createDoc = (base) => ({
  id: base.id,
  type: base.type,
  title: base.title || "",
  description: base.description || "",
  content: base.content || "",
  tagsText: base.tagsText || "",
  categoryText: base.categoryText || "",
  authorText: base.authorText || "",
  image: toAbsoluteMediaUrl(base.image),
  link: base.link || "#",
});

const normalizeArticle = (item) => {
  const id = getEntityId(item);
  if (!id) return null;
  const slug = getEntitySlug(item) || id;
  return createDoc({
    id,
    type: "article",
    title: item.title,
    description: toPlainText(item.description || item.excerpt),
    content: toPlainText(item.content),
    tagsText: getNamesFromRelation(item.tags).join(" "),
    categoryText: getNamesFromRelation(item.category).join(" "),
    authorText: toPlainText(item.author),
    image: getMediaUrl(item.thumbnail || item.image || item.images),
    link: `/articles/${slug}`,
  });
};

const normalizeBlog = (item) => {
  const id = getEntityId(item);
  if (!id) return null;
  const slug = getEntitySlug(item) || id;
  return createDoc({
    id,
    type: "blog",
    title: item.title,
    description: toPlainText(item.description || item.excerpt),
    content: toPlainText(item.content),
    tagsText: getNamesFromRelation(item.tags).join(" "),
    categoryText: getNamesFromRelation(item.category).join(" "),
    authorText: toPlainText(item.author),
    image: getMediaUrl(item.thumbnail || item.image || item.images),
    link: `/blogs/${slug}`,
  });
};

const normalizeBook = (item) => {
  const id = getEntityId(item);
  if (!id) return null;
  const slug = getEntitySlug(item) || id;
  return createDoc({
    id,
    type: "book",
    title: item.title,
    description: toPlainText(item.description || item.summary || item.excerpt),
    content: toPlainText(item.content),
    tagsText: getNamesFromRelation(item.tags).join(" "),
    categoryText: getNamesFromRelation(item.category).join(" "),
    authorText: toPlainText(item.author),
    image: getMediaUrl(item.cover || item.image || item.images),
    link: `/books/${slug}`,
  });
};

const normalizePoem = (item) => {
  const id = getEntityId(item);
  if (!id) return null;
  const slug = getEntitySlug(item) || id;
  return createDoc({
    id,
    type: "poem",
    title: item.title,
    description: toPlainText(item.description || item.excerpt),
    content: toPlainText(item.content),
    tagsText: getNamesFromRelation(item.tags).join(" "),
    categoryText: getNamesFromRelation(item.category).join(" "),
    authorText: toPlainText(item.author),
    image: getMediaUrl(item.thumbnail || item.image || item.images),
    link: `/poems/${slug}`,
  });
};

const normalizePainting = (item) => {
  const id = getEntityId(item);
  if (!id) return null;
  const slug = getEntitySlug(item) || id;
  return createDoc({
    id,
    type: "painting",
    title: item.title,
    description: toPlainText(item.description),
    content: "",
    tagsText: asArray(item.tags).join(" "),
    categoryText: toPlainText(item.category),
    authorText: toPlainText(item.artist),
    image: item.image || getMediaUrl(item.images),
    link: `/paintings/${slug}`,
  });
};

const normalizePhoto = (item) => {
  const id = getEntityId(item);
  if (!id) return null;
  const slug = getEntitySlug(item) || id;
  return createDoc({
    id,
    type: "photo",
    title: item.title,
    description: toPlainText(item.description),
    content: "",
    tagsText: asArray(item.tags).join(" "),
    categoryText: toPlainText(item.category),
    authorText: toPlainText(item.photographer || item.artist),
    image: item.image || getMediaUrl(item.images),
    link: `/photos/${slug}`,
  });
};

const normalizePodcast = (item) => {
  const id = getEntityId(item);
  const slug = String(item?.slug || id || "").trim();
  if (!id || !slug) return null;
  const isSeries = item.type === "series";
  const episodeText = asArray(item.episodes)
    .map((episode) => toPlainText(episode?.title))
    .filter(Boolean)
    .join(" ");

  return createDoc({
    id,
    type: "podcast",
    title: item.title,
    description: toPlainText(item.description),
    content: episodeText,
    tagsText: asArray(item.tags).join(" "),
    categoryText: isSeries ? "series" : "floating",
    authorText: toPlainText(item.host || item.uploader),
    image: item.cover || null,
    link: isSeries ? `/podcasts/series/${slug}` : `/podcasts/floating/${slug}`,
  });
};

const dedupeDocuments = (items) => {
  const seen = new Set();
  const output = [];
  items.forEach((item) => {
    if (!item) return;
    const key = `${item.type}:${item.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    output.push(item);
  });
  return output;
};

const searchSources = [
  { name: "articles", loader: getArticles, mapper: normalizeArticle },
  { name: "blogs", loader: getBlogs, mapper: normalizeBlog },
  { name: "books", loader: getBooks, mapper: normalizeBook },
  { name: "podcasts", loader: getAllPodcasts, mapper: normalizePodcast },
  { name: "poems", loader: getPoems, mapper: normalizePoem },
  { name: "paintings", loader: getPaintings, mapper: normalizePainting },
  { name: "photos", loader: getPhotos, mapper: normalizePhoto },
];

async function loadDocuments() {
  const now = Date.now();
  if (cachedDocuments.length > 0 && now - cachedAt < SEARCH_CACHE_TTL_MS) {
    return cachedDocuments;
  }

  const settled = await Promise.allSettled(
    searchSources.map(async (source) => {
      const raw = await source.loader();
      const mapped = asArray(raw).map(source.mapper).filter(Boolean);
      return mapped;
    })
  );

  const merged = [];
  settled.forEach((entry, index) => {
    if (entry.status === "fulfilled") {
      merged.push(...entry.value);
      return;
    }
    // Gracefully skip failed sources to keep search available.
    void searchSources[index];
  });

  cachedDocuments = dedupeDocuments(merged);
  cachedAt = now;
  return cachedDocuments;
}

const fuseOptions = {
  includeScore: true,
  threshold: 0.38,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: "title", weight: 0.4 },
    { name: "description", weight: 0.22 },
    { name: "content", weight: 0.16 },
    { name: "tagsText", weight: 0.12 },
    { name: "authorText", weight: 0.06 },
    { name: "categoryText", weight: 0.04 },
  ],
};

export async function getResults(query) {
  const q = String(query || "").trim();
  if (!q) return [];

  try {
    const documents = await loadDocuments();
    if (documents.length === 0) return [];

    const fuse = new Fuse(documents, fuseOptions);
    const fuzzy = fuse.search(q).map((hit) => ({
      ...hit.item,
      score: hit.score ?? 0,
    }));

    if (fuzzy.length > 0) return fuzzy.slice(0, MAX_RESULTS);

    const qlc = q.toLowerCase();
    const fallback = documents.filter((entry) => {
      const haystack = `${entry.title} ${entry.description} ${entry.content} ${entry.tagsText} ${entry.authorText} ${entry.categoryText}`.toLowerCase();
      return haystack.includes(qlc);
    });
    return fallback.slice(0, MAX_RESULTS);
  } catch (err) {
    return [];
  }
}

export function clearSearchCache() {
  cachedAt = 0;
  cachedDocuments = [];
}

const searchAPI = { getResults, clearSearchCache };

export default searchAPI;
