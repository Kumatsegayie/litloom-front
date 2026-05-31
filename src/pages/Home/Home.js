import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Feather,
  FileText,
  Image as ImageIcon,
  Layers,
  Mic,
  Palette,
  PenLine
} from "lucide-react";
import { getArticles } from "../../services/articlesAPI";
import { getBlogs } from "../../services/blogsAPI";
import { getBooks } from "../../services/booksAPI";
import podcastsAPI from "../../services/podcastsAPI";
import { getPoems } from "../../services/poemsAPI";
import { getPaintings } from "../../services/paintingsAPI";
import { getPhotos } from "../../services/photographyAPI";
import { getPublicTags } from "../../services/tagsAPI";
import { toAbsoluteStrapiUrl } from "../../services/strapiBaseURL";
import { getRichTextPreview } from "../../utils/richText";
import { PLACEHOLDER_COVER } from "../../utils/placeholder";
import PageErrorState from "../../components/ui/PageErrorState";
import PageDiscoverTitle from "../../components/ui/PageDiscoverTitle";
import "./Home.css";

const PAGE_SIZE = 18;
let HOME_FEED_CACHE = null;
let HOME_VIEW_CACHE = null;

const normalizeTag = (value = "") =>
  String(value || "").trim().replace(/\s+/g, " ");

const toAbsoluteMedia = (value) => {
  if (!value) return PLACEHOLDER_COVER;
  if (typeof value === "string") {
    return toAbsoluteStrapiUrl(value) || PLACEHOLDER_COVER;
  }
  const raw =
    value?.url ||
    value?.data?.attributes?.url ||
    value?.data?.url ||
    value?.attributes?.url ||
    null;
  if (!raw) return PLACEHOLDER_COVER;
  return toAbsoluteStrapiUrl(raw) || PLACEHOLDER_COVER;
};

const extractTagNames = (tagsField) => {
  if (!tagsField) return [];
  if (Array.isArray(tagsField)) {
    return tagsField
      .map((tag) => {
        if (typeof tag === "string") return normalizeTag(tag);
        const attrs = tag?.attributes || tag;
        return normalizeTag(attrs?.name);
      })
      .filter(Boolean);
  }
  if (Array.isArray(tagsField.data)) {
    return tagsField.data
      .map((tag) => {
        const attrs = tag?.attributes || tag;
        return normalizeTag(attrs?.name);
      })
      .filter(Boolean);
  }
  return [];
};

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const cardMediaClass = (kind) => {
  if (kind === "book" || kind === "poem") return "is-tall";
  if (kind === "podcast") return "is-wide";
  if (kind === "painting" || kind === "photo") return "is-photo";
  return "is-standard";
};

const isPortraitItem = (item) => {
  const mediaClass = cardMediaClass(item?.kind);
  return mediaClass === "is-photo" || mediaClass === "is-tall";
};

const kindBadgeConfig = {
  article: { icon: FileText, label: "Article" },
  blog: { icon: Feather, label: "Blog" },
  book: { icon: BookOpen, label: "Book" },
  podcast: { icon: Mic, label: "Podcast" },
  poem: { icon: PenLine, label: "Poem" },
  painting: { icon: Palette, label: "Painting" },
  photo: { icon: ImageIcon, label: "Photo" }
};

const getSeriesCount = (item) => {
  if (!item) return null;
  if (item.kind === "podcast" && item.subkind === "series") {
    return Number(item.seriesCount || 0);
  }
  if ((item.kind === "painting" || item.kind === "photo") && Number(item.mediaCount || 0) > 1) {
    return Number(item.mediaCount || 0);
  }
  return null;
};

const relationKeyForItem = (item) => {
  if (!item) return null;
  if (item.kind === "article") return "article";
  if (item.kind === "blog") return "blog";
  if (item.kind === "book") return "book";
  if (item.kind === "poem") return "poem";
  if (item.kind === "painting") return "painting";
  if (item.kind === "photo") return "photo";
  if (item.kind === "podcast") return item.subkind === "series" ? "series" : "podcast";
  return null;
};

