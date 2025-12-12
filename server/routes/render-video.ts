/**
 * POST /api/render-video
 *
 * Renders a video that EXACTLY matches the frontend Canvas preview.
 * Accepts a JSON payload describing the full visual layout and animations.
 * Returns an MP4 video stream.
 */

import { Router, Request, Response } from "express";
import { spawn } from "child_process";
import {
  createReadStream,
  unlinkSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  statSync,
} from "fs";
import path from "path";
import os from "os";
import { ensureFFmpeg } from "../utils/ffmpeg";

const router = Router();

// ============================================
// TYPE DEFINITIONS
// ============================================

interface GradientOverlay {
  enabled: boolean;
  direction: "top-bottom" | "bottom-top" | "left-right" | "right-left";
  startColor: string; // rgba(r,g,b,a)
  endColor: string;
}

interface Animation {
  type: "subtle-zoom" | "none";
  zoomStart?: number;
  zoomEnd?: number;
  fadeText?: boolean;
  fadeDuration?: number;
}

interface RenderPayload {
  quote: string;
  wrappedText: string;
  canvasWidth: number;
  canvasHeight: number;
  fontFamily: string;
  fontSize: number;
  fontColor: string; // rgba(r,g,b,a)
  textAlign: "left" | "center" | "right";
  textBox: {
    x: number;
    y: number;
  };
  backgroundImageUrl: string;
  backgroundBrightness?: number; // 0.0 - 1.0, default 1.0
  backgroundBlur?: number; // px, default 0
  gradientOverlay?: GradientOverlay;
  animation?: Animation;
  duration?: number; // seconds, default 5
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert RGBA string "rgba(r,g,b,a)" to FFmpeg hex color "RRGGBB@A"
 */
function rgbaToFFmpeg(rgba: string): { hex: string; alpha: number } {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) {
    return { hex: "FFFFFF", alpha: 1.0 };
  }
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const a = match[4] !== undefined ? parseFloat(match[4]) : 1.0;

  const hex = [r, g, b]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  return { hex, alpha: a };
}

/**
 * Sanitize text for FFmpeg drawtext filter.
 * Escapes: single quotes, backslashes, colons, percent signs.
 */
