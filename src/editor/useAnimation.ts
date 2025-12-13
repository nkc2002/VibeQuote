/**
 * useAnimation Hook
 *
 * React hook for managing animation playback in the Canvas editor.
 * Provides time-based animation control with requestAnimationFrame.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  AnimationConfig,
  AnimationState,
  DEFAULT_ANIMATION_CONFIG,
  getAnimationState,
  DurationOption,
  durationToMs,
} from "./animation";

export interface UseAnimationReturn {
  // State
  currentTime: number; // 0-1
  isPlaying: boolean;
  isPreviewing: boolean;

  // Animation states
  backgroundState: AnimationState;
  textState: AnimationState;

  // Config
  config: AnimationConfig;
  setDuration: (seconds: DurationOption) => void;

  // Controls
  play: () => void;
  pause: () => void;
  reset: () => void;
  seek: (time: number) => void;
  togglePreview: () => void;
}

export function useAnimation(
  initialConfig: Partial<AnimationConfig> = {}
): UseAnimationReturn {
  const config = useRef<AnimationConfig>({
    ...DEFAULT_ANIMATION_CONFIG,
    ...initialConfig,
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const startTimestampRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Animation loop
  const animate = useCallback(
    (timestamp: number) => {
      if (startTimestampRef.current === null) {
        startTimestampRef.current =
          timestamp - pausedTimeRef.current * config.current.durationMs;
      }

      const elapsed = timestamp - startTimestampRef.current;
      const progress = Math.min(elapsed / config.current.durationMs, 1);

      setCurrentTime(progress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - loop if previewing
        if (isPreviewing) {
          startTimestampRef.current = null;
          pausedTimeRef.current = 0;
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setIsPlaying(false);
        }
      }
    },
    [isPreviewing]
  );

  // Play animation
  const play = useCallback(() => {
    if (isPlaying) return;
    setIsPlaying(true);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying, animate]);

  // Pause animation
  const pause = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    pausedTimeRef.current = currentTime;
  }, [currentTime]);

  // Reset animation
  const reset = useCallback(() => {
    pause();
    setCurrentTime(0);
    startTimestampRef.current = null;
    pausedTimeRef.current = 0;
  }, [pause]);

  // Seek to specific time
  const seek = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(1, time));
    setCurrentTime(clampedTime);
    pausedTimeRef.current = clampedTime;
    startTimestampRef.current = null;
  }, []);

  // Toggle preview mode (auto-loop)
  const togglePreview = useCallback(() => {
    if (isPreviewing) {
      setIsPreviewing(false);
      pause();
      reset();
    } else {
      setIsPreviewing(true);
      reset();
      play();
    }
  }, [isPreviewing, pause, reset, play]);

  // Set duration
  const setDuration = useCallback(
    (seconds: DurationOption) => {
      config.current.durationMs = durationToMs(seconds);
      reset();
    },
    [reset]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Calculate animation states
  const backgroundState = getAnimationState(
    config.current.backgroundAnimation,
    currentTime
  );
  const textState = getAnimationState(
    config.current.textAnimation,
    currentTime
  );

  return {
    currentTime,
    isPlaying,
    isPreviewing,
    backgroundState,
    textState,
    config: config.current,
    setDuration,
    play,
    pause,
    reset,
    seek,
    togglePreview,
  };
}
