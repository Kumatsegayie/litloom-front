import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import searchAPI from "../../services/searchAPI";
import { getRichTextPreview } from "../../utils/richText";
import PageSkeleton from "../../components/ui/PageSkeleton";
import PageErrorState from "../../components/ui/PageErrorState";
import FixedBackButton from "../../components/contentActions/FixedBackButton";
import { navigateBackOr } from "../../utils/navigation";
import "./Search.css";

const previewText = (item) => {
  const raw = item?.description || item?.content || "";
  const txt = getRichTextPreview(raw, 120);
  return txt || "";
};

const Search = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleBack = () => navigateBackOr(navigate, "/");
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setError(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    let mounted = true;

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      (async () => {
        try {
          setError(null);
          const backendResults = await searchAPI.getResults(query);
          if (!mounted) return;

          setResults(backendResults || []);
        } catch (e) {
          setResults([]);
          setError(e.message || "Search failed");
        } finally {
          setLoading(false);
        }
      })();
    }, 300);

    return () => {
      mounted = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (loading) {
    return (
      <div className="search-page">
        <FixedBackButton onClick={handleBack} ariaLabel="Back" />
        <div className="search-container">
          <h1>{t("Search results")}</h1>
          <PageSkeleton variant="list" cardCount={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-page">
        <FixedBackButton onClick={handleBack} ariaLabel="Back" />
        <div className="search-container">
          <h1>{t("Search results")}</h1>
          <PageErrorState
            title="Search failed"
            message={error}
            onRetry={() => window.location.reload()}
            onBack={handleBack}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="search-page">
      <FixedBackButton onClick={handleBack} ariaLabel="Back" />
      <div className="search-container">
        <div className="search-header">
          <h1>{t("Search results")}</h1>
          {query && (
            <p className="search-subtitle">
              {results.length} {results.length === 1 ? "result" : "results"} for{" "}
              <span className="search-query">"{query}"</span>
            </p>
          )}
        </div>

        {results.length === 0 && (
          <div className="search-empty">
            <h2>{t("No results found")}</h2>
            <p>Try another keyword, shorter phrase, or related topic.</p>
          </div>
        )}

        <div className="search-results">
          {results.map((r, idx) => {
            const preview = previewText(r);
            return (
              <Link
                key={r.id || r._id || idx}
                to={r.link || "#"}
                state={{
                  fromSearch: true,
                  searchQuery: query
                }}
                className="search-result-item"
              >
                <div className="search-result-thumb-wrap">
                  {r.image ? (
                    <img src={r.image} alt={r.title || r.name || "Result"} className="search-result-thumb" />
                  ) : (
                    <span className="search-result-thumb search-result-thumb-placeholder">
                      {(r.type || "?").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="search-result-main">
                  <h3 className="search-result-title">{r.title || r.name || r.slug}</h3>
                  {preview && <p className="search-result-description">{preview}</p>}
                  <div className="result-chips">
                    {r.type && <span className="result-chip result-chip-type">{r.type}</span>}
                    {r.authorText && <span className="result-chip">{r.authorText}</span>}
                    {r.categoryText && <span className="result-chip">{r.categoryText}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Search;
