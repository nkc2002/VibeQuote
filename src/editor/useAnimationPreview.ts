import { useCallback, useRef, useEffect } from "react";
import { AnimationType, getAnimationDuration } from "./animation";

interface UseAnimationPreviewOptions {
  animationType: AnimationType;
  videoDuration: number; // in seconds
  onProgressUpdate: (progress: number) => void;
  onComplete: () => void;
}

/**
 * Hook to drive animation preview with requestAnimationFrame
 *
 * Usage:
 * const { start, stop, isPlaying } = useAnimationPreview({
 *   animationType: "fadeIn",
 *   videoDuration: 6,
 *   onProgressUpdate: (progress) => dispatch({ type: "SET_ANIMATION_PROGRESS", payload: progress }),
 *   onComplete: () => console.log("Animation finished"),
 * });
 */
export function useAnimationPreview({
  animationType,
  videoDuration,
  onProgressUpdate,
  onComplete,
}: UseAnimationPreviewOptions) {
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  // Calculate animation duration in milliseconds
  const animDurationPercent = getAnimationDuration(animationType);
  const animDurationMs = animDurationPercent * videoDuration * 1000;

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;
    isPlayingRef.current = false;
    // Reset to final state
    onProgressUpdate(1);
  }, [onProgressUpdate]);

  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress =
        animDurationMs > 0 ? Math.min(elapsed / animDurationMs, 1) : 1;

      onProgressUpdate(progress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        isPlayingRef.current = false;
        animationFrameRef.current = null;
        startTimeRef.current = null;
        onComplete();
      }
    },
    [animDurationMs, onProgressUpdate, onComplete]
  );

  const start = useCallback(() => {
    // Stop any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Reset state
    startTimeRef.current = null;
    isPlayingRef.current = true;

    // Handle "none" animation
    if (animationType === "none") {
      onProgressUpdate(1);
      onComplete();
      return;
    }

    // Start animation
    onProgressUpdate(0);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [animationType, animate, onProgressUpdate, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    start,
    stop,
    isPlaying: isPlayingRef.current,
  };
}

/**
 * Simple hook to preview animation once
 */
export function usePreviewAnimation(
  animationType: AnimationType,
  onProgress: (progress: number) => void
) {
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const preview = useCallback(() => {
    // Cancel any existing animation
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    // Handle "none" - immediately show final
    if (animationType === "none") {
      onProgress(1);
      return;
    }

    const duration = getAnimationDuration(animationType) * 6000; // 6 second video duration as default

    startRef.current = null;

    const animate = (timestamp: number) => {
      if (!startRef.current) {
        startRef.current = timestamp;
      }

      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      onProgress(progress);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        frameRef.current = null;
        startRef.current = null;
      }
    };

    onProgress(0);
    frameRef.current = requestAnimationFrame(animate);
  }, [animationType, onProgress]);

  const reset = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    startRef.current = null;
    onProgress(1); // Reset to final state
  }, [onProgress]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return { preview, reset };
}
