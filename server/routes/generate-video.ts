/**
 * POST /api/generate-video
 *
 * Generates a 5-second quote video with FFmpeg.
 * Accepts JSON: { unsplashId, wrappedText, template, styleParams }
 * Streams MP4 back to client or persists to S3.
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
import crypto from "crypto";

import Semaphore from "../utils/semaphore";
import {
  sanitizeTextForFFmpeg,
  validateUnsplashId,
  validateTemplate,
  validateStyleParams,
  generateJobHash,
  StyleParams,
} from "../utils/video-sanitize";
import { ensureFFmpeg } from "../utils/ffmpeg";
import {
  saveVideoMetadata,
  findVideoByHash,
  VideoDocument,
} from "../db/mongodb";
import { uploadToS3, generateS3Key, isS3Configured } from "../utils/s3";

const router = Router();

// Concurrency guard: max 2 concurrent video generation jobs
const semaphore = new Semaphore(
  parseInt(process.env.MAX_CONCURRENT_JOBS || "2", 10)
);

// Telemetry
interface TelemetryPoint {
  event: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

const telemetry: TelemetryPoint[] = [];

const logTelemetry = (
  event: string,
  metadata?: Record<string, unknown>,
  duration?: number
) => {
  const point: TelemetryPoint = {
    event,
    timestamp: Date.now(),
    duration,
    metadata,
  };
  telemetry.push(point);

  // Keep only last 1000 events
  if (telemetry.length > 1000) {
    telemetry.shift();
  }

  console.log(
    `[TELEMETRY] ${event}`,
    duration ? `${duration}ms` : "",
    metadata || ""
  );
};

// Font path - bundled in /public/fonts
const FONT_PATH = path.join(process.cwd(), "public", "fonts", "Syne-Bold.ttf");

// Temp directory for video processing
const TEMP_DIR = path.join(os.tmpdir(), "vibequote-videos");

/**
 * Fetch image from Unsplash with proper attribution
 */
async function fetchUnsplashImage(
  unsplashId: string
): Promise<{ imagePath: string; photographer: string }> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    throw new Error("UNSPLASH_ACCESS_KEY not configured");
  }

  // Step 1: Get photo metadata
  const photoUrl = `https://api.unsplash.com/photos/${unsplashId}`;
  const photoResponse = await fetch(photoUrl, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
  });

  if (!photoResponse.ok) {
    if (photoResponse.status === 404) {
      throw new Error("Image not found");
    }
    throw new Error(`Failed to fetch image metadata: ${photoResponse.status}`);
  }

  const photoData = await photoResponse.json();
  const downloadLocation = photoData.links?.download_location;
  const photographer = photoData.user?.name || "Unknown";

  // Step 2: Trigger download (per Unsplash API policy)
  if (downloadLocation) {
    await fetch(`${downloadLocation}?client_id=${accessKey}`);
  }

  // Step 3: Download resized image (1080p for better quality)
  const imageUrl = `${photoData.urls.raw}?w=1080&h=720&fit=crop&fm=jpg&q=90`;
  const imageResponse = await fetch(imageUrl);

  if (!imageResponse.ok) {
    throw new Error("Failed to download image");
  }

  // Save to temp file
  const imagePath = path.join(TEMP_DIR, `${unsplashId}.jpg`);
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  writeFileSync(imagePath, imageBuffer);

  return { imagePath, photographer };
}

// ... existing code ...

