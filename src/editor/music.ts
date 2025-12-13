/**
 * Music System for Editor
 *
 * Predefined royalty-free music tracks for video background.
 * Preview only - no export logic.
 */

// ============================================================
// Music Types
// ============================================================

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: number; // seconds
  genre: "ambient" | "upbeat" | "emotional" | "cinematic" | "chill";
  // Using free music from various royalty-free sources
  // These are placeholder URLs - replace with actual CDN URLs
  url: string;
  previewUrl?: string;
}

export interface MusicState {
  enabled: boolean;
  selectedTrackId: string | null;
  volume: number; // 0-1
  isPlaying: boolean;
}

// ============================================================
// Predefined Music Tracks
// ============================================================

export const MUSIC_TRACKS: MusicTrack[] = [
  // Ambient
  {
    id: "ambient-1",
    name: "Peaceful Morning",
    artist: "VibeQuote Studio",
    duration: 180,
    genre: "ambient",
    url: "/music/peaceful-morning.mp3",
  },
  {
    id: "ambient-2",
    name: "Soft Horizon",
    artist: "VibeQuote Studio",
    duration: 210,
    genre: "ambient",
    url: "/music/soft-horizon.mp3",
  },

  // Upbeat
  {
    id: "upbeat-1",
    name: "Happy Moments",
    artist: "VibeQuote Studio",
    duration: 150,
    genre: "upbeat",
    url: "/music/happy-moments.mp3",
  },
  {
    id: "upbeat-2",
    name: "Sunny Day",
    artist: "VibeQuote Studio",
    duration: 165,
    genre: "upbeat",
    url: "/music/sunny-day.mp3",
  },

  // Emotional
  {
    id: "emotional-1",
    name: "Deep Feelings",
    artist: "VibeQuote Studio",
    duration: 200,
    genre: "emotional",
    url: "/music/deep-feelings.mp3",
  },
  {
    id: "emotional-2",
    name: "Touching Heart",
    artist: "VibeQuote Studio",
    duration: 190,
    genre: "emotional",
    url: "/music/touching-heart.mp3",
  },

  // Cinematic
  {
    id: "cinematic-1",
    name: "Epic Journey",
    artist: "VibeQuote Studio",
    duration: 240,
    genre: "cinematic",
    url: "/music/epic-journey.mp3",
  },
  {
    id: "cinematic-2",
    name: "Dramatic Rise",
    artist: "VibeQuote Studio",
    duration: 220,
    genre: "cinematic",
    url: "/music/dramatic-rise.mp3",
  },

  // Chill
  {
    id: "chill-1",
    name: "Lo-Fi Dreams",
    artist: "VibeQuote Studio",
    duration: 175,
    genre: "chill",
    url: "/music/lofi-dreams.mp3",
  },
  {
    id: "chill-2",
    name: "Relaxing Vibes",
    artist: "VibeQuote Studio",
    duration: 185,
    genre: "chill",
    url: "/music/relaxing-vibes.mp3",
  },
];

// ============================================================
// Helper Functions
// ============================================================

export function getTrackById(id: string): MusicTrack | undefined {
  return MUSIC_TRACKS.find((track) => track.id === id);
}

export function getTracksByGenre(genre: MusicTrack["genre"]): MusicTrack[] {
  return MUSIC_TRACKS.filter((track) => track.genre === genre);
}

export function getAllGenres(): MusicTrack["genre"][] {
  return ["ambient", "upbeat", "emotional", "cinematic", "chill"];
}

export function getGenreLabel(genre: MusicTrack["genre"]): string {
  const labels: Record<MusicTrack["genre"], string> = {
    ambient: "Ambient",
    upbeat: "Upbeat",
    emotional: "Emotional",
    cinematic: "Cinematic",
    chill: "Chill",
  };
  return labels[genre];
}

export function getGenreIcon(genre: MusicTrack["genre"]): string {
  const icons: Record<MusicTrack["genre"], string> = {
    ambient: "🌙",
    upbeat: "🎵",
    emotional: "💫",
    cinematic: "🎬",
    chill: "☕",
  };
  return icons[genre];
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Default music state
export const DEFAULT_MUSIC_STATE: MusicState = {
  enabled: false,
  selectedTrackId: null,
  volume: 0.5,
  isPlaying: false,
};
