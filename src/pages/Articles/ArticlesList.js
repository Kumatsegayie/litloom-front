import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getArticles } from "../../services/articlesAPI";
import { Upload } from "lucide-react";
import { getRichTextPreview } from "../../utils/richText";
import { resolveMediaUrl } from "../../utils/media";
import PageSkeleton from "../../components/ui/PageSkeleton";
import PageErrorState from "../../components/ui/PageErrorState";
import PageDiscoverTitle from "../../components/ui/PageDiscoverTitle";
import "./Articles.css";

const ArticlesList = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const data = await getArticles();
        setArticles(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        // Restore scroll position after content loads
        const savedScrollPosition = sessionStorage.getItem('articlesScrollPosition');
        const navigated = sessionStorage.getItem('articlesNavigated');
        if (savedScrollPosition && navigated === 'true') {
          setTimeout(() => {
            window.scrollTo(0, parseInt(savedScrollPosition, 10));
          }, 200); // Small delay to ensure content is fully rendered
          sessionStorage.removeItem('articlesNavigated');
        }
      }
    };

    fetchArticles();
  }, []);

  // Save scroll position when navigating to article
  const handleArticleClick = (articleRef) => {
    sessionStorage.setItem('articlesScrollPosition', window.scrollY.toString());
    sessionStorage.setItem('articlesNavigated', 'true');
    navigate(`/articles/${articleRef}`);
  };

  if (loading) {
    return (
      <section className="articles-page">
        <PageDiscoverTitle title="Articles" />
        <PageSkeleton
          variant="feed"
          cardCount={6}
          feedClassName="articles-feed"
          cardClassName="article-card"
          thumbClassName="article-thumb"
          bodyClassName="article-info"
          rows={["mid", "full", "short"]}
        />
      </section>
    );
  }

  if (error) {
    return (
      <section className="articles-page">
        <PageDiscoverTitle title="Articles" />
        <PageErrorState
          title="Unable to load articles"
          message={`Error loading articles: ${error}`}
          onRetry={() => window.location.reload()}
          onBack={() => navigate("/")}
        />
      </section>
    );
  }
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  return (
    <section className="articles-page">
      <PageDiscoverTitle title="Articles" />
      
      <div className="articles-feed">
        {articles.map(article => (
          <article
            key={article.id}
            className="article-card"
            onClick={() => handleArticleClick(article.slug || article.id)}
          >
            <div className="article-thumb">
              <img
                src={resolveMediaUrl(article.thumbnail, resolveMediaUrl(article.images?.[0], "/placeholder.jpg"))}
                alt={article.title}
              />
            </div>

            <div className="article-info">
              <h2>{article.title}</h2>
              <p className="article-preview">{getRichTextPreview(article.content, 120)}</p>
              <div className="article-meta">
                <span className="article-author">By {article.author || 'Anonymous'}</span>
                <span className="article-date">{formatDate(article.publishDate || article.createdAt)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Floating Action Button */}
      <div className="article-actions">
        <button className="action-btn upload-btn" onClick={() => navigate('/article-submission')} aria-label="Submit an article">
          <Upload size={20} />
        </button>
      </div>
    </section>
  );
};

export default ArticlesList;
