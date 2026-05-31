import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, XCircle, X } from "lucide-react";
import "./ToastProvider.css";

const ToastContext = createContext(null);

const ICON_BY_TYPE = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
  error: XCircle
};

const DEFAULT_DURATION = 3400;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((message, options = {}) => {
    if (!message) return null;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const next = {
      id,
      type: options.type || "info",
      message,
      title: options.title || "",
      duration: Number.isFinite(options.duration) ? options.duration : DEFAULT_DURATION
    };

    setToasts((previous) => [...previous, next]);

    if (next.duration > 0) {
      window.setTimeout(() => {
        dismiss(id);
      }, next.duration);
    }

    return id;
  }, [dismiss]);

  const api = useMemo(() => ({
    showToast,
    dismiss,
    success: (message, options = {}) => showToast(message, { ...options, type: "success" }),
    info: (message, options = {}) => showToast(message, { ...options, type: "info" }),
    warning: (message, options = {}) => showToast(message, { ...options, type: "warning" }),
    error: (message, options = {}) => showToast(message, { ...options, type: "error" })
  }), [dismiss, showToast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="lit-toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => {
          const Icon = ICON_BY_TYPE[toast.type] || ICON_BY_TYPE.info;
          return (
            <div key={toast.id} className={`lit-toast lit-toast-${toast.type}`} role="status">
              <div className="lit-toast-icon-wrap" aria-hidden="true">
                <Icon size={18} />
              </div>
              <div className="lit-toast-body">
                {toast.title ? <p className="lit-toast-title">{toast.title}</p> : null}
                <p className="lit-toast-message">{toast.message}</p>
              </div>
              <button
                type="button"
                className="lit-toast-close"
                aria-label="Dismiss notification"
                onClick={() => dismiss(toast.id)}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

export default ToastProvider;
