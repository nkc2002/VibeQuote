import { useEffect, useRef, useCallback, useState } from "react";
import { getTrackById } from "./music";

interface UseAudioPlayerOptions {
  trackId: string | null;
  volume: number;
  enabled: boolean;
  isPlaying: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

interface UseAudioPlayerReturn {
  play: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  currentTime: number;
  duration: number;
  isReady: boolean;
}

/**
 * Hook to manage audio playback for music preview
 * - No looping by default
 * - Responds to isPlaying prop for play/pause
 * - Volume updates in real-time
 */
export function useAudioPlayer({
  trackId,
  volume,
  enabled,
  isPlaying,
  onPlayStateChange,
}: UseAudioPlayerOptions): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const prevTrackIdRef = useRef<string | null>(null);

  // Create audio element when track changes
  useEffect(() => {
    // Only recreate audio if track actually changed
    if (prevTrackIdRef.current === trackId && audioRef.current) {
      return;
    }

    // Cleanup previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    setIsReady(false);
    setCurrentTime(0);
    setDuration(0);
    prevTrackIdRef.current = trackId;

    if (!trackId || !enabled) {
      return;
    }

    const track = getTrackById(trackId);
    if (!track) return;

    // Create new audio element
    const audio = new Audio(track.url);
    audio.loop = false;
    audio.volume = volume;
    audioRef.current = audio;

    // Event handlers
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsReady(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setCurrentTime(0);
      audio.currentTime = 0;
      onPlayStateChange?.(false);
    };

    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      setIsReady(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = "";
    };
  }, [trackId, enabled, volume, onPlayStateChange]);

  // Handle play/pause state changes - this is the key effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && enabled) {
      // Play
      audio.play().catch((err) => {
        console.error("Playback failed:", err);
        onPlayStateChange?.(false);
      });
    } else {
      // Pause
      audio.pause();
    }
  }, [isPlaying, enabled, onPlayStateChange]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const play = useCallback(() => {
    if (audioRef.current && enabled) {
      audioRef.current.play().catch(console.error);
      onPlayStateChange?.(true);
    }
  }, [enabled, onPlayStateChange]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      onPlayStateChange?.(false);
    }
  }, [onPlayStateChange]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      onPlayStateChange?.(false);
    }
  }, [onPlayStateChange]);

  const reset = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  }, []);

  return {
    play,
    pause,
    stop,
    reset,
    currentTime,
    duration,
    isReady,
  };
}
