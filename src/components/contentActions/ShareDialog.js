import React, { useMemo, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon
} from "react-share";
import "./contentActions.css";

const ShareDialog = ({
  open,
  onClose,
  title = "Share",
  subtitle = "Copy link or share on social media",
  shareUrl,
  shareTitle
}) => {
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => {
    if (shareUrl) return shareUrl;
    if (typeof window !== "undefined") return window.location.href;
    return "";
  }, [shareUrl]);

  if (!open) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  return (
    <div className="content-overlay" onClick={onClose}>
      <div className="content-modal" onClick={(e) => e.stopPropagation()}>
        <div className="content-modal-head">
          <div>
            <h2 className="content-modal-title">{title}</h2>
            <p className="content-modal-subtitle">{subtitle}</p>
          </div>
          <button type="button" className="content-modal-close" onClick={onClose} aria-label="Close share dialog">
            <X size={18} />
          </button>
        </div>

        <div className="share-link-row">
          <input
            className="share-link-input"
            value={url}
            readOnly
            aria-label="Share URL"
          />
          <button type="button" className="share-copy-btn" onClick={handleCopyLink}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>

        <div className="share-channels">
          <FacebookShareButton url={url} quote={shareTitle} className="share-channel">
            <FacebookIcon size={34} round />
            <span className="share-channel-label">Facebook</span>
          </FacebookShareButton>
          <TwitterShareButton url={url} title={shareTitle} className="share-channel">
            <TwitterIcon size={34} round />
            <span className="share-channel-label">X / Twitter</span>
          </TwitterShareButton>
          <LinkedinShareButton url={url} title={shareTitle} className="share-channel">
            <LinkedinIcon size={34} round />
            <span className="share-channel-label">LinkedIn</span>
          </LinkedinShareButton>
          <WhatsappShareButton url={url} title={shareTitle} className="share-channel">
            <WhatsappIcon size={34} round />
            <span className="share-channel-label">WhatsApp</span>
          </WhatsappShareButton>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
