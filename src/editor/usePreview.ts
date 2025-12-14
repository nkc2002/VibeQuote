import { useCallback, useRef, useState, useEffect } from "react";
import { AnimationType, getAnimationDuration } from "./animation";
import { ParticleType } from "./particles";

interface UsePreviewOptions {
  // Video settings
  videoDuration: number; // in seconds

  // Animation
  textAnimation: AnimationType;
  onAnimationProgress: (progress: number) => void;

  // Effects
  particleEffect: ParticleType;

  // Music
  musicEnabled: boolean;
  selectedMusicId: string | null;
  musicVolume: number;
  onMusicPlayingChange: (playing: boolean) => void;
}

interface UsePreviewReturn {
  // State
  isPreviewRunning: boolean;
  previewProgress: number; // 0-1 overall progress
  currentTime: number; // in seconds

  // Actions
  startPreview: () => void;
  stopPreview: () => void;
}

/**
 * Hook to manage Preview playback behavior
 *
 * Preview is a TEMPORARY playback simulation:
 * - Runs text animations from start
 * - Runs particle effects
 * - Plays music (if enabled)
 * - Auto-stops at video duration
 * - Does NOT mutate editor state permanently
 */
export function usePreview({
  videoDuration,
  textAnimation,
  onAnimationProgress,
  particleEffect: _particleEffect,
  musicEnabled,
  selectedMusicId,
  musicVolume,
  onMusicPlayingChange,
}: UsePreviewOptions): UsePreviewReturn {
  const [isPreviewRunning, setIsPreviewRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Refs for animation frame timing
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Calculate animation duration in ms
  const animDurationPercent = getAnimationDuration(textAnimation);
  const animDurationMs = animDurationPercent * videoDuration * 1000;
  const videoDurationMs = videoDuration * 1000;

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;

    // Stop and cleanup audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
      audioRef.current = null;
    }

    // Reset animation to final state
    onAnimationProgress(1);

    // Stop music playing state
    onMusicPlayingChange(false);

    // Reset state
    setIsPreviewRunning(false);
    setCurrentTime(0);
  }, [onAnimationProgress, onMusicPlayingChange]);

  // Animation loop
  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const elapsedSeconds = elapsed / 1000;

      // Update current time
      setCurrentTime(elapsedSeconds);

      // Calculate animation progress (0-1 within animation duration)
      let animProgress = 1;
      if (animDurationMs > 0 && elapsed < animDurationMs) {
        animProgress = elapsed / animDurationMs;
      }
      onAnimationProgress(animProgress);

      // Check if preview should end
      if (elapsed >= videoDurationMs) {
        cleanup();
        return;
      }

      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [animDurationMs, videoDurationMs, onAnimationProgress, cleanup]
  );

  // Start preview
  const startPreview = useCallback(() => {
    if (isPreviewRunning) return;

    // Reset state
    startTimeRef.current = null;
    setCurrentTime(0);
    setIsPreviewRunning(true);

    // Reset animation to initial state
    onAnimationProgress(0);

    // Start music if enabled
    if (musicEnabled && selectedMusicId) {
      // Create audio element
      const audio = new Audio(`/music/${selectedMusicId}.mp3`);
      audio.loop = false;
      audio.volume = musicVolume;
      audioRef.current = audio;

      // Play music
      audio.play().catch((err) => {
        console.error("Failed to play preview music:", err);
      });

      onMusicPlayingChange(true);

      // Handle audio end
      audio.addEventListener("ended", () => {
        // Audio ended before video duration - that's fine
      });
    }

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [
    isPreviewRunning,
    musicEnabled,
    selectedMusicId,
    musicVolume,
    onAnimationProgress,
    onMusicPlayingChange,
    animate,
  ]);

  // Stop preview
  const stopPreview = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Update audio volume in real-time
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Calculate overall progress
  const previewProgress = videoDuration > 0 ? currentTime / videoDuration : 0;

  return {
    isPreviewRunning,
    previewProgress,
    currentTime,
    startPreview,
    stopPreview,
  };
}
