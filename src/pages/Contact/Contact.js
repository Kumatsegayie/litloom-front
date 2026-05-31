import React, { useMemo, useState } from "react";
import {
  Clock3,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Send,
  ShieldCheck
} from "lucide-react";
import { submitContactMessage } from "../../services/contactAPI";
import { useToast } from "../../components/toast/ToastProvider";
import PageBackButton from "../../components/ui/PageBackButton";
import "./Contact.css";

const Contact = () => {
  const initialState = useMemo(() => ({ name: "", email: "", message: "" }), []);
  const [formData, setFormData] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await submitContactMessage(formData);
      toast.success(response?.message || "Message sent successfully.");
      setFormData(initialState);
    } catch (error) {
      toast.error(error?.message || "Failed to send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="pro-page contact-page-pro">
      <PageBackButton fallbackPath="/" label="Back" />

      <div className="pro-hero section-reveal">
        <span className="pro-badge">
          <MessageSquareText size={14} />
          Contact Litloom
        </span>
        <h1>Let’s Talk</h1>
        <p>
          Questions, feedback, and partnership requests are welcome. Send a message and our team
          will review it through Strapi and respond as quickly as possible.
        </p>
      </div>

      <div className="pro-grid contact-pro-grid">
        <aside className="pro-panel section-reveal delay-1">
          <h2>What happens after you send?</h2>
          <p className="pro-panel-lead">
            We store your message securely, notify admins, and send you a confirmation email.
          </p>

          <ul className="pro-feature-list">
            <li className="pro-feature-item">
              <Mail size={17} />
              <div>
                <strong>Email confirmation</strong>
                <span>You get success/failure feedback immediately.</span>
              </div>
            </li>
            <li className="pro-feature-item">
              <Clock3 size={17} />
              <div>
                <strong>Timely response</strong>
                <span>Most inquiries are reviewed within 24-48 hours.</span>
              </div>
            </li>
            <li className="pro-feature-item">
              <ShieldCheck size={17} />
              <div>
                <strong>Secure handling</strong>
                <span>Messages are kept in your Strapi backend for audit and follow-up.</span>
              </div>
            </li>
          </ul>

          <div className="pro-soft-grid">
            <div className="pro-soft-card">
              <strong>Scope</strong>
              <span>Support, content issues, and collaboration requests.</span>
            </div>
            <div className="pro-soft-card">
              <strong>Quality</strong>
              <span>Human-reviewed replies with clear next steps.</span>
            </div>
            <div className="pro-soft-card">
              <strong>Reliability</strong>
              <span>Notification flow is integrated with your mailing system.</span>
            </div>
          </div>

          <div className="contact-methods-pro">
            <h3>Other contact methods</h3>

            <a href="tel:+251911000000" className="contact-method-item">
              <Phone size={16} />
              <span>+251 911 000 000</span>
            </a>

            <a
              href="https://maps.google.com/?q=Meskel+Square,+Addis+Ababa,+Ethiopia"
              className="contact-method-item"
              target="_blank"
              rel="noreferrer"
            >
              <MapPin size={16} />
              <span>Meskel Square, Addis Ababa</span>
            </a>

            <a href="mailto:support@litloom.com" className="contact-method-item">
              <Mail size={16} />
              <span>support@litloom.com</span>
            </a>

            <a
              href="https://litloom.com"
              className="contact-method-item"
              target="_blank"
              rel="noreferrer"
            >
              <Globe size={16} />
              <span>litloom.com</span>
            </a>

            <div className="contact-social-grid">
              <a href="https://instagram.com/litloom" target="_blank" rel="noreferrer" aria-label="Litloom Instagram">
                <Instagram size={16} />
                <span>Instagram</span>
              </a>
              <a href="https://facebook.com/litloom" target="_blank" rel="noreferrer" aria-label="Litloom Facebook">
                <Facebook size={16} />
                <span>Facebook</span>
              </a>
              <a href="https://linkedin.com/company/litloom" target="_blank" rel="noreferrer" aria-label="Litloom LinkedIn">
                <Linkedin size={16} />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </aside>

        <article className="pro-panel section-reveal delay-2">
          <h2>Send your message</h2>
          <p className="pro-panel-lead">Please include enough details so we can help quickly.</p>

          <form className="pro-form contact-form-pro" onSubmit={handleSubmit}>
            <label htmlFor="contact-name">Name</label>
            <input
              id="contact-name"
              name="name"
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              maxLength={120}
              required
              disabled={isSubmitting}
            />

            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />

            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              name="message"
              rows="6"
              placeholder="Write your message..."
              value={formData.message}
              onChange={handleChange}
              maxLength={5000}
              required
              disabled={isSubmitting}
            />

            <button type="submit" className="pro-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="pro-inline-spinner" aria-hidden="true" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </article>
      </div>

      <div className="pro-panel section-reveal delay-3 contact-footnote-pro">
        <p>
          Professional communication matters. Please avoid sharing passwords or sensitive financial data in this form.
        </p>
      </div>
    </section>
  );
};

export default Contact;
