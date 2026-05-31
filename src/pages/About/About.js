import React from "react";
import { BookOpenText, Compass, ShieldCheck, Sparkles, Users } from "lucide-react";
import PageBackButton from "../../components/ui/PageBackButton";
import "./About.css";

const About = () => {
  return (
    <section className="pro-page about-page">
      <PageBackButton fallbackPath="/" label="Back" />

      <div className="pro-hero section-reveal">
        <span className="pro-badge">
          <BookOpenText size={14} />
          About Litloom
        </span>
        <h1>A Quiet Place For Thoughtful Content</h1>
        <p>
          Litloom brings literature, voice, and visual art into one focused platform. We design for depth, clarity,
          and meaningful discovery over noise.
        </p>
      </div>

      <div className="pro-grid about-grid">
        <article className="pro-panel section-reveal delay-1">
          <h2>What we stand for</h2>
          <p className="pro-panel-lead">
            We support creators and readers who value quality storytelling and thoughtful ideas.
          </p>
          <ul className="pro-feature-list">
            <li className="pro-feature-item">
              <Compass size={17} />
              <div>
                <strong>Purposeful curation</strong>
                <span>Content is selected to be useful, engaging, and worth your time.</span>
              </div>
            </li>
            <li className="pro-feature-item">
              <Users size={17} />
              <div>
                <strong>Creative community</strong>
                <span>Writers, artists, and listeners share work in one connected space.</span>
              </div>
            </li>
            <li className="pro-feature-item">
              <ShieldCheck size={17} />
              <div>
                <strong>Trust and transparency</strong>
                <span>Clear policies, moderated comments, and reliable communication.</span>
              </div>
            </li>
          </ul>
        </article>

        <article className="pro-panel section-reveal delay-2">
          <h2>Litloom in short</h2>
          <p className="pro-panel-lead">
            Started in 2025, Litloom grew from a small idea into a publishing platform focused on intentional user
            experience and creator growth.
          </p>
          <div className="pro-soft-grid">
            <div className="pro-soft-card">
              <strong>Founded</strong>
              <span>2025</span>
            </div>
            <div className="pro-soft-card">
              <strong>Core media</strong>
              <span>Articles, books, podcasts, and artworks.</span>
            </div>
            <div className="pro-soft-card">
              <strong>Approach</strong>
              <span>Focused design, clean reading, lightweight interaction.</span>
            </div>
          </div>
          <p className="about-note">
            <Sparkles size={14} />
            We are continuously improving performance, accessibility, and creator tools.
          </p>
        </article>
      </div>
    </section>
  );
};

export default About;
