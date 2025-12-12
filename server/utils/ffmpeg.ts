/**
 * FFmpeg binary manager
 * Uses ffmpeg-static to guarantee binary availability
 */
import ffmpegStatic from "ffmpeg-static";

// Cast to string since ffmpeg-static can return string | null
const ffmpegPath: string | null = ffmpegStatic as unknown as string | null;

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
export const FFMPEG_PATH: string = ffmpegPath || "ffmpeg";
export const FFMPEG_DIR = ""; // Not used with static
