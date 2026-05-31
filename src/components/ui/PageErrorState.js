import React from "react";
import { AlertTriangle } from "lucide-react";
import "./PageStates.css";

const PageErrorState = ({
  title = "Something went wrong",
  message = "We could not load this page right now.",
  retryLabel = "Refresh",
  backLabel = "Go back",
  onRetry,
  onBack
}) => {
  return (
    <section className="page-error">
      <div className="page-error-card">
        <div className="page-error-head">
          <span className="page-error-icon">
            <AlertTriangle size={18} />
          </span>
          <h2 className="page-error-title">{title}</h2>
        </div>
        <p className="page-error-message">{message}</p>
        <div className="page-error-actions">
          {onRetry && (
            <button className="page-error-btn primary" onClick={onRetry} type="button">
              {retryLabel}
            </button>
          )}
          {onBack && (
            <button className="page-error-btn secondary" onClick={onBack} type="button">
              {backLabel}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default PageErrorState;
