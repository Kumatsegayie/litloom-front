import { useCallback, useRef } from "react";

const DEFAULT_THRESHOLD = 48;
const HORIZONTAL_LOCK = 16;

const useSwipeNavigation = ({
  enabled = true,
  onSwipeLeft,
  onSwipeRight,
  threshold = DEFAULT_THRESHOLD
} = {}) => {
  const startXRef = useRef(null);
  const startYRef = useRef(null);
  const trackingRef = useRef(false);

  const resetTracking = useCallback(() => {
    startXRef.current = null;
    startYRef.current = null;
    trackingRef.current = false;
  }, []);

  const onTouchStart = useCallback((event) => {
    if (!enabled || !event.touches || event.touches.length !== 1) {
      resetTracking();
      return;
    }

    const touch = event.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    trackingRef.current = true;
  }, [enabled, resetTracking]);

  const onTouchMove = useCallback((event) => {
    if (!enabled || !trackingRef.current || !event.touches || event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - (startXRef.current || 0);
    const deltaY = touch.clientY - (startYRef.current || 0);

    if (Math.abs(deltaX) > HORIZONTAL_LOCK && Math.abs(deltaX) > Math.abs(deltaY)) {
      event.preventDefault();
    }
  }, [enabled]);

  const onTouchEnd = useCallback((event) => {
    if (!enabled || !trackingRef.current) {
      resetTracking();
      return;
    }

    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch || startXRef.current === null || startYRef.current === null) {
      resetTracking();
      return;
    }

    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX >= threshold && absX > absY) {
      if (deltaX < 0) {
        if (typeof onSwipeLeft === "function") onSwipeLeft();
      } else if (typeof onSwipeRight === "function") {
        onSwipeRight();
      }
    }

    resetTracking();
  }, [enabled, onSwipeLeft, onSwipeRight, resetTracking, threshold]);

  return { onTouchStart, onTouchMove, onTouchEnd };
};

export default useSwipeNavigation;