const sanitizeText = (text: string): string => {
  // Basic sanitation for FFmpeg
  return text.replace(/'/g, "'\\''").replace(/:/g, "\\:");
};

// Increased maxCharsPerLine from 30 default (was 25 in call) to 50 for better layout
function wrapText(text: string, maxCharsPerLine = 50): string {
  const words = text.split(" ");
  let lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    if (currentLine.length + 1 + words[i].length <= maxCharsPerLine) {
      currentLine += " " + words[i];
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);
  return lines.join("\n");
}

function getSystemFontName(fontFamily?: string): string {
  if (!fontFamily) return "Arial";
  // Map common web fonts to likely Windows system fonts
  if (fontFamily.includes("Syne")) return "Arial";
  if (fontFamily.includes("Manrope")) return "Segoe UI";
  if (fontFamily.includes("Inter")) return "Segoe UI";
  if (fontFamily.includes("Playfair")) return "Times New Roman";
  if (fontFamily.includes("Montserrat")) return "Verdana";
  if (fontFamily.includes("Roboto")) return "Arial";
  return "Arial";
}

/**
 * Build FFmpeg arguments for video generation
 */
function buildFFmpegArgs(
  imagePath: string,
  outputPath: string,
  text: string,
  template: string,
  styleParams: StyleParams,
  fontPath: string
): string[] {
  // Wrap text at 45 chars to approximate visual layout better
  const wrappedText = wrapText(text, 45);
  const sanitizedText = sanitizeTextForFFmpeg(wrappedText);
  // Increase font size slightly for 720p output
  const fontSize = (styleParams.fontSize || 32) * 1.2;
  const textColor = styleParams.textColor || "#FFFFFF";
  const overlayOpacity = styleParams.overlayOpacity || 0.4;
  const requestedFont = styleParams.fontFamily;

  // Calculate text position based on template
  let x = "(w-text_w)/2"; // center
  let y = "(h-text_h)/2"; // center

  switch (template) {
    case "bottom":
      y = "h-text_h-80";
      break;
    case "top-left":
      x = "60";
      y = "60";
      break;
    case "bottom-right":
      x = "w-text_w-60";
      y = "h-text_h-60";
      break;
  }

  // Convert hex color to FFmpeg format
  const colorHex = textColor.replace("#", "").toUpperCase();

  // Font logic: Try file -> Try system font -> Default
  let fontArg = "";
  if (existsSync(fontPath)) {
    fontArg = `:fontfile='${fontPath.replace(/\\/g, "/")}'`;
  } else {
    // Attempt to use system font
    const systemFont = getSystemFontName(requestedFont);
    fontArg = `:font='${systemFont}'`;
  }

  // FFmpeg filter complex:
  // 1. Zoompan (Ken Burns effect)
  // 2. Scale to 720p (1280x720)
  // 3. EQ filter: Boost saturation (1.3) and contrast (1.1) to fix "pale" look
  // 4. Drawbox for overlay
  // 5. Drawtext with shadow for better readability

  const zoomEffect = `zoompan=z='min(zoom+0.0015,1.5)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720`;
  const colorCorrection = `eq=saturation=1.3:contrast=1.1`;

  const filterComplex = [
    `[0:v]${zoomEffect},${colorCorrection},format=yuv420p[bg]`,
    `[bg]drawbox=x=0:y=0:w=iw:h=ih:color=black@${overlayOpacity}:t=fill[darkened]`,
    `[darkened]drawtext=text='${sanitizedText}'${fontArg}:fontsize=${fontSize}:fontcolor=0x${colorHex}:x=${x}:y=${y}:line_spacing=20:shadowcolor=black@0.5:shadowx=2:shadowy=2`,
  ].join(";");

  return [
    "-loop",
    "1", // Loop input image
    "-i",
    imagePath, // Input image
    "-c:v",
    "libx264", // H.264 codec
    "-t",
    "5", // Duration: 5 seconds
    "-pix_fmt",
    "yuv420p", // Pixel format for compatibility
    "-vf",
    filterComplex, // Video filters
    "-r",
    "25", // 25 fps
    "-movflags",
    "+faststart", // Enable streaming
    "-preset",
    "veryfast", // Better compression quality than ultrafast
    "-crf",
    "23", // Quality
    "-y", // Overwrite output
    outputPath,
  ];
}

/**
 * Execute FFmpeg and return when complete
 */
async function executeFFmpeg(args: string[]): Promise<void> {
  const ffmpegPath = await ensureFFmpeg();

  return new Promise((resolve, reject) => {
    console.log("[FFmpeg] Executing:", ffmpegPath, args.join(" "));

    const process = spawn(ffmpegPath, args);

    let stderr = "";

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error("[FFmpeg] Error output:", stderr);
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    process.on("error", (err) => {
      reject(new Error(`FFmpeg failed to start: ${err.message}`));
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      process.kill("SIGKILL");
      reject(new Error("FFmpeg timeout"));
    }, 60000);
  });
}

/**
 * Cleanup temp files
 */
function cleanup(files: string[]) {
  for (const file of files) {
    try {
      if (existsSync(file)) {
        unlinkSync(file);
      }
    } catch (err) {
      console.error("[Cleanup] Failed to delete:", file, err);
    }
  }
}

/**
 * POST /api/generate-video
 */
router.post("/", async (req: Request, res: Response) => {
  const startTime = Date.now();
  const tempFiles: string[] = [];
  let acquiredSemaphore = false;

  try {
    // Validate request body
    const {
      unsplashId: rawUnsplashId,
      wrappedText,
      template: rawTemplate,
      styleParams: rawStyleParams,
    } = req.body;

    // Input validation
    const unsplashId = validateUnsplashId(rawUnsplashId);
    if (!unsplashId) {
      return res.status(400).json({
        error: "Invalid unsplashId",
        message: "Please provide a valid Unsplash image ID",
      });
    }

    if (
      !wrappedText ||
      typeof wrappedText !== "string" ||
      wrappedText.trim().length === 0
    ) {
      return res.status(400).json({
        error: "Invalid wrappedText",
        message: "Please provide the quote text",
      });
    }

    const template = validateTemplate(rawTemplate);
    const styleParams = validateStyleParams(rawStyleParams);
    const persist = req.query.persist === "true";

    // Generate job hash for caching
    const hash = generateJobHash(
      unsplashId,
      wrappedText,
      template,
      styleParams
    );

    logTelemetry("job_started", { hash, unsplashId, persist });

    // Check if video already exists in MongoDB
    const existingVideo = await findVideoByHash(hash).catch(() => null);
    if (existingVideo?.publicUrl && persist) {
      logTelemetry("cache_hit", { hash });
      return res.json({
        success: true,
        cached: true,
        url: existingVideo.publicUrl,
        hash,
      });
    }

    // Acquire semaphore (wait for available slot)
    logTelemetry("semaphore_wait", semaphore.getStatus());
    await semaphore.acquire();
    acquiredSemaphore = true;
    logTelemetry("semaphore_acquired");

    // Ensure temp directory exists
    if (!existsSync(TEMP_DIR)) {
      mkdirSync(TEMP_DIR, { recursive: true });
    }

    // Step 1: Fetch Unsplash image
    logTelemetry("unsplash_fetch_start", { unsplashId });
    const fetchStart = Date.now();
    const { imagePath, photographer } = await fetchUnsplashImage(unsplashId);
    tempFiles.push(imagePath);
    logTelemetry(
      "unsplash_fetch_complete",
      { photographer },
      Date.now() - fetchStart
    );

    // Step 2: Generate video with FFmpeg
    const outputPath = path.join(TEMP_DIR, `${hash}.mp4`);
    tempFiles.push(outputPath);

    logTelemetry("ffmpeg_start");
    const ffmpegStart = Date.now();
    const ffmpegArgs = buildFFmpegArgs(
      imagePath,
      outputPath,
      wrappedText,
      template,
      styleParams,
      FONT_PATH
    );
    await executeFFmpeg(ffmpegArgs);
    logTelemetry("ffmpeg_complete", undefined, Date.now() - ffmpegStart);

    // Get video file stats
    const videoStats = statSync(outputPath);
    const videoSize = videoStats.size;

    // Step 3: Handle persist or stream
    let publicUrl: string | undefined;

    if (persist && isS3Configured()) {
      // Upload to S3
      logTelemetry("s3_upload_start");
      const s3Key = generateS3Key(hash);
      publicUrl = await uploadToS3(outputPath, s3Key);
      logTelemetry("s3_upload_complete", { url: publicUrl });
    }

    // Save metadata to MongoDB (if configured)
    try {
      const videoDoc: Omit<VideoDocument, "_id"> = {
        hash,
        unsplashId,
        input: {
          text: wrappedText.substring(0, 500),
          template,
          styleParams,
        },
        createdAt: new Date(),
        size: videoSize,
        duration: 5,
        publicUrl,
        persist,
      };
      await saveVideoMetadata(videoDoc);
      logTelemetry("mongodb_saved", { hash });
    } catch (dbError) {
      console.error("[MongoDB] Failed to save metadata:", dbError);
      // Continue - don't fail the request for metadata errors
    }

    // Step 4: Return response
    const totalDuration = Date.now() - startTime;
    logTelemetry("job_complete", { hash, size: videoSize }, totalDuration);

    if (persist && publicUrl) {
      // Return URL for persisted video
      cleanup(tempFiles);
      return res.json({
        success: true,
        cached: false,
        url: publicUrl,
        hash,
        size: videoSize,
        duration: 5,
        photographer,
      });
    } else {
      // Stream video back to client
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Length", videoSize);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="vibequote-${hash}.mp4"`
      );
      res.setHeader("X-Video-Hash", hash);
      res.setHeader("X-Photographer", encodeURIComponent(photographer));

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
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[GenerateVideo] Error:", message);

    logTelemetry("job_error", { error: message });

    cleanup(tempFiles);

    if (!res.headersSent) {
      const statusCode = message.includes("not found") ? 404 : 500;
      return res.status(statusCode).json({
        error: "Video generation failed",
        message,
      });
    }
  } finally {
    if (acquiredSemaphore) {
      semaphore.release();
      logTelemetry("semaphore_released");
    }
  }
});

/**
 * GET /api/generate-video/status
 * Returns service status and queue info
 */
router.get("/status", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    queue: semaphore.getStatus(),
    recentTelemetry: telemetry.slice(-20),
  });
});

export default router;
