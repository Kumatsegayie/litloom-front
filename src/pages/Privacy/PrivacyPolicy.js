import React from "react";
import { Clock3, Database, Lock, Mail, ShieldCheck } from "lucide-react";
import PageBackButton from "../../components/ui/PageBackButton";
import "./PrivacyPolicy.css";

const PrivacyPolicy = () => {
  return (
    <section className="pro-page privacy-page">
      <PageBackButton fallbackPath="/" label="Back" />

      <div className="pro-hero section-reveal">
        <span className="pro-badge">
          <ShieldCheck size={14} />
          Privacy Policy
        </span>
        <h1>Your Data, Explained Clearly</h1>
        <p>
          This policy explains what information Litloom collects, why it is collected, and how it is protected.
          We focus on transparency, minimal collection, and practical security.
        </p>
      </div>

      <div className="privacy-meta section-reveal delay-1">
        <span>
          <Clock3 size={14} />
          Last updated: February 17, 2026
        </span>
      </div>

      <div className="privacy-grid">
        <article className="pro-panel section-reveal delay-1">
          <h2>1. Information We Collect</h2>
          <ul className="pro-feature-list">
            <li className="pro-feature-item">
              <Mail size={17} />
              <div>
                <strong>Subscription data</strong>
                <span>Name and email when you subscribe to newsletters.</span>
              </div>
            </li>
            <li className="pro-feature-item">
              <Database size={17} />
              <div>
                <strong>Contact form data</strong>
                <span>Name, email, and message when you contact Litloom.</span>
              </div>
            </li>
            <li className="pro-feature-item">
              <Lock size={17} />
              <div>
                <strong>Comment submissions</strong>
                <span>Comment details and moderation metadata for safety review.</span>
              </div>
            </li>
          </ul>
        </article>

        <article className="pro-panel section-reveal delay-2">
          <h2>2. How We Use Information</h2>
          <p className="pro-panel-lead">
            We use collected information only for Litloom operations:
          </p>
          <div className="privacy-list-block">
            <p>To deliver newsletters and updates to subscribers.</p>
            <p>To respond to contact messages and support requests.</p>
            <p>To moderate comments and improve platform reliability.</p>
            <p>To send necessary service notices related to your requests.</p>
          </div>
        </article>

        <article className="pro-panel section-reveal delay-2">
          <h2>3. Data Protection</h2>
          <p className="pro-panel-lead">
            Data is stored in the Litloom backend (Strapi) with controlled admin access. We use reasonable
            technical and organizational safeguards to reduce unauthorized access risks.
          </p>
          <div className="pro-soft-grid">
            <div className="pro-soft-card">
              <strong>Access control</strong>
              <span>Only authorized admins can review stored submissions.</span>
            </div>
            <div className="pro-soft-card">
              <strong>Operational logging</strong>
              <span>Delivery and system events are tracked for troubleshooting.</span>
            </div>
            <div className="pro-soft-card">
              <strong>Minimal scope</strong>
              <span>We avoid collecting data that is not required for service.</span>
            </div>
          </div>
        </article>

        <article className="pro-panel section-reveal delay-3">
          <h2>4. Newsletter & Emails</h2>
          <p className="pro-panel-lead">
            By subscribing, you agree to receive Litloom newsletters. If you no longer want updates, contact us
            using the Contact page and request removal of your subscription record.
          </p>
        </article>

        <article className="pro-panel section-reveal delay-3">
          <h2>5. Retention & Deletion</h2>
          <p className="pro-panel-lead">
            We retain information as long as needed for communication, moderation, and operational records.
            You may request deletion of subscription/contact records by emailing support through Litloom contact channels.
          </p>
        </article>

        <article className="pro-panel section-reveal delay-3">
          <h2>6. Contact For Privacy Requests</h2>
          <p className="pro-panel-lead">
            For access, correction, or deletion requests related to your data, use the Contact page and include:
          </p>
          <div className="privacy-list-block">
            <p>Your full name.</p>
            <p>Email associated with your request.</p>
            <p>Clear description of the action you want.</p>
          </div>
        </article>
      </div>
    </section>
  );
};

export default PrivacyPolicy;
