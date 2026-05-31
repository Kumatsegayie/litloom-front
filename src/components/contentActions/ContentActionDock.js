import React from "react";
import { ArrowLeft, BookOpen, Download, MessageCircle, Share2 } from "lucide-react";
import "./contentActions.css";

const ACTION_ICON = {
  back: ArrowLeft,
  read: BookOpen,
  download: Download,
  share: Share2,
  comment: MessageCircle,
};

const ACTION_LABEL = {
  back: "Back",
  read: "Read",
  download: "Download",
  share: "Share",
  comment: "Comment",
};

const ContentActionDock = ({ actions = [] }) => (
  <div className="content-action-dock" role="toolbar" aria-label="Content actions">
    {actions.map((action) => {
      const Icon = ACTION_ICON[action.key];
      if (!Icon) return null;
      const label = action.label || ACTION_LABEL[action.key] || action.key;
      return (
        <button
          key={action.key}
          type="button"
          className="content-action-btn"
          onClick={action.onClick}
          disabled={Boolean(action.disabled)}
          aria-label={label}
          data-label={label}
          title={label}
        >
          <Icon size={20} />
        </button>
      );
    })}
  </div>
);

export default ContentActionDock;
