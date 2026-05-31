import React, { useEffect, useRef, useState } from "react";
import { Search, Languages, Menu, Settings2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import searchAPI from "../../services/searchAPI";
import { getRichTextPreview } from "../../utils/richText";
import "./Navbar.css";
import longLogo from "./logo.png";
import sidebarFavicon from "../sidebar/favicon.ico";

const SEARCH_HISTORY_KEY = "litloom_search_history";
const SEARCH_HISTORY_LIMIT = 8;

const preview = (text, max = 96) => {
  const clean = String(getRichTextPreview(text, max) || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean;
};

const readSearchHistory = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SEARCH_HISTORY_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string" && item.trim()) : [];
  } catch {
    return [];
  }
};

const writeSearchHistory = (items) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage failures.
  }
};

const Navbar = ({ onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => readSearchHistory());
  const [showSettings, setShowSettings] = useState(false);
  const searchRef = useRef(null);
  const settingsRef = useRef(null);
  const debounceRef = useRef(null);
  const fromSearch = Boolean(location.state?.fromSearch);
  const fromSearchQuery =
    typeof location.state?.searchQuery === "string" ? location.state.searchQuery : "";

  const pushRecentSearch = (term) => {
    const q = String(term || "").trim();
    if (!q) return;
    setRecentSearches((prev) => {
      const next = [q, ...prev.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, SEARCH_HISTORY_LIMIT);
      writeSearchHistory(next);
      return next;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    writeSearchHistory([]);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'am' : 'en';
    i18n.changeLanguage(newLang);
  };

  const commitSearch = (value) => {
    const q = (value || "").trim();
    if (!q) return;
    pushRecentSearch(q);
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(q)}`, {
      state: {
        fromSearch: true,
        searchQuery: q
      }
    });
  };

  const onSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitSearch(searchQuery);
    }
  };

  useEffect(() => {
    if (location.pathname === "/search") {
      const q = new URLSearchParams(location.search).get("q") || "";
      setSearchQuery(q);
      return;
    }
    // Keep term only while navigating inside search flow.
    if (fromSearch && fromSearchQuery) {
      setSearchQuery(String(fromSearchQuery));
      return;
    }

    // Leaving search flow: clear typed term and suggestion panel.
    setSearchQuery("");
    setShowSuggestions(false);
    setSuggestions([]);
  }, [location.pathname, location.search, fromSearch, fromSearchQuery]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const results = await searchAPI.getResults(q);
        const top = (results || []).slice(0, 6).map((item) => ({
          id: `${item.type || "item"}-${item.id || item.title}`,
          type: item.type || "result",
          title: item.title || item.name || "Untitled",
          description: preview(item.description || item.content || ""),
          meta: [item.authorText, item.categoryText].filter(Boolean).join(" • "),
          image: item.image || null,
          link: item.link || null
        }));
        setSuggestions(top);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 240);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  return (
    <header className="navbar">
      <div className="nav-left">
        <button 
          className="icon-btn nav-toggle-btn" 
          onClick={() => {
            // On phones we keep this as a static brand icon to avoid accidental refresh/tap actions.
            const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
            if (w > 768 && onToggleCollapse) {
              onToggleCollapse();
            }
          }}
          aria-label="Toggle menu"
          aria-expanded={false}
          data-sidebar-toggle="true"
          style={{ zIndex: 1001 }}
        >
          <Menu size={23} className="nav-toggle-menu-icon" />
          <img src={sidebarFavicon} alt="Open menu" className="nav-toggle-favicon-mobile" />
        </button>
        <img src={longLogo} alt="Litloom" className="nav-long-logo" />
      </div>

      <div className="nav-search" ref={searchRef}>
        <Search size={20} className="search-icon" />
        <input 
          placeholder={t("Search")} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={onSearchKeyDown}
          onFocus={() => setShowSuggestions(true)}
          aria-label="Search content"
        />
        {showSuggestions && (
          <div className="nav-search-suggestions">
            {searchQuery.trim().length >= 2 ? (
              <>
                {suggestionsLoading && (
                  <div className="nav-search-empty">Searching...</div>
                )}

                {!suggestionsLoading && suggestions.length === 0 && (
                  <div className="nav-search-empty">No suggestion found.</div>
                )}

                {!suggestionsLoading && suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="nav-search-suggestion"
                    onClick={() => {
                      const activeQuery = searchQuery.trim() || item.title;
                      pushRecentSearch(activeQuery);
                      setSearchQuery(item.title);
                      setShowSuggestions(false);
                      if (item.link) {
                        navigate(item.link, {
                          state: {
                            fromSearch: true,
                            searchQuery: activeQuery
                          }
                        });
                      } else {
                        commitSearch(item.title);
                      }
                    }}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="nav-suggest-thumb" />
                    ) : (
                      <span className="nav-suggest-thumb nav-suggest-thumb-placeholder">
                        {(item.type || "?").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="nav-suggest-main">
                      <span className="nav-suggest-top">
                        <span className="nav-suggest-title">{item.title}</span>
                        <span className="nav-suggest-type">{item.type}</span>
                      </span>
                      {item.description && (
                        <span className="nav-suggest-desc">{item.description}</span>
                      )}
                      {item.meta && (
                        <span className="nav-suggest-meta">{item.meta}</span>
                      )}
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  className="nav-search-suggestion nav-search-see-all"
                  onClick={() => commitSearch(searchQuery)}
                >
                  Search for "{searchQuery.trim()}"
                </button>
              </>
            ) : (
              <>
                {recentSearches.length === 0 ? (
                  <div className="nav-search-empty">Recent searches will appear here.</div>
                ) : (
                  <>
                    <div className="nav-history-header">
                      <span className="nav-suggest-section-title">Recent searches</span>
                      <button
                        type="button"
                        className="nav-history-clear"
                        onClick={clearRecentSearches}
                      >
                        Clear
                      </button>
                    </div>
                    {recentSearches.map((term, index) => (
                      <button
                        key={`${term}-${index}`}
                        type="button"
                        className="nav-search-suggestion nav-search-history-item"
                        onClick={() => {
                          setSearchQuery(term);
                          commitSearch(term);
                        }}
                      >
                        <Search size={14} className="nav-history-icon" />
                        <span className="nav-history-text">{term}</span>
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="nav-right">
        <div className="nav-settings" ref={settingsRef}>
          <button
            className="icon-btn settings-btn"
            onClick={() => setShowSettings((prev) => !prev)}
            aria-label="Open settings"
            aria-expanded={showSettings}
          >
            <Settings2 size={20} />
          </button>

          {showSettings && (
            <div className="nav-settings-menu" role="menu" aria-label="Settings menu">
              <button
                type="button"
                className="nav-settings-item"
                onClick={() => {
                  toggleLanguage();
                  setShowSettings(false);
                }}
              >
                <Languages size={16} />
                <span>
                  {i18n.language === "en"
                    ? t("Language: English")
                    : t("Language: Amharic")}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
