import React from "react";
import { Clock3, FileText } from "lucide-react";
import PageBackButton from "../../components/ui/PageBackButton";
import "./ArticleSubmission.css";

const ArticleSubmission = () => {
  return (
    <section className="pro-page article-submission-page feature-coming-shell">
      <div className="feature-coming-content" aria-hidden="true">
        <div className="pro-hero">
          <span className="pro-badge">
            <FileText size={14} />
            Article Submission
          </span>
          <h1>Submit An Article For Editorial Review</h1>
          <p>
            Share your article with the Litloom team. We review every submission and notify you by email
            after approval or rejection.
          </p>
        </div>

        <div className="pro-grid article-submission-grid">
          <article className="pro-panel">
            <h2>Submission notes</h2>
            <p className="pro-panel-lead">
              Keep titles clear, use descriptive tags, and ensure your article content is complete.
            </p>
            <div className="feature-coming-lines">
              <span />
              <span />
              <span />
              <span />
            </div>
          </article>

          <article className="pro-panel">
            <h2>Submit article</h2>
            <p className="pro-panel-lead">All required fields will be available once this feature is live.</p>
            <div className="feature-coming-lines">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </article>
        </div>
      </div>

      <div className="feature-coming-overlay">
        <PageBackButton fallbackPath="/articles" label="Back" className="feature-coming-back" />
        <article className="feature-coming-card">
          <span className="feature-coming-pill">
            <Clock3 size={14} />
            Future Feature
          </span>
          <h2>Article Submission Is Coming Soon</h2>
          <p>
            This module is being finalized and will be enabled in a future update.
          </p>
        </article>
      </div>
    </section>
  );
};

export default ArticleSubmission;
