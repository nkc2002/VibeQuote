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
  // Ambient / Chill
  {
    id: "peaceful-piano",
    name: "Peaceful Piano",
    artist: "VibeQuote Studio",
    duration: 204, // ~3:24
    genre: "ambient",
    url: "/music/peaceful-piano.mp3",
  },
  {
    id: "soft-piano",
    name: "Soft Piano",
    artist: "VibeQuote Studio",
    duration: 165, // ~2:45
    genre: "ambient",
    url: "/music/soft-piano.mp3",
  },
  {
    id: "soft-music",
    name: "Soft Music",
    artist: "VibeQuote Studio",
    duration: 210, // ~3:30
    genre: "chill",
    url: "/music/soft-music.mp3",
  },

  // Emotional
  {
    id: "emotional",
    name: "Emotional",
    artist: "VibeQuote Studio",
    duration: 136, // ~2:16
    genre: "emotional",
    url: "/music/emotional.mp3",
  },

  // Cinematic
  {
    id: "cinematic-documentary",
    name: "Cinematic Documentary",
    artist: "VibeQuote Studio",
    duration: 175, // ~2:55
    genre: "cinematic",
    url: "/music/cinematic-documentary.mp3",
  },

  // Upbeat
  {
    id: "minimal-technology",
    name: "Minimal Technology",
    artist: "VibeQuote Studio",
    duration: 159, // ~2:39
    genre: "upbeat",
    url: "/music/minimal-technology.mp3",
  },
  {
    id: "christmas",
    name: "Christmas",
    artist: "VibeQuote Studio",
    duration: 113, // ~1:53
    genre: "upbeat",
    url: "/music/christmas.mp3",
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
