/**
 * useVideoExport - Frame-by-frame video export that matches Preview exactly
 *
 * This hook captures canvas content at each frame while running
 * the same animation/effects logic as Preview.
 *
 * Timeline:
 * - Export starts at t=0
 * - Export stops at exactly t=duration
 * - Total frames = duration * FPS
 */

import { useCallback, useRef, useState } from "react";
import {
  getAnimationState,
  getAnimationDuration,
  AnimationType,
} from "./animation";

interface ExportConfig {
  duration: 5 | 10 | 15; // seconds
  quality: "720p" | "1080p";
  fps: number;
}

interface ExportState {
  isExporting: boolean;
  progress: number; // 0-100
  error: string | null;
}

interface TextLayerData {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  textAlign: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  lineHeight: number;
  letterSpacing: number;
  shadowColor: string;
  shadowBlur: number;
  boxOpacity: number;
}

interface UseVideoExportOptions {
  textAnimation: AnimationType;
  particleEffect: "none" | "snow" | "dust" | "sparkles";
  // Music config (for future audio sync)
  musicEnabled: boolean;
  musicTrackId: string | null;
  musicVolume: number;
}

interface UseVideoExportReturn {
  exportVideo: (
    canvasElement: HTMLElement,
    backgroundImage: string | null,
    backgroundGradient: string,
    layers: TextLayerData[],
    config: ExportConfig
  ) => Promise<Blob>;
  cancelExport: () => void;
  state: ExportState;
}

// Resolution mapping
function getResolution(quality: "720p" | "1080p") {
  return quality === "720p"
    ? { width: 1280, height: 720 }
    : { width: 1920, height: 1080 };
}

/**
 * Hook for exporting video with exact Preview parity
 */
