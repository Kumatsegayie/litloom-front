import React, { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import "./PullToRefresh.css";

const MAX_PULL_DISTANCE = 112;
const REFRESH_TRIGGER = 72;
const REFRESH_DELAY_MS = 180;

const isEditableTarget = (target) => {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true'], [data-no-pull-refresh='true']")
  );
};

const PullToRefresh = ({ enabled = false, topOffset = 68, onRefresh }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startYRef = useRef(0);
  const pullDistanceRef = useRef(0);
  const pullingRef = useRef(false);
  const refreshActionRef = useRef(onRefresh);

  useEffect(() => {
    refreshActionRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) {
      setPullDistance(0);
      setRefreshing(false);
      pullingRef.current = false;
      pullDistanceRef.current = 0;
      return undefined;
    }

    const resetPullState = () => {
      pullingRef.current = false;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    const startPull = (event) => {
      if (refreshing) return;
      if (!event.touches || event.touches.length !== 1) return;
      if (typeof window !== "undefined" && window.scrollY > 0) return;
      if (document.body.classList.contains("fullscreen-open")) return;
      if (document.body.style.overflow === "hidden") return;
      if (isEditableTarget(event.target)) return;

      pullingRef.current = true;
      startYRef.current = event.touches[0].clientY;
      pullDistanceRef.current = 0;
    };

    const movePull = (event) => {
      if (!pullingRef.current || refreshing) return;
      if (!event.touches || event.touches.length !== 1) return;

      const currentY = event.touches[0].clientY;
      const deltaY = currentY - startYRef.current;

      const resistedDistance = Math.min(
        MAX_PULL_DISTANCE,
        Math.max(0, deltaY * 0.58)
      );
      pullDistanceRef.current = resistedDistance;
      setPullDistance(resistedDistance);

      // keep page fixed during active pull gesture so force can be reduced smoothly
      event.preventDefault();
    };

    const finishPull = () => {
      if (!pullingRef.current || refreshing) {
        resetPullState();
        return;
      }

      const shouldRefresh = pullDistanceRef.current >= REFRESH_TRIGGER;
      resetPullState();

      if (!shouldRefresh) return;

      setRefreshing(true);

      window.setTimeout(async () => {
        try {
          if (typeof refreshActionRef.current === "function") {
            await Promise.resolve(refreshActionRef.current());
          } else if (typeof window !== "undefined") {
            window.location.reload();
          }
        } finally {
          setRefreshing(false);
        }
      }, REFRESH_DELAY_MS);
    };

    window.addEventListener("touchstart", startPull, { passive: true });
    window.addEventListener("touchmove", movePull, { passive: false });
    window.addEventListener("touchend", finishPull, { passive: true });
    window.addEventListener("touchcancel", finishPull, { passive: true });

    return () => {
      window.removeEventListener("touchstart", startPull);
      window.removeEventListener("touchmove", movePull);
      window.removeEventListener("touchend", finishPull);
      window.removeEventListener("touchcancel", finishPull);
    };
  }, [enabled, refreshing]);

  const progress = useMemo(() => {
    if (refreshing) return 1;
    return Math.min(1, pullDistance / REFRESH_TRIGGER);
  }, [pullDistance, refreshing]);

  const translateY = refreshing
    ? topOffset + 4
    : topOffset - 44 + pullDistance * 0.78;

  const shouldShow = refreshing || pullDistance > 0;
  const sweep = Math.max(0, Math.min(1, progress)) * 360;

  return (
    <div
      className={`pull-refresh-indicator${shouldShow ? " is-visible" : ""}${refreshing ? " is-refreshing" : ""}`}
      style={{ transform: `translate(-50%, ${translateY}px)` }}
      aria-hidden={!shouldShow}
    >
      <div
        className={`pull-refresh-ring${refreshing ? " is-refreshing" : ""}`}
        style={{
          background: `conic-gradient(var(--color-dark-green, #0f684f) ${sweep}deg, rgba(160, 174, 181, 0.24) ${sweep}deg)`
        }}
        role="status"
        aria-label={refreshing ? "Refreshing" : "Pull to refresh"}
      >
        <span className="pull-refresh-ring-center">
          <RefreshCw size={14} className="pull-refresh-icon" />
        </span>
      </div>
    </div>
  );
};

export default PullToRefresh;
