import React from "react";
import { Clock3, Mic } from "lucide-react";
import PageBackButton from "../../components/ui/PageBackButton";
import "./PodcastSubmission.css";

const PodcastSubmission = () => {
  return (
    <section className="pro-page podcast-submission-page feature-coming-shell">
      <div className="feature-coming-content" aria-hidden="true">
        <div className="pro-hero">
          <span className="pro-badge">
            <Mic size={14} />
            Podcast Submission
          </span>
          <h1>Submit A Podcast Episode</h1>
          <p>
            Send your podcast for review. After editorial decision, Litloom will email you with the approval
            or rejection result.
          </p>
        </div>

        <div className="pro-grid podcast-submission-grid">
          <article className="pro-panel">
            <h2>Before you submit</h2>
            <p className="pro-panel-lead">
              Upload one clear audio file, provide a concise description, and include duration.
            </p>
            <div className="feature-coming-lines">
              <span />
              <span />
              <span />
              <span />
            </div>
          </article>

          <article className="pro-panel">
            <h2>Submit podcast</h2>
            <p className="pro-panel-lead">Podcast upload form will be available here soon.</p>
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
        <PageBackButton fallbackPath="/podcasts" label="Back" className="feature-coming-back" />
        <article className="feature-coming-card">
          <span className="feature-coming-pill">
            <Clock3 size={14} />
            Future Feature
          </span>
          <h2>Podcast Submission Is Coming Soon</h2>
          <p>
            This module is being finalized and will be enabled in a future update.
          </p>
        </article>
      </div>
    </section>
  );
};

export default PodcastSubmission;
