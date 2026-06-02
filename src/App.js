import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { PodcastPlayerProvider } from './contexts/PodcastPlayerContext';
import GlobalPodcastPlayer from './components/GlobalPodcastPlayer';
import { ToastProvider } from "./components/toast/ToastProvider";

// global behavior
import ScrollToTop from "./ScrollToTop";

// layout
import Navbar from "./components/navbar/Navbar";
import Sidebar from "./components/sidebar/Sidebar";
import MobileFooterNav from "./components/mobileFooterNav/MobileFooterNav";
import Footer from "./components/footer/Footer";

// pages
import Home from "./pages/Home/Home";

// About & Contact
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import Subscribe from "./pages/Subscribe/Subscribe";
import PrivacyPolicy from "./pages/Privacy/PrivacyPolicy";
import PodcastSubmission from "./pages/PodcastSubmission/PodcastSubmission";
import ArticleSubmission from "./pages/ArticleSubmission/ArticleSubmission";
import BookSubmission from "./pages/BookSubmission/BookSubmission";
import Search from "./pages/Search/Search";

// Articles
import ArticlesList from "./pages/Articles/ArticlesList";
import ArticleSingle from "./pages/Articles/ArticleSingle";

// Blogs
import BlogsList from "./pages/Blogs/BlogsList";
import BlogSingle from "./pages/Blogs/BlogSingle";

// Books
import BooksList from "./pages/Books/BooksList";
import BookSingle from "./pages/Books/BookSingle";

// Podcasts
import PodcastsList from "./pages/Podcasts/PodcastsList";
import PodcastSingle from "./pages/Podcasts/PodcastSingle";
import PodcastSeries from "./pages/Podcasts/PodcastSeries";
import FloatingPodcast from "./pages/Podcasts/FloatingPodcast";

// Poems - Updated imports and routes
import PoemsList from "./pages/Artworks/Poems/PoemsList";
import PoemSingle from "./pages/Artworks/Poems/PoemSingle";

// Paintings
import PaintingsList from "./pages/Artworks/Paintings/PaintingsList";
import PaintingSingle from "./pages/Artworks/Paintings/PaintingSingle";

// Photography
import PhotographyList from "./pages/Artworks/Photography/PhotographyList";
import PhotographySingle from "./pages/Artworks/Photography/PhotographySingle";

// Not Found
import NotFound from "./pages/NotFound/NotFound";

const BASE_TAB_TITLE = "lit-loom";
const BASE_META_DESCRIPTION =
  "Litloom is a literature and creative platform for articles, blogs, books, podcasts, poems, paintings, and photography.";

const getPageTitle = (pathname) => {
  const path = String(pathname || "/");

  if (path === "/") return BASE_TAB_TITLE;
  if (path === "/about") return `${BASE_TAB_TITLE} - about`;
  if (path === "/contact") return `${BASE_TAB_TITLE} - contact`;
  if (path === "/subscribe") return `${BASE_TAB_TITLE} - subscribe`;
  if (path === "/privacy") return `${BASE_TAB_TITLE} - privacy policy`;
  if (path === "/podcast-submission") return `${BASE_TAB_TITLE} - podcast submission`;
  if (path === "/article-submission") return `${BASE_TAB_TITLE} - article submission`;
  if (path === "/book-submission") return `${BASE_TAB_TITLE} - book submission`;
  if (path === "/search") return `${BASE_TAB_TITLE} - search results`;

  if (path === "/articles") return `${BASE_TAB_TITLE} - articles`;
  if (path.startsWith("/articles/")) return `${BASE_TAB_TITLE} - article`;

  if (path === "/blogs") return `${BASE_TAB_TITLE} - blogs`;
  if (path.startsWith("/blogs/")) return `${BASE_TAB_TITLE} - blog`;

  if (path === "/books") return `${BASE_TAB_TITLE} - books`;
  if (path.startsWith("/books/")) return `${BASE_TAB_TITLE} - book`;

  if (path === "/podcasts") return `${BASE_TAB_TITLE} - podcasts`;
  if (path.startsWith("/podcasts/series/")) return `${BASE_TAB_TITLE} - podcast series`;
  if (path.startsWith("/podcasts/floating/")) return `${BASE_TAB_TITLE} - floating podcast`;
  if (path.startsWith("/podcasts/")) return `${BASE_TAB_TITLE} - podcast`;

  if (path === "/poems" || path === "/artworks/poems") return `${BASE_TAB_TITLE} - poems`;
  if (path.startsWith("/poems/") || path.startsWith("/artworks/poems/")) return `${BASE_TAB_TITLE} - poem`;

  if (path === "/paintings" || path === "/artworks/paintings") return `${BASE_TAB_TITLE} - paintings`;
  if (path.startsWith("/paintings/") || path.startsWith("/artworks/paintings/")) return `${BASE_TAB_TITLE} - painting`;

  if (path === "/photos" || path === "/artworks/photography") return `${BASE_TAB_TITLE} - photography`;
  if (path.startsWith("/photos/") || path.startsWith("/artworks/photography/")) return `${BASE_TAB_TITLE} - photo`;

  return `${BASE_TAB_TITLE} - page`;
};

