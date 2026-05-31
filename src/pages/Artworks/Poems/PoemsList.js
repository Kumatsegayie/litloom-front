import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPoems } from "../../../services/poemsAPI";
import { getRichTextPreview } from "../../../utils/richText";
import { resolveMediaUrl } from "../../../utils/media";
import PageSkeleton from "../../../components/ui/PageSkeleton";
import PageErrorState from "../../../components/ui/PageErrorState";
import PageDiscoverTitle from "../../../components/ui/PageDiscoverTitle";
import "./Poems.css";

const PoemsList = () => {
  const navigate = useNavigate();
  const [poems, setPoems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPoems = async () => {
      try {
        const data = await getPoems();
        setPoems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        // Restore scroll position after content loads
        const savedScrollPosition = sessionStorage.getItem('poemsScrollPosition');
        const navigated = sessionStorage.getItem('poemsNavigated');
        if (savedScrollPosition && navigated === 'true') {
          setTimeout(() => {
            window.scrollTo(0, parseInt(savedScrollPosition, 10));
          }, 200); // Small delay to ensure content is fully rendered
          sessionStorage.removeItem('poemsNavigated');
        }
      }
    };
    fetchPoems();
  }, []);

  // Save scroll position when navigating to poem
  const handlePoemClick = (poemRef) => {
    sessionStorage.setItem('poemsScrollPosition', window.scrollY.toString());
    sessionStorage.setItem('poemsNavigated', 'true');
    navigate(`/poems/${poemRef}`);
  };

  if (loading) {
    return (
      <section className="poems-page">
        <PageDiscoverTitle title="Poems" />
        <PageSkeleton
          variant="feed"
          cardCount={6}
          feedClassName="poems-feed"
          cardClassName="poem-card"
          thumbClassName="poem-thumb"
          bodyClassName="poem-info"
          rows={["mid", "full", "short"]}
        />
      </section>
    );
  }

  if (error) {
    return (
      <section className="poems-page">
        <PageDiscoverTitle title="Poems" />
        <PageErrorState
          title="Unable to load poems"
          message={`Error loading poems: ${error}`}
          onRetry={() => window.location.reload()}
          onBack={() => navigate("/")}
        />
      </section>
    );
  }

  return (
    <section className="poems-page">
      <PageDiscoverTitle title="Poems" />

      <div className="poems-feed">
        {poems.map(poem => (
          <article
            key={poem.id}
            className="poem-card"
            onClick={() => handlePoemClick(poem.slug || poem.id)}
          >
            <div className="poem-thumb">
              <img
                src={resolveMediaUrl(poem.thumbnail, resolveMediaUrl(poem.images?.[0], "https://via.placeholder.com/320x200"))}
                alt={poem.title}
              />
            </div>

            <div className="poem-info">
              <h2>{poem.title}</h2>
              <p className="poem-preview">{getRichTextPreview(poem.content, 100)}</p>
              <div className="poem-meta">
                <span className="poem-author">By {poem.author}</span>
                {poem.createdAt && <span className="poem-date">{new Date(poem.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Floating Action Button - Removed for poems */}
    </section>
  );
};

export default PoemsList;
