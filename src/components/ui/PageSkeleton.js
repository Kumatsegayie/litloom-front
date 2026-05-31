import React from "react";
import "./PageStates.css";

const ListSkeleton = ({ cardCount = 6 }) => (
  <div className="page-skeleton">
    <div className="page-skeleton-hero">
      <div className="page-skeleton-row title page-skeleton-shimmer" />
      <div className="page-skeleton-row subtitle page-skeleton-shimmer" />
    </div>
    <div className="page-skeleton-grid">
      {Array.from({ length: cardCount }).map((_, index) => (
        <article key={index} className="page-skeleton-card">
          <div className="page-skeleton-thumb page-skeleton-shimmer" />
          <div className="page-skeleton-body">
            <div className="page-skeleton-row mid page-skeleton-shimmer" />
            <div className="page-skeleton-row page-skeleton-shimmer" />
            <div className="page-skeleton-row short page-skeleton-shimmer" />
          </div>
        </article>
      ))}
    </div>
  </div>
);

const FeedSkeleton = ({
  cardCount = 6,
  feedClassName = "",
  cardClassName = "",
  thumbClassName = "",
  bodyClassName = "",
  rows = ["mid", "full", "short"],
  showThumb = true
}) => (
  <div className={`page-feed-skeleton ${feedClassName}`.trim()}>
    {Array.from({ length: cardCount }).map((_, index) => (
      <article key={index} className={`${cardClassName} page-feed-skeleton-card`.trim()}>
        {showThumb && (
          <div className={`${thumbClassName} page-feed-skeleton-thumb page-skeleton-shimmer`.trim()} />
        )}
        <div className={`${bodyClassName} page-feed-skeleton-body`.trim()}>
          {rows.map((row, rowIndex) => (
            <div
              key={`${index}-${rowIndex}`}
              className={`page-feed-skeleton-line is-${row} page-skeleton-shimmer`}
            />
          ))}
        </div>
      </article>
    ))}
  </div>
);

const DetailSkeleton = () => (
  <div className="page-skeleton page-skeleton-detail">
    <div className="page-skeleton-detail-media page-skeleton-shimmer" />
    <div className="page-skeleton-detail-body">
      <div className="page-skeleton-row title page-skeleton-shimmer" />
      <div className="page-skeleton-row mid page-skeleton-shimmer" />
      <div className="page-skeleton-row page-skeleton-shimmer" />
      <div className="page-skeleton-row page-skeleton-shimmer" />
      <div className="page-skeleton-row short page-skeleton-shimmer" />
    </div>
  </div>
);

const PageSkeleton = ({ variant = "list", cardCount = 6, ...props }) => {
  if (variant === "feed") return <FeedSkeleton cardCount={cardCount} {...props} />;
  if (variant === "detail") return <DetailSkeleton />;
  return <ListSkeleton cardCount={cardCount} />;
};

export default PageSkeleton;