const Home = () => {
  const navigate = useNavigate();
  const [allFeedItems, setAllFeedItems] = useState(() => HOME_FEED_CACHE?.items || []);
  const [activeChip, setActiveChip] = useState(() => HOME_VIEW_CACHE?.activeChip || "all");
  const [availableTags, setAvailableTags] = useState(() => HOME_FEED_CACHE?.tags || []);
  const [visibleCount, setVisibleCount] = useState(() => HOME_VIEW_CACHE?.visibleCount || PAGE_SIZE);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1366
  );
  const [loading, setLoading] = useState(() => !HOME_FEED_CACHE);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState(() => HOME_FEED_CACHE?.warnings || []);
  const restoredScrollRef = useRef(Boolean(HOME_VIEW_CACHE));
  const initializedFilterRef = useRef(false);
  const sentinelRef = useRef(null);

  const snapshotHomeView = useCallback(() => {
    if (typeof window === "undefined") return;
    HOME_VIEW_CACHE = {
      activeChip,
      visibleCount,
      scrollY: window.scrollY || 0
    };
  }, [activeChip, visibleCount]);

  useEffect(() => {
    const onResize = () => {
      setViewportWidth(window.innerWidth || 1366);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let mounted = true;

    if (HOME_FEED_CACHE) {
      setAllFeedItems(HOME_FEED_CACHE.items || []);
      setAvailableTags(HOME_FEED_CACHE.tags || []);
      setWarnings(HOME_FEED_CACHE.warnings || []);
      setError(null);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const loadUnifiedFeed = async () => {
      setLoading(true);
      setError(null);
      setWarnings([]);
      setAvailableTags([]);

      const sources = [
        { label: "articles", run: getArticles },
        { label: "blogs", run: getBlogs },
        { label: "books", run: getBooks },
        { label: "podcasts", run: podcastsAPI.getAllPodcasts },
        { label: "poems", run: getPoems },
        { label: "paintings", run: getPaintings },
        { label: "photography", run: getPhotos }
      ];

      const [settled, tagsFromDb] = await Promise.all([
        Promise.allSettled(sources.map((s) => s.run())),
        getPublicTags().catch(() => [])
      ]);
      if (!mounted) return;

      const merged = [];
      const failed = [];

      settled.forEach((result, idx) => {
        const source = sources[idx];
        if (result.status !== "fulfilled") {
          failed.push(source.label);
          return;
        }

        const list = result.value || [];
        if (!Array.isArray(list)) {
          failed.push(source.label);
          return;
        }

        if (source.label === "articles") {
          list.forEach((article) => {
            merged.push({
              id: `article-${article.id}`,
              entityId: String(article.id || ""),
              kind: "article",
              title: article.title || "Untitled article",
              preview: getRichTextPreview(article.content, 180),
              image: toAbsoluteMedia(article.thumbnail || article.images?.[0]),
              meta: `${article.author || "Anonymous"}${formatDate(article.publishDate || article.createdAt) ? ` • ${formatDate(article.publishDate || article.createdAt)}` : ""}`,
              link: `/articles/${article.slug || article.id}`,
              tags: extractTagNames(article.tags)
            });
          });
        }

        if (source.label === "blogs") {
          list.forEach((blog) => {
            merged.push({
              id: `blog-${blog.id}`,
              entityId: String(blog.id || ""),
              kind: "blog",
              title: blog.title || "Untitled blog",
              preview: getRichTextPreview(blog.content, 180),
              image: toAbsoluteMedia(blog.thumbnail || blog.images?.[0]),
              meta: `${blog.author || "Lit·loom"}${formatDate(blog.publishDate || blog.createdAt) ? ` • ${formatDate(blog.publishDate || blog.createdAt)}` : ""}`,
              link: `/blogs/${blog.slug || blog.id}`,
              tags: extractTagNames(blog.tags)
            });
          });
        }

        if (source.label === "books") {
          list.forEach((book) => {
            merged.push({
              id: `book-${book.id}`,
              entityId: String(book.id || ""),
              kind: "book",
              title: book.title || "Untitled book",
              preview: getRichTextPreview(book.description, 180),
              image: toAbsoluteMedia(book.cover),
              meta: `${book.author || "Unknown"}${book.year ? ` • ${book.year}` : ""}`,
              link: `/books/${book.slug || book.id}`,
              tags: extractTagNames(book.tags)
            });
          });
        }

        if (source.label === "podcasts") {
          list.forEach((podcast) => {
            const isSeries = podcast.type === "series";
            const episodesCount = Array.isArray(podcast.episodes) ? podcast.episodes.length : 0;
            if (!podcast.slug) return;
            merged.push({
              id: `podcast-${podcast.id}`,
              entityId: String(podcast.id || ""),
              kind: "podcast",
              subkind: isSeries ? "series" : "podcast",
              title: podcast.title || "Untitled podcast",
              preview: getRichTextPreview(podcast.description, 170),
              image: toAbsoluteMedia(podcast.cover),
              meta: isSeries
                ? `${episodesCount} episodes`
                : `${podcast.host || "Lit·loom"}${podcast.duration ? ` • ${podcast.duration}` : ""}`,
              seriesCount: isSeries ? episodesCount : 0,
              link: isSeries
                ? `/podcasts/series/${podcast.slug}`
                : `/podcasts/floating/${podcast.slug}`,
              tags: extractTagNames(podcast.tags)
            });
          });
        }

        if (source.label === "poems") {
          list.forEach((poem) => {
            merged.push({
              id: `poem-${poem.id}`,
              entityId: String(poem.id || ""),
              kind: "poem",
              title: poem.title || "Untitled poem",
              preview: getRichTextPreview(poem.content, 180),
              image: toAbsoluteMedia(poem.thumbnail || poem.images?.[0]),
              meta: `${poem.author || "Unknown"}${formatDate(poem.createdAt) ? ` • ${formatDate(poem.createdAt)}` : ""}`,
              link: `/poems/${poem.slug || poem.id}`,
              tags: extractTagNames(poem.tags)
            });
          });
        }

        if (source.label === "paintings") {
          list.forEach((painting) => {
            const mediaCount = Array.isArray(painting.images)
              ? painting.images.length
              : (painting.image ? 1 : 0);
            merged.push({
              id: `painting-${painting.id}`,
              entityId: String(painting.id || ""),
              kind: "painting",
              title: painting.title || "Untitled painting",
              preview: getRichTextPreview(painting.description, 170),
              image: toAbsoluteMedia(painting.image),
              meta: `${painting.artist || "Unknown"}${painting.year ? ` • ${painting.year}` : ""}`,
              mediaCount,
              link: `/paintings/${painting.slug || painting.id}`,
              tags: extractTagNames(painting.tags)
            });
          });
        }

        if (source.label === "photography") {
          list.forEach((photo) => {
            const mediaCount = Array.isArray(photo.images)
              ? photo.images.length
              : (photo.image ? 1 : 0);
            merged.push({
              id: `photo-${photo.id}`,
              entityId: String(photo.id || ""),
              kind: "photo",
              title: photo.title || "Untitled photo",
              preview: getRichTextPreview(photo.description, 170),
              image: toAbsoluteMedia(photo.image || photo.floatingImage),
              meta: `${photo.photographer || "Unknown"}${photo.year ? ` • ${photo.year}` : ""}`,
              mediaCount,
              link: `/photos/${photo.slug || photo.id}`,
              tags: extractTagNames(photo.tags)
            });
          });
        }
      });

      if (!merged.length) {
        setError("We could not load content for the home feed.");
        setLoading(false);
        return;
      }

      const randomizedFeed = shuffle(merged);
      const tagMap = new Map();
      (Array.isArray(tagsFromDb) ? tagsFromDb : []).forEach((tag) => {
        const name = normalizeTag(tag?.name);
        if (!name) return;
        const key = name.toLowerCase();
        if (tagMap.has(key)) return;
        tagMap.set(key, {
          key,
          label: name,
          links: tag?.links || {}
        });
      });
      const normalizedTags = [...tagMap.values()];
      HOME_FEED_CACHE = {
        items: randomizedFeed,
        tags: normalizedTags,
        warnings: failed
      };

      setAllFeedItems(randomizedFeed);
      setAvailableTags(normalizedTags);
      setWarnings(failed);
      setLoading(false);
    };

    loadUnifiedFeed();

    return () => {
      mounted = false;
    };
  }, []);

  const chips = useMemo(() => {
    if (availableTags.length > 0) {
      const randomizedDbTags = shuffle([...availableTags]);
      return [{ key: "all", label: "All" }, ...randomizedDbTags];
    }

    const fallbackMap = new Map();
    allFeedItems.forEach((item) => {
      const tags = extractTagNames(item.tags);
      tags.forEach((tag) => {
        const key = tag.toLowerCase();
        if (fallbackMap.has(key)) return;
        fallbackMap.set(key, { key, label: tag });
      });
    });

    const fallbackTags = shuffle([...fallbackMap.values()]);

    return [{ key: "all", label: "All" }, ...fallbackTags];
  }, [allFeedItems, availableTags]);

  const filteredFeed = useMemo(() => {
    if (activeChip === "all") return allFeedItems;
    const selected = availableTags.find((tag) => tag.key === activeChip) || null;
    return allFeedItems.filter((item) =>
      extractTagNames(item.tags).some((tag) => tag.toLowerCase() === activeChip) ||
      (() => {
        if (!selected) return false;
        const relationKey = relationKeyForItem(item);
        if (!relationKey) return false;
        const itemId = String(item.entityId || "").trim();
        if (!itemId) return false;
        const linked = Array.isArray(selected.links?.[relationKey])
          ? selected.links[relationKey]
          : [];
        return linked.includes(itemId);
      })()
    );
  }, [activeChip, allFeedItems, availableTags]);

  useEffect(() => {
    if (activeChip === "all") return;
    const exists = chips.some((chip) => chip.key === activeChip);
    if (!exists) setActiveChip("all");
  }, [activeChip, chips]);

  useEffect(() => {
    if (!initializedFilterRef.current) {
      initializedFilterRef.current = true;
      return;
    }
    setVisibleCount(PAGE_SIZE);
  }, [activeChip]);

  const visibleFeed = useMemo(
    () => filteredFeed.slice(0, visibleCount),
    [filteredFeed, visibleCount]
  );

  const rowSize = useMemo(() => {
    if (viewportWidth <= 520) return 1;
    if (viewportWidth <= 1080) return 2;
    return 3;
  }, [viewportWidth]);

  const feedRows = useMemo(() => {
    const portraits = [];
    const landscapes = [];

    visibleFeed.forEach((item) => {
      if (isPortraitItem(item)) portraits.push(item);
      else landscapes.push(item);
    });

    const rows = [];
    let portraitIndex = 0;
    let landscapeIndex = 0;

    while (portraitIndex < portraits.length || landscapeIndex < landscapes.length) {
      if (portraitIndex < portraits.length) {
        rows.push({
          orientation: "portrait",
          items: portraits.slice(portraitIndex, portraitIndex + rowSize)
        });
        portraitIndex += rowSize;
      }

      if (landscapeIndex < landscapes.length) {
        rows.push({
          orientation: "landscape",
          items: landscapes.slice(landscapeIndex, landscapeIndex + rowSize)
        });
        landscapeIndex += rowSize;
      }
    }

    return rows;
  }, [visibleFeed, rowSize]);

  const hasMore = visibleCount < filteredFeed.length;

  const handleFeedOpen = (e, item) => {
    e.preventDefault();
    snapshotHomeView();
    navigate(item.link);
  };

  useEffect(() => {
    if (loading || !hasMore) return undefined;

    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    let cooldown = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || cooldown) return;
        cooldown = true;

        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredFeed.length));
        window.setTimeout(() => {
          cooldown = false;
        }, 180);
      },
      {
        root: null,
        rootMargin: "240px 0px",
        threshold: 0.01
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, hasMore, filteredFeed.length]);

  useEffect(() => {
    if (loading || !restoredScrollRef.current) return;
    const y = HOME_VIEW_CACHE?.scrollY || 0;
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo(0, y);
      restoredScrollRef.current = false;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, visibleFeed.length]);

  useEffect(() => {
    return () => {
      snapshotHomeView();
    };
  }, [snapshotHomeView]);

  if (loading) {
    return (
      <section className="home-feed-page">
        <PageDiscoverTitle title="Discover" />
        <div className="home-skeleton-chips" aria-hidden="true">
          {Array.from({ length: 7 }).map((_, index) => (
            <span key={`chip-skeleton-${index}`} className="home-skeleton-chip" />
          ))}
        </div>
        <div className="home-loading-feed" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, index) => {
            const mediaClass = index % 3 === 0 ? "is-photo" : index % 3 === 1 ? "is-standard" : "is-wide";
            return (
              <article key={`home-skeleton-card-${index}`} className="home-loading-card">
                <div className={`home-loading-thumb ${mediaClass}`} />
                <div className="home-loading-body">
                  <span className="home-loading-line is-title" />
                  <span className="home-loading-line is-mid" />
                  <span className="home-loading-line is-short" />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="home-feed-page">
        <PageDiscoverTitle title="Discover" />
        <PageErrorState
          title="Unable to load home feed"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </section>
    );
  }

  return (
    <section className="home-feed-page">
      <PageDiscoverTitle title="Discover" />
      <div className="home-feed-chips" role="tablist" aria-label="Feed filters">
        {chips.map((chip) => (
          <button
            key={chip.key}
            className={`home-chip ${activeChip === chip.key ? "is-active" : ""}`}
            onClick={() => setActiveChip(chip.key)}
            type="button"
          >
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {warnings.length > 0 && (
        <p className="home-feed-warning">
          Some sources are unavailable right now: {warnings.join(", ")}.
        </p>
      )}

      {visibleFeed.length === 0 ? (
        <div className="home-feed-empty">
          <h3>No content in this filter yet.</h3>
          <p>Try another chip to explore more posts.</p>
        </div>
      ) : (
        <div className="home-unified-feed">
          {feedRows.map((row, rowIndex) => (
            <div key={`${row.orientation}-${rowIndex}`} className={`home-feed-row is-${row.orientation}`}>
              {row.items.map((item) => {
                const config = kindBadgeConfig[item.kind] || kindBadgeConfig.article;
                const KindIcon = config.icon;
                const seriesCount = getSeriesCount(item);
                const isPodcastSeries = item.kind === "podcast" && item.subkind === "series";
                const isImageSeries =
                  (item.kind === "painting" || item.kind === "photo") && Number(seriesCount || 0) > 1;
                const showSeriesPill = isPodcastSeries || isImageSeries;

                return (
                  <Link
                    key={item.id}
                    to={item.link}
                    className="home-unified-card"
                    onClick={(e) => handleFeedOpen(e, item)}
                  >
                    <div className={`home-unified-thumb ${cardMediaClass(item.kind)}`}>
                      <img src={item.image || PLACEHOLDER_COVER} alt={item.title} loading="lazy" />
                      <div className="home-kind-pills" aria-hidden="true">
                        <span className="home-kind-pill" title={config.label}>
                          <KindIcon size={13} />
                        </span>
                        {showSeriesPill && (
                          <span className="home-kind-pill home-series-pill" title={`Series (${seriesCount || 0})`}>
                            <Layers size={13} />
                            <strong>{seriesCount || 0}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="home-unified-body">
                      <h3>{item.title}</h3>
                      {item.preview && <p>{item.preview}</p>}
                      <div className="home-unified-meta">
                        <span>{item.meta}</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {hasMore && <div ref={sentinelRef} className="home-feed-sentinel" aria-hidden="true" />}
      {!hasMore && filteredFeed.length > 0 && (
        <p className="home-feed-end">No more content to discover.</p>
      )}
    </section>
  );
};

export default Home;