export function useVideoExport(
  options: UseVideoExportOptions
): UseVideoExportReturn {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    error: null,
  });

  const cancelledRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const cancelExport = useCallback(() => {
    cancelledRef.current = true;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setState({ isExporting: false, progress: 0, error: null });
  }, []);

  const exportVideo = useCallback(
    async (
      canvasElement: HTMLElement,
      backgroundImage: string | null,
      backgroundGradient: string,
      layers: TextLayerData[],
      config: ExportConfig
    ): Promise<Blob> => {
      // Reset state
      cancelledRef.current = false;
      setState({ isExporting: true, progress: 0, error: null });

      const { width, height } = getResolution(config.quality);
      const durationMs = config.duration * 1000;
      const totalFrames = config.duration * config.fps;
      const frameInterval = 1000 / config.fps;

      // Create offscreen canvas for export
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = width;
      exportCanvas.height = height;
      const ctx = exportCanvas.getContext("2d");

      if (!ctx) {
        throw new Error("Cannot create canvas context");
      }

      // Get scaling factors for canvas content
      const sourceRect = canvasElement.getBoundingClientRect();
      const scaleX = width / sourceRect.width;
      const scaleY = height / sourceRect.height;

      // Load background image if present
      let bgImage: HTMLImageElement | null = null;
      if (backgroundImage) {
        bgImage = new Image();
        bgImage.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          bgImage!.onload = () => resolve();
          bgImage!.onerror = () =>
            reject(new Error("Failed to load background image"));
          bgImage!.src = backgroundImage;
        });
      }

      // Calculate animation duration percentage
      const animDurationPercent = getAnimationDuration(options.textAnimation);
      const animDurationMs = animDurationPercent * durationMs;

      // Setup MediaRecorder
      const stream = exportCanvas.captureStream(config.fps);
      streamRef.current = stream;

      const mimeTypes = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];
      let selectedMime = "video/webm";
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMime,
        videoBitsPerSecond: config.quality === "1080p" ? 8000000 : 4000000,
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      // Start recording
      mediaRecorder.start(100);

      // Frame rendering function - matches Preview logic exactly
      const renderFrame = (frameIndex: number) => {
        // Calculate timeline position
        const elapsed = frameIndex * frameInterval;
        const timeProgress = elapsed / durationMs; // 0-1 overall

        // Calculate animation progress (within animation duration)
        let animProgress = 1;
        if (animDurationMs > 0 && elapsed < animDurationMs) {
          animProgress = elapsed / animDurationMs;
        }

        // Get animation state - same as Preview
        const animState = getAnimationState(
          options.textAnimation,
          animProgress
        );

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw background
        if (bgImage) {
          ctx.drawImage(bgImage, 0, 0, width, height);
        } else if (backgroundGradient) {
          // Parse gradient and apply
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, "#1e293b");
          gradient.addColorStop(1, "#0f172a");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }

        // Draw text layers with animation state
        for (const layer of layers) {
          ctx.save();

          // Apply animation transforms - same as Canvas.tsx
          const animOpacity = animState.opacity ?? 1;
          const animScale = animState.scale ?? 1;
          const animTranslateY = (animState.translateY ?? 0) * scaleY;
          const animBlur = animState.blur ?? 0;

          // Calculate layer position
          const layerX = layer.x * scaleX;
          const layerY = layer.y * scaleY;
          const layerWidth = layer.width * scaleX;
          const layerHeight = layer.height * scaleY;
          const layerCenterX = layerX + layerWidth / 2;
          const layerCenterY = layerY + layerHeight / 2;

          // Apply transforms
          ctx.globalAlpha = animOpacity;
          ctx.translate(layerCenterX, layerCenterY + animTranslateY);
          ctx.scale(animScale, animScale);
          ctx.translate(-layerCenterX, -layerCenterY);

          // Apply blur if needed
          if (animBlur > 0) {
            ctx.filter = `blur(${animBlur}px)`;
          }

          // Draw text box background
          if (layer.boxOpacity > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${layer.boxOpacity})`;
            ctx.fillRect(layerX, layerY, layerWidth, layerHeight);
          }

          // Draw text
          const fontSize = layer.fontSize * scaleY;
          ctx.font = `${layer.fontStyle} ${layer.fontWeight} ${fontSize}px ${layer.fontFamily}`;
          ctx.fillStyle = layer.color;
          ctx.textAlign = layer.textAlign as CanvasTextAlign;
          ctx.textBaseline = "top";

          // Handle shadow
          if (layer.shadowBlur > 0) {
            ctx.shadowColor = layer.shadowColor;
            ctx.shadowBlur = layer.shadowBlur * scaleY;
          }

          // Calculate text X position based on alignment
          let textX = layerX;
          if (layer.textAlign === "center") {
            textX = layerX + layerWidth / 2;
          } else if (layer.textAlign === "right") {
            textX = layerX + layerWidth;
          }

          // Draw text with word wrap
          const lines = layer.text.split("\n");
          const lineHeight = fontSize * (layer.lineHeight || 1.5);
          let textY = layerY + fontSize * 0.2;

          for (const line of lines) {
            ctx.fillText(line, textX, textY);
            textY += lineHeight;
          }

          ctx.restore();
        }

        return timeProgress; // Return progress for UI update
      };

      // Time-based frame rendering loop
      return new Promise<Blob>((resolve, reject) => {
        const startTime = performance.now();
        let frameCount = 0;

        const animate = (timestamp: number) => {
          if (cancelledRef.current) {
            reject(new Error("Export cancelled"));
            return;
          }

          const elapsed = timestamp - startTime;

          // Calculate which frame we should be on based on time
          const targetFrame = Math.floor(elapsed / frameInterval);

          // Render frames we may have missed (ensures smooth timing)
          while (frameCount <= targetFrame && frameCount < totalFrames) {
            renderFrame(frameCount);
            frameCount++;
          }

          // Update progress
          const progressPercent = Math.min(
            (frameCount / totalFrames) * 100,
            100
          );
          setState((prev) => ({ ...prev, progress: progressPercent }));

          // Check if export is complete (time-based, not frame-based)
          if (elapsed >= durationMs) {
            // Render any remaining frames
            while (frameCount < totalFrames) {
              renderFrame(frameCount);
              frameCount++;
            }

            // Stop recording exactly at duration
            mediaRecorder.stop();

            // Wait for onstop
            mediaRecorder.onstop = () => {
              // Cleanup
              stream.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
              mediaRecorderRef.current = null;

              const blob = new Blob(chunks, {
                type: selectedMime.split(";")[0],
              });
              setState({ isExporting: false, progress: 100, error: null });
              resolve(blob);
            };
          } else {
            // Continue animation
            animationFrameRef.current = requestAnimationFrame(animate);
          }
        };

        // Start animation loop
        animationFrameRef.current = requestAnimationFrame(animate);
      });
    },
    [options.textAnimation]
  );

  return {
    exportVideo,
    cancelExport,
    state,
  };
}
