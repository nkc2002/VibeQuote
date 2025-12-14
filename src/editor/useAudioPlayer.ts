import { useEffect, useRef, useCallback } from "react";
import { getTrackById } from "./music";

interface UseAudioPlayerOptions {
  trackId: string | null;
  volume: number;
  enabled: boolean;
  isPlaying: boolean;
}

/**
 * Hook to manage audio playback for music preview
 */
export function useAudioPlayer({
  trackId,
  volume,
  enabled,
  isPlaying,
}: UseAudioPlayerOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create/update audio element when track changes
  useEffect(() => {
    if (!trackId || !enabled) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const track = getTrackById(trackId);
    if (!track) return;

    // Create new audio element
    const audio = new Audio(track.url);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    // Auto-play if isPlaying
    if (isPlaying) {
      audio.play().catch(console.error);
    }

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [trackId, enabled]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying && enabled) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, enabled]);

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
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  return { play, pause, audioRef };
}
