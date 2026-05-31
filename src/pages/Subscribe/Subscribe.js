import React, { useState } from "react";
import { BadgeCheck, BellRing, Clock3, MailCheck, ShieldCheck, Sparkles } from "lucide-react";
import { subscribeEmail } from "../../services/subscriptionsAPI";
import { useToast } from "../../components/toast/ToastProvider";
import "./Subscribe.css";

const Subscribe = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);

    try {
      const result = await subscribeEmail({ name, email });
      if (result.warning) {
        toast.warning(result.message || "Subscription saved, but welcome email could not be sent.");
      } else if (result.alreadySubscribed) {
        toast.info(result.message || "This email is already subscribed.");
      } else {
        toast.success(result.message || "Subscription successful.");
      }
      setName("");
      setEmail("");
    } catch (error) {
      toast.error(error?.message || "Failed to subscribe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="pro-page subscribe-page-pro">
      <div className="pro-hero section-reveal">
        <span className="pro-badge">
          <BellRing size={14} />
          Litloom Newsletter
        </span>
        <h1>Stay In The Loop Without The Noise</h1>
        <p>
          Subscribe once and receive curated updates on new articles, books, podcasts, and artwork highlights.
          No clutter, no spam bursts, and no duplicate subscriptions.
        </p>
      </div>

      <div className="pro-grid">
        <article className="pro-panel section-reveal delay-1">
          <h2>Why subscribe?</h2>
          <p className="pro-panel-lead">
            Your inbox gets carefully selected updates from Litloom. We prioritize quality releases over volume.
          </p>

          <ul className="pro-feature-list">
            <li className="pro-feature-item">
              <MailCheck size={17} />
              <div>
                <strong>Editorial picks only</strong>
                <span>Highlights from top stories and creator uploads.</span>
              </div>
            </li>
            <li className="pro-feature-item">
              <ShieldCheck size={17} />
              <div>
                <strong>Protected subscriber list</strong>
                <span>Your details stay in Litloom and are never sold.</span>
              </div>
            </li>
            <li className="pro-feature-item">
              <Sparkles size={17} />
              <div>
                <strong>Clean design, useful updates</strong>
                <span>Readable newsletters with links to what matters.</span>
              </div>
            </li>
          </ul>

          <div className="pro-soft-grid">
            <div className="pro-soft-card">
              <strong>Weekly rhythm</strong>
              <span>Low-frequency, high-signal updates.</span>
            </div>
            <div className="pro-soft-card">
              <strong>Double-check safe</strong>
              <span>No duplicate subscriptions for one email.</span>
            </div>
            <div className="pro-soft-card">
              <strong>Human support</strong>
              <span>Need unsubscribe help? Contact us anytime.</span>
            </div>
          </div>
        </article>

        <article className="pro-panel section-reveal delay-2">
          <h2>Join now</h2>
          <p className="pro-panel-lead">Enter your name and email. Activation happens instantly.</p>

          <form className="pro-form subscribe-form-pro" onSubmit={handleSubmit}>
            <label htmlFor="subscribe-name">Name</label>
            <input
              id="subscribe-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your full name"
              maxLength={120}
              required
              disabled={submitting}
            />

            <label htmlFor="subscribe-email">Email</label>
            <input
              id="subscribe-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              disabled={submitting}
            />

            <button type="submit" className="pro-submit" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="pro-inline-spinner" aria-hidden="true" />
                  Subscribing...
                </>
              ) : (
                <>
                  <BadgeCheck size={16} />
                  Subscribe
                </>
              )}
            </button>
          </form>

          <p className="subscribe-note-pro">
            <Clock3 size={14} />
            Welcome email is sent right after successful subscription.
          </p>
        </article>
      </div>
    </section>
  );
};

export default Subscribe;
