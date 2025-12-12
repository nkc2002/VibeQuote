/**
 * FFmpeg binary manager
 * Uses ffmpeg-static to guarantee binary availability
 */
import ffmpegPath from "ffmpeg-static";

/**
 * Ensure FFmpeg is available
 */
export const ensureFFmpeg = async (): Promise<string> => {
  if (ffmpegPath) {
    console.log("[FFmpeg] Using static binary at:", ffmpegPath);
    return ffmpegPath;
  }

  // Fallback to system ffmpeg if static not found (unlikely)
  console.warn(
    "[FFmpeg] ffmpeg-static not found, falling back to system 'ffmpeg'"
  );
  return "ffmpeg";
};

export const getFFmpegPath = (): string => {
  return ffmpegPath || "ffmpeg";
};

// For compatibility with previous imports
export const FFMPEG_PATH = ffmpegPath || "ffmpeg";
export const FFMPEG_DIR = ""; // Not used with static