function sanitizeTextForFFmpeg(text: string): string {
  return text
    .replace(/\\/g, "\\\\\\\\") // Backslash
    .replace(/'/g, "'\\''") // Single quote
    .replace(/:/g, "\\:") // Colon
    .replace(/%/g, "\\%") // Percent
    .replace(/\n/g, "\\n"); // Newline (FFmpeg uses \n)
}

/**
 * Get font file path from font family name.
 * Falls back to system fonts if not found.
 */
function getFontPath(fontFamily: string): string {
  const fontDir = path.join(process.cwd(), "public", "fonts");

  // Map of font families to file names
  const fontMap: Record<string, string> = {
    Inter: "Inter-Regular.ttf",
    "Inter Bold": "Inter-Bold.ttf",
    Syne: "Syne-Bold.ttf",
    Manrope: "Manrope-Regular.ttf",
    "Playfair Display": "PlayfairDisplay-Regular.ttf",
    Montserrat: "Montserrat-Regular.ttf",
    Roboto: "Roboto-Regular.ttf",
  };

  const fileName = fontMap[fontFamily];
  if (fileName) {
    const fontPath = path.join(fontDir, fileName);
    if (existsSync(fontPath)) {
      return fontPath;
    }
  }

  // Return empty string to use system font fallback
  return "";
}

/**
 * Get system font name for FFmpeg (Windows).
 */
function getSystemFontName(fontFamily: string): string {
  const mapping: Record<string, string> = {
    Inter: "Segoe UI",
    Syne: "Arial",
    Manrope: "Segoe UI",
    "Playfair Display": "Times New Roman",
    Montserrat: "Verdana",
    Roboto: "Arial",
  };
  return mapping[fontFamily] || "Arial";
}

/**
 * Build font argument for FFmpeg drawtext.
 */
function buildFontArg(fontFamily: string): string {
  const fontPath = getFontPath(fontFamily);
  if (fontPath) {
    // Use font file
    return `:fontfile='${fontPath.replace(/\\/g, "/")}'`;
  } else {
    // Use system font
    return `:font='${getSystemFontName(fontFamily)}'`;
  }
}

/**
 * Calculate text X position based on alignment.
 * For center: (w-text_w)/2
 * For left: specified x
 * For right: w - text_w - (w - x)
 */
function getTextXExpr(
  textAlign: "left" | "center" | "right",
  x: number,
  canvasWidth: number
): string {
  switch (textAlign) {
    case "center":
      return "(w-text_w)/2";
    case "left":
      return String(x);
    case "right":
      return `w-text_w-${canvasWidth - x}`;
    default:
      return "(w-text_w)/2";
  }
}

// ============================================
// FFMPEG FILTER BUILDERS
// ============================================

/**
 * Build the complete FFmpeg filter_complex string.
 * Returns both the filter string and the final output label.
 */
function buildFilterComplex(
  payload: RenderPayload,
  duration: number
): { filterString: string; outputLabel: string } {
  const {
    canvasWidth,
    canvasHeight,
    fontSize,
    fontColor,
    fontFamily,
    textAlign,
    textBox,
    wrappedText,
    backgroundBrightness = 1.0,
    backgroundBlur = 0,
    gradientOverlay,
    animation,
  } = payload;

  const fps = 30;
  const totalFrames = duration * fps;
  const { hex: textHex, alpha: textAlpha } = rgbaToFFmpeg(fontColor);
  const sanitizedText = sanitizeTextForFFmpeg(wrappedText);
  const fontArg = buildFontArg(fontFamily);
  const textX = getTextXExpr(textAlign, textBox.x, canvasWidth);
  const textY = String(textBox.y);

  const filters: string[] = [];
  let stepNum = 0;
  const getLabel = () => `[s${stepNum++}]`;

  let currentInput = "[0:v]";
  let currentOutput = getLabel();

  // ----------------------------------------
  // STEP 1: Scale/Crop to canvas resolution
  // ----------------------------------------
  filters.push(
    `${currentInput}scale=${canvasWidth}:${canvasHeight}:force_original_aspect_ratio=increase,crop=${canvasWidth}:${canvasHeight}${currentOutput}`
  );
  currentInput = currentOutput;
  currentOutput = getLabel();

  // ----------------------------------------
  // STEP 2: Animation - Subtle Zoom (Ken Burns)
  // ----------------------------------------
  if (animation?.type === "subtle-zoom") {
    const zoomStart = animation.zoomStart ?? 1.05;
    const zoomEnd = animation.zoomEnd ?? 1.0;
    const zoomDelta = (zoomStart - zoomEnd) / totalFrames;

    filters.push(
      `${currentInput}zoompan=z='${zoomStart}-on*${zoomDelta}':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${canvasWidth}x${canvasHeight}:fps=${fps}${currentOutput}`
    );
    currentInput = currentOutput;
    currentOutput = getLabel();
  }

  // ----------------------------------------
  // STEP 3: Brightness adjustment
  // ----------------------------------------
  if (backgroundBrightness !== 1.0) {
    filters.push(
      `${currentInput}eq=brightness=${backgroundBrightness - 1}${currentOutput}`
    );
    currentInput = currentOutput;
    currentOutput = getLabel();
  }

  // ----------------------------------------
  // STEP 4: Blur (if specified)
  // ----------------------------------------
  if (backgroundBlur > 0) {
    const blurRadius = Math.max(1, Math.round(backgroundBlur / 2));
    filters.push(
      `${currentInput}boxblur=${blurRadius}:${blurRadius}${currentOutput}`
    );
    currentInput = currentOutput;
    currentOutput = getLabel();
  }

  // ----------------------------------------
  // STEP 5: Gradient Overlay (simplified as single dark overlay)
  // ----------------------------------------
  if (gradientOverlay?.enabled) {
    const { startColor } = gradientOverlay;
    const { hex: startHex, alpha: startAlpha } = rgbaToFFmpeg(startColor);

    // Simple dark overlay instead of complex gradient
    filters.push(
      `${currentInput}drawbox=x=0:y=0:w=iw:h=ih:color=0x${startHex}@${startAlpha}:t=fill${currentOutput}`
    );
    currentInput = currentOutput;
    currentOutput = getLabel();
  }

  // ----------------------------------------
  // STEP 6: Format conversion (required for H.264)
  // ----------------------------------------
  filters.push(`${currentInput}format=yuv420p${currentOutput}`);
  currentInput = currentOutput;
  currentOutput = getLabel();

  // ----------------------------------------
  // STEP 7: Draw Text with shadow
  // ----------------------------------------
  const drawtextFilter = `drawtext=text='${sanitizedText}'${fontArg}:fontsize=${fontSize}:fontcolor=0x${textHex}@${textAlpha}:x=${textX}:y=${textY}:line_spacing=${Math.round(
    fontSize * 0.3
  )}:shadowcolor=black@0.5:shadowx=2:shadowy=2`;

  filters.push(`${currentInput}${drawtextFilter}${currentOutput}`);
  currentInput = currentOutput;
  currentOutput = getLabel();

  // ----------------------------------------
  // STEP 8: Text Fade-in Animation (optional)
  // ----------------------------------------
  if (animation?.fadeText) {
    const fadeDuration = animation.fadeDuration ?? 0.8;
    filters.push(
      `${currentInput}fade=t=in:st=0:d=${fadeDuration}${currentOutput}`
    );
    currentInput = currentOutput;
    // Don't generate next output as this is final
  }

  // The final output is currentInput (the last label we wrote to)
  return {
    filterString: filters.join(";"),
    outputLabel: currentInput,
  };
}

/**
 * Download image from URL and save to temp file.
 */
async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(outputPath, buffer);
}

