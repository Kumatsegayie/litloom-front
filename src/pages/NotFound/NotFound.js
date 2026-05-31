import React from "react";
import { useNavigate } from "react-router-dom";
import "./NotFound.css";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <section className="not-found-page">
      <div className="not-found-shell">
        <div className="not-found-badge">404</div>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-description">
          The page you requested is unavailable or may have moved.
        </p>
        <div className="not-found-actions">
          <button className="hero-btn primary" onClick={() => navigate("/")}>
            Return home
          </button>
          <button className="hero-btn secondary" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
        <div className="not-found-links">
          <button type="button" className="not-found-link" onClick={() => navigate("/articles")}>
            Articles
          </button>
          <button type="button" className="not-found-link" onClick={() => navigate("/blogs")}>
            Blogs
          </button>
          <button type="button" className="not-found-link" onClick={() => navigate("/books")}>
            Books
          </button>
          <button type="button" className="not-found-link" onClick={() => navigate("/podcasts")}>
            Podcasts
          </button>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