const getPageDescription = (pathname) => {
  const path = String(pathname || "/");

  if (path === "/") return BASE_META_DESCRIPTION;
  if (path === "/articles") return "Read long-form Litloom articles on ideas, culture, and creativity.";
  if (path === "/blogs") return "Explore fresh blog posts and perspectives from Litloom creators.";
  if (path === "/books") return "Discover curated books and summaries available on Litloom.";
  if (path === "/podcasts") return "Listen to Litloom podcasts and series episodes.";
  if (path === "/poems" || path === "/artworks/poems") return "Browse poems and creative writing in Litloom artworks.";
  if (path === "/paintings" || path === "/artworks/paintings") return "Explore Litloom paintings and visual artworks.";
  if (path === "/photos" || path === "/artworks/photography") return "View photography and visual stories on Litloom.";
  if (path === "/search") return "Search Litloom content across all categories.";
  if (path === "/about") return "Learn about Litloom and its creative platform mission.";
  if (path === "/contact") return "Contact the Litloom team using the official contact form.";
  if (path === "/subscribe") return "Subscribe to Litloom newsletters and updates.";
  if (path === "/privacy") return "Read Litloom privacy policy and data handling details.";
  return BASE_META_DESCRIPTION;
};

const upsertMetaByName = (name, content) => {
  if (typeof document === "undefined") return;
  const metaName = String(name || "").trim();
  if (!metaName) return;
  let tag = document.querySelector(`meta[name="${metaName}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", metaName);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", String(content || ""));
};

const upsertMetaByProperty = (property, content) => {
  if (typeof document === "undefined") return;
  const metaProperty = String(property || "").trim();
  if (!metaProperty) return;
  let tag = document.querySelector(`meta[property="${metaProperty}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", metaProperty);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", String(content || ""));
};

const upsertCanonicalLink = (href) => {
  if (typeof document === "undefined") return;
  const cleanHref = String(href || "").trim();
  if (!cleanHref) return;
  let tag = document.querySelector('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", "canonical");
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", cleanHref);
};

const RouteTitleManager = () => {
  const location = useLocation();

  React.useEffect(() => {
    const title = getPageTitle(location.pathname);
    const description = getPageDescription(location.pathname);
    const canonical = `${window.location.origin}${location.pathname}`;

    document.title = title;
    upsertMetaByName("description", description);
    upsertMetaByName("robots", "index,follow");
    upsertMetaByProperty("og:title", title);
    upsertMetaByProperty("og:description", description);
    upsertMetaByProperty("og:type", "website");
    upsertMetaByProperty("og:url", canonical);
    upsertMetaByName("twitter:card", "summary_large_image");
    upsertMetaByName("twitter:title", title);
    upsertMetaByName("twitter:description", description);
    upsertCanonicalLink(canonical);
  }, [location.pathname, location.search]);

  return null;
};

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  const mainOffset = isMobile ? "0px" : (sidebarCollapsed ? "96px" : "188px");
  const navHeight = isMobile ? 65 : 70;

  // Keep responsive state in sync on resize: close mobile sidebar when moving to desktop,
  // and ensure collapsed is false on small screens so labels remain visible.
  React.useEffect(() => {
    const onResize = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
      if (w <= 768) {
        setIsMobile(true);
        // on small screens ensure desktop-collapsed state is cleared
        setSidebarCollapsed(false);
      } else {
        setIsMobile(false);
      }
    };
    window.addEventListener('resize', onResize);
    // call once to initialize
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <PodcastPlayerProvider>
    <ToastProvider>
    <Router>
      <RouteTitleManager />
      <ScrollToTop />

      <Navbar
        onToggleCollapse={toggleSidebar}
      />
      <Sidebar 
        collapsed={sidebarCollapsed} 
        mobileOpen={false}
        onCloseMobile={undefined}
      />

      <main
        className="main-content"
        style={{
          "--lit-main-offset": mainOffset,
          "--lit-nav-height": `${navHeight}px`,
          marginLeft: "var(--lit-main-offset)",
          marginTop: `${navHeight}px`,
          minHeight: `calc(100vh - ${navHeight}px)`,
          transition: "margin-left 0.25s ease",
          padding: 0,
          paddingBottom: isMobile ? "84px" : 0
        }}
      >
        <div className="content-container">
          <Routes>
            {/* Home */}
            <Route path="/" element={<Home />} />

            {/* About & Contact */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/podcast-submission" element={<PodcastSubmission />} />
            <Route path="/article-submission" element={<ArticleSubmission />} />
            <Route path="/book-submission" element={<BookSubmission />} />
            <Route path="/search" element={<Search />} />

            {/* Articles */}
            <Route path="/articles" element={<ArticlesList />} />
            <Route path="/articles/:id" element={<ArticleSingle />} />

            {/* Blogs */}
            <Route path="/blogs" element={<BlogsList />} />
            <Route path="/blogs/:id" element={<BlogSingle />} />

            {/* Books */}
            <Route path="/books" element={<BooksList />} />
            <Route path="/books/:id" element={<BookSingle />} />

            {/* Podcasts */}
            <Route path="/podcasts" element={<PodcastsList />} />
            <Route path="/podcasts/:slug" element={<PodcastSingle />} />
            <Route path="/podcasts/floating/:slug" element={<FloatingPodcast />} />
            <Route path="/podcasts/series/:slug" element={<PodcastSeries />} />

            {/* Poems - Updated paths */}
            <Route path="/poems" element={<PoemsList />} />
            <Route path="/poems/:id" element={<PoemSingle />} />

            {/* Paintings */}
            <Route path="/paintings" element={<PaintingsList />} />
            <Route path="/paintings/:id" element={<PaintingSingle />} />

            {/* Photography */}
            <Route path="/photos" element={<PhotographyList />} />
            <Route path="/photos/:id" element={<PhotographySingle />} />

            {/* Artworks redirects (for backward compatibility) */}
            <Route path="/artworks/poems" element={<PoemsList />} />
            <Route path="/artworks/poems/:id" element={<PoemSingle />} />
            <Route path="/artworks/paintings" element={<PaintingsList />} />
            <Route path="/artworks/paintings/:id" element={<PaintingSingle />} />
            <Route path="/artworks/photography" element={<PhotographyList />} />
            <Route path="/artworks/photography/:id" element={<PhotographySingle />} />

            {/* 404 - Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>

      <MobileFooterNav />
      <Footer />
      <GlobalPodcastPlayer />
    </Router>
    </ToastProvider>
    </PodcastPlayerProvider>
  );
};

export default App;