/**
 * Execute FFmpeg with given arguments.
 */
async function executeFFmpeg(args: string[]): Promise<void> {
  const ffmpegPath = await ensureFFmpeg();

  return new Promise((resolve, reject) => {
    console.log("[FFmpeg] Executing:", ffmpegPath, args.join(" "));

    const process = spawn(ffmpegPath, args, { shell: false });

    let stderr = "";

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error("[FFmpeg] Error output:", stderr);
        reject(
          new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`)
        );
      }
    });

    process.on("error", (err) => {
      reject(new Error(`FFmpeg failed to start: ${err.message}`));
    });

    // Timeout after 120 seconds for longer renders
    setTimeout(() => {
      process.kill("SIGKILL");
      reject(new Error("FFmpeg timeout (120s)"));
    }, 120000);
  });
}

/**
 * Clean up temporary files.
 */
function cleanup(files: string[]): void {
  for (const file of files) {
    try {
      if (existsSync(file)) {
        unlinkSync(file);
        console.log("[Cleanup] Deleted:", file);
      }
    } catch (err) {
      console.error("[Cleanup] Failed to delete:", file, err);
    }
  }
}

// ============================================
// MAIN ENDPOINT
// ============================================

/**
 * POST /api/render-video
 *
 * Accepts Canvas JSON payload and returns MP4 video stream.
 */
router.post("/", async (req: Request, res: Response) => {
  const tempFiles: string[] = [];
  const tempDir = path.join(os.tmpdir(), "vibequote-render");

  try {
    // Ensure temp directory exists
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Parse and validate payload
    const payload: RenderPayload = req.body;

    if (!payload.backgroundImageUrl) {
      return res.status(400).json({
        error: "Missing backgroundImageUrl",
        message: "Please provide a background image URL",
      });
    }

    if (!payload.wrappedText && !payload.quote) {
      return res.status(400).json({
        error: "Missing text content",
        message: "Please provide quote or wrappedText",
      });
    }

    // Apply defaults
    const duration = payload.duration ?? 5;
    const canvasWidth = payload.canvasWidth || 1080;
    const canvasHeight = payload.canvasHeight || 1920;
    const text = payload.wrappedText || payload.quote;

    // Normalize payload
    const normalizedPayload: RenderPayload = {
      ...payload,
      wrappedText: text,
      canvasWidth,
      canvasHeight,
      fontFamily: payload.fontFamily || "Inter",
      fontSize: payload.fontSize || 64,
      fontColor: payload.fontColor || "rgba(255,255,255,1)",
      textAlign: payload.textAlign || "center",
      textBox: payload.textBox || { x: canvasWidth / 2, y: canvasHeight / 2 },
      backgroundBrightness: payload.backgroundBrightness ?? 1.0,
      backgroundBlur: payload.backgroundBlur ?? 0,
    };

    // Generate unique file names
    const timestamp = Date.now();
    const bgPath = path.join(tempDir, `bg_${timestamp}.jpg`);
    const outputPath = path.join(tempDir, `out_${timestamp}.mp4`);
    tempFiles.push(bgPath, outputPath);

    // Step 1: Download background image
    console.log("[Render] Downloading background image...");
    await downloadImage(payload.backgroundImageUrl, bgPath);
    console.log("[Render] Background saved to:", bgPath);

    // Step 2: Build filter complex
    const { filterString, outputLabel } = buildFilterComplex(
      normalizedPayload,
      duration
    );
    console.log("[Render] Filter complex:", filterString);
    console.log("[Render] Output label:", outputLabel);

    // Step 3: Build FFmpeg command
    const ffmpegArgs = [
      "-loop",
      "1",
      "-i",
      bgPath,
      "-filter_complex",
      filterString,
      "-map",
      outputLabel, // Use dynamically determined output label
      "-c:v",
      "libx264",
      "-t",
      String(duration),
      "-r",
      "30",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-preset",
      "fast",
      "-crf",
      "20",
      "-an", // No audio
      "-y",
      outputPath,
    ];

    // Step 4: Execute FFmpeg
    console.log("[Render] Starting FFmpeg...");
    await executeFFmpeg(ffmpegArgs);
    console.log("[Render] Video generated:", outputPath);

    // Step 5: Get video stats
    const stats = statSync(outputPath);

    // Step 6: Stream response
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Length", stats.size);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="vibequote-${timestamp}.mp4"`
    );
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const stream = createReadStream(outputPath);
    stream.pipe(res);

    stream.on("end", () => {
      cleanup(tempFiles);
    });

    stream.on("error", (err) => {
      console.error("[Stream] Error:", err);
      cleanup(tempFiles);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream video" });
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Render] Error:", message);

    cleanup(tempFiles);

    if (!res.headersSent) {
      return res.status(500).json({
        error: "Video rendering failed",
        message,
      });
    }
  }
});

export default router;
