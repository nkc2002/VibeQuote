/**
 * VideoExportModal - Client-side video export with progress UI
 *
 * Features:
 * - Duration selection: 5s / 10s / 15s
 * - Quality selection: 720p / 1080p
 * - Uses animation system for consistent preview/export
 * - Animated progress indicator
 * - Success state with download button
 */

import { useState, useEffect, useCallback, useRef, RefObject } from "react";
import {
  AnimationType,
  getAnimationState,
  getAnimationDuration,
} from "./animation";
import { ParticleType } from "./particles";
import { TextLayer } from "./types";
import { CanvasRef } from "./Canvas";

// Export options
export interface VideoExportOptions {
  duration: 5 | 10 | 15;
  quality: "720p" | "1080p";
  backgroundAnimation: AnimationType;
  textAnimation: AnimationType;
}

// Modal states
type ExportState = "options" | "exporting" | "success" | "error";

interface VideoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  captureCanvas: () => Promise<string>; // Returns base64 data URL
  onExportComplete?: () => void;
  // New props for Preview-accurate export
  layers: TextLayer[];
  backgroundImage: string | null;
  backgroundGradient: string;
  textAnimation: AnimationType;
  particleEffect: ParticleType;
  musicEnabled: boolean;
  musicTrackId: string | null;
  musicVolume: number;
  canvasRef: RefObject<CanvasRef | null>;
}

const VideoExportModal: React.FC<VideoExportModalProps> = ({
  isOpen,
  onClose,
  captureCanvas,
  onExportComplete,
  layers,
  backgroundImage: _backgroundImage,
  backgroundGradient: _backgroundGradient,
  textAnimation,
  particleEffect: _particleEffect,
  musicEnabled: _musicEnabled,
  musicTrackId: _musicTrackId,
  musicVolume: _musicVolume,
  canvasRef: _canvasRef,
}) => {
  const [exportState, setExportState] = useState<ExportState>("options");
  const [options, setOptions] = useState<VideoExportOptions>({
    duration: 5,
    quality: "1080p",
    backgroundAnimation: "fadeIn",
    textAnimation: textAnimation || "fadeIn",
  });
  const [progress, setProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [browserWarning, setBrowserWarning] = useState("");
  const [, setIsCancelled] = useState(false);

  // Refs for resource cleanup and concurrent export prevention
  const isExportingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const videoBlobUrlRef = useRef<string | null>(null);

  // Browser compatibility detection
  const checkBrowserSupport = useCallback(() => {
    // Check MediaRecorder support
    if (typeof MediaRecorder === "undefined") {
      return {
        supported: false,
        error:
          "Trình duyệt của bạn không hỗ trợ ghi video. Vui lòng sử dụng Chrome, Edge hoặc Firefox.",
      };
    }

    // Check captureStream support
    const testCanvas = document.createElement("canvas");
    if (typeof testCanvas.captureStream !== "function") {
      return {
        supported: false,
        error:
          "Trình duyệt của bạn không hỗ trợ canvas.captureStream(). Vui lòng cập nhật hoặc sử dụng Chrome.",
      };
    }

    // Check for Chrome-based browser
    const isChrome =
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);

    let warning = "";
    if (!isChrome && !isEdge) {
      if (isFirefox) {
        warning =
          "Firefox có thể gặp vấn đề với video export. Khuyến nghị sử dụng Chrome hoặc Edge.";
      } else {
        warning = "Để có kết quả tốt nhất, hãy sử dụng Chrome hoặc Edge.";
      }
    }

    return { supported: true, warning };
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setExportState("options");
      setProgress(0);
      setVideoBlob(null);
      setErrorMessage("");
      setIsCancelled(false);

      // Check browser support
      const { supported, error, warning } = checkBrowserSupport();
      if (!supported) {
        setErrorMessage(error || "Trình duyệt không được hỗ trợ");
        setExportState("error");
      }
      setBrowserWarning(warning || "");
    }
  }, [isOpen, checkBrowserSupport]);

  // Handle tab visibility change during export
  useEffect(() => {
    if (exportState !== "exporting") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.warn("[VideoExport] Tab became hidden during export");
        setIsCancelled(true);
        setErrorMessage(
          "Export bị hủy vì tab không còn active. Vui lòng giữ tab này ở foreground."
        );
        setExportState("error");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [exportState]);

  // Get resolution based on quality
  const getResolution = (quality: "720p" | "1080p") => {
    return quality === "1080p"
      ? { width: 1920, height: 1080 }
      : { width: 1280, height: 720 };
  };

  // Cleanup resources
  const cleanupResources = useCallback(() => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop media recorder
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("[VideoExport] Error stopping recorder:", e);
      }
      mediaRecorderRef.current = null;
    }

    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Revoke blob URL
    if (videoBlobUrlRef.current) {
      URL.revokeObjectURL(videoBlobUrlRef.current);
      videoBlobUrlRef.current = null;
    }

    isExportingRef.current = false;
  }, []);

  // Cleanup on unmount or modal close
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);

  // Cleanup when modal closes during export
  useEffect(() => {
    if (!isOpen && isExportingRef.current) {
      cleanupResources();
    }
  }, [isOpen, cleanupResources]);

  // Cancel export with proper cleanup
  const handleCancel = useCallback(() => {
    setIsCancelled(true);
    cleanupResources();
    setExportState("options");
    setProgress(0);
  }, [cleanupResources]);

  // Client-side video export using Canvas + MediaRecorder
  const handleExport = useCallback(async () => {
    // Prevent concurrent exports
    if (isExportingRef.current) {
      console.warn("[VideoExport] Export already in progress");
      return;
    }

    // Pre-flight checks
    const { supported, error } = checkBrowserSupport();
    if (!supported) {
      setErrorMessage(error || "Trình duyệt không được hỗ trợ");
      setExportState("error");
      return;
    }

    // Check if tab is visible
    if (document.hidden) {
      setErrorMessage(
        "Vui lòng giữ tab này active trong quá trình export video."
      );
      setExportState("error");
      return;
    }

    isExportingRef.current = true;
    setExportState("exporting");
    setProgress(0);
    setIsCancelled(false);

    try {
      // Step 1: Capture canvas as image
      setProgress(10);
      const imageDataUrl = await captureCanvas();

      // Step 2: Create offscreen canvas for video
      const { width, height } = getResolution(options.quality);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Cannot create canvas context");
      }

      // Step 3: Load image
      setProgress(20);
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageDataUrl;
      });

      // Step 4: Setup MediaRecorder with best supported MIME type
      setProgress(30);
      const FPS = 30;
      const stream = canvas.captureStream(FPS); // Video-only stream (no audio)

      // Detect best supported MIME type - prefer MP4 for better compatibility
      const mimeTypes = [
        "video/mp4;codecs=avc1",
        "video/mp4;codecs=h264",
        "video/mp4",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];
      let selectedMimeType = "video/webm"; // fallback
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log("[VideoExport] Selected MIME type:", mimeType);
          break;
        }
      }

      // Determine output format
      const isMP4 = selectedMimeType.includes("mp4");
      const fileExtension = isMP4 ? "mp4" : "webm";
      console.log("[VideoExport] Output format:", fileExtension);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: options.quality === "1080p" ? 8000000 : 4000000,
      });

      // Store refs for cleanup
      streamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      // Step 5: Record video frames with animation system
      const durationMs = options.duration * 1000;
      const totalFrames = Math.floor(options.duration * FPS);

      // Calculate text animation duration (same as Preview)
      const textAnimDurationPercent = getAnimationDuration(
        options.textAnimation
      );
      const textAnimDurationMs = textAnimDurationPercent * durationMs;

      mediaRecorder.start(100); // Request data every 100ms

      // Animation loop using time-based animations (same as usePreview)
      const startTime = performance.now();
      let frameCount = 0;

      // Scale factor for layers (source canvas to export canvas)
      const scaleX = width / 1920;
      const scaleY = height / 1080;

      const drawFrame = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        const timeProgress = Math.min(elapsed / durationMs, 1);

        // Calculate text animation progress (same as Preview)
        let textAnimProgress = 1;
        if (textAnimDurationMs > 0 && elapsed < textAnimDurationMs) {
          textAnimProgress = elapsed / textAnimDurationMs;
        }

        // Get animation states from our animation system
        const bgState = getAnimationState(
          options.backgroundAnimation,
          timeProgress
        );
        const textState = getAnimationState(
          options.textAnimation,
          textAnimProgress
        );

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Apply background animation (zoom effect)
        ctx.save();
        const scale = bgState.scale;
        const offsetX = (width * (scale - 1)) / 2;
        const offsetY = (height * (scale - 1)) / 2;

        ctx.globalAlpha = bgState.opacity;
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-width / 2, -height / 2);
        ctx.drawImage(img, -offsetX / scale, -offsetY / scale, width, height);
        ctx.restore();

        // Render text layers with animation (same as Canvas.tsx)
        for (const layer of layers) {
          ctx.save();

          // Get animation transforms
          const animOpacity = textState.opacity ?? 1;
          const animScale = textState.scale ?? 1;
          const animTranslateY = (textState.translateY ?? 0) * scaleY;
          const animBlur = textState.blur ?? 0;

          // Calculate layer position (x/y are percentages 0-100)
          // Convert percentage to pixels in export canvas
          const layerX = (layer.x / 100) * width;
          const layerY = (layer.y / 100) * height;

          // Width/height are in pixels relative to 1080x1920 canvas
          // Scale them to export resolution
          const layerWidth = layer.width * scaleX;
          const layerHeight = layer.height * scaleY;

          const layerCenterX = layerX + layerWidth / 2;
          const layerCenterY = layerY + layerHeight / 2;

          // Apply animation transforms
          ctx.globalAlpha = animOpacity * layer.opacity;
          ctx.translate(layerCenterX, layerCenterY + animTranslateY);
          ctx.scale(animScale, animScale);
          ctx.translate(-layerCenterX, -layerCenterY);

          // Apply blur if needed
          if (animBlur > 0) {
            ctx.filter = `blur(${animBlur}px)`;
          }

          // Draw text
          const fontSize = layer.fontSize * scaleY;
          ctx.font = `${fontSize}px ${layer.fontFamily}`;
          ctx.fillStyle = layer.color;
          ctx.textAlign = "center" as CanvasTextAlign;
          ctx.textBaseline = "top";

          // Calculate text X position (centered within layer)
          const textX = layerCenterX;

          // Draw text with word wrap
          const lines = layer.text.split("\n");
          const lineHeight = fontSize * 1.5;
          let textY = layerY;

          for (const line of lines) {
            ctx.fillText(line, textX, textY);
            textY += lineHeight;
          }

          ctx.restore();
        }

        // Update progress
        frameCount++;
        setProgress(30 + Math.floor((frameCount / totalFrames) * 60));

        if (elapsed < durationMs) {
          animationFrameRef.current = requestAnimationFrame(drawFrame);
        } else {
          // Stop recording exactly when duration ends
          mediaRecorder.stop();
        }
      };

      // Start drawing
      animationFrameRef.current = requestAnimationFrame(drawFrame);

      // Wait for recording to complete and auto-download
      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => {
          setProgress(95);

          // Stop stream tracks to release resources
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          mediaRecorderRef.current = null;

          // Determine file extension based on MIME type
          const extension = selectedMimeType.includes("mp4") ? "mp4" : "webm";
          const blob = new Blob(chunks, {
            type: selectedMimeType.split(";")[0],
          });
          setVideoBlob(blob);

          // Auto-trigger download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `vibequote-${Date.now()}.${extension}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          setProgress(100);
          isExportingRef.current = false;
          console.log("[VideoExport] Video exported:", {
            size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
            duration: `${options.duration}s`,
            quality: options.quality,
            mimeType: selectedMimeType,
          });
          resolve();
        };
      });

      setExportState("success");
      onExportComplete?.();
    } catch (error) {
      console.error("[VideoExport] Error:", error);
      cleanupResources();
      setErrorMessage(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      setExportState("error");
    }
  }, [captureCanvas, options, onExportComplete, checkBrowserSupport]);

  // Download video
  const handleDownload = useCallback(() => {
    if (!videoBlob) return;

    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vibequote-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [videoBlob]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={exportState === "options" ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          {exportState === "options" && (
            <>
              <h2 className="text-xl font-semibold text-white mb-1">
                Tạo Video
              </h2>
              <p className="text-slate-400 text-sm">Chọn thông số xuất video</p>
            </>
          )}

          {exportState === "exporting" && (
            <>
              <h2 className="text-xl font-semibold text-white mb-1">
                Đang tạo video...
              </h2>
              <p className="text-amber-400 text-sm flex items-center gap-2">
                <svg
                  className="w-4 h-4 animate-pulse"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Vui lòng không chuyển tab trong quá trình tạo video
              </p>
            </>
          )}

          {exportState === "success" && (
            <>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Video đã sẵn sàng
                </h2>
              </div>
              <p className="text-slate-400 text-sm">
                Video của bạn đã được tạo thành công
              </p>
            </>
          )}

          {exportState === "error" && (
            <>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Có lỗi xảy ra
                </h2>
              </div>
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Options State */}
          {exportState === "options" && (
            <div className="space-y-5">
              {/* Browser Warning */}
              {browserWarning && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <svg
                    className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-amber-400 text-sm">{browserWarning}</p>
                </div>
              )}

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Thời lượng
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([5, 10, 15] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() =>
                        setOptions((prev) => ({ ...prev, duration: d }))
                      }
                      className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                        options.duration === d
                          ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {d} giây
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Chất lượng
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["720p", "1080p"] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() =>
                        setOptions((prev) => ({ ...prev, quality: q }))
                      }
                      className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                        options.quality === q
                          ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {q}
                      <span className="block text-xs opacity-70 mt-0.5">
                        {q === "1080p" ? "1920×1080" : "1280×720"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary-500/25"
                >
                  Tạo Video
                </button>
              </div>
            </div>
          )}

          {/* Exporting State */}
          {exportState === "exporting" && (
            <div className="py-4">
              {/* Progress Ring */}
              <div className="flex justify-center mb-6">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-slate-700"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="url(#progress-gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * progress) / 100}
                      className="transition-all duration-300"
                    />
                    <defs>
                      <linearGradient
                        id="progress-gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-white">
                    {progress}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-center text-slate-400 text-sm mt-4">
                {progress < 30 && "Đang chuẩn bị..."}
                {progress >= 30 && progress < 90 && "Đang render video..."}
                {progress >= 90 && "Đang hoàn tất..."}
              </p>

              {/* Cancel Button */}
              <button
                onClick={handleCancel}
                className="w-full mt-4 py-2 px-4 rounded-lg text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Hủy
              </button>
            </div>
          )}

          {/* Success State */}
          {exportState === "success" && (
            <div className="py-4">
              {/* Video Preview */}
              {videoBlob && (
                <div className="mb-4 rounded-lg overflow-hidden bg-black">
                  <video
                    src={URL.createObjectURL(videoBlob)}
                    controls
                    autoPlay
                    loop
                    muted
                    className="w-full"
                  />
                </div>
              )}

              {/* Info */}
              <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Thời lượng</span>
                  <span className="text-white">{options.duration} giây</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-slate-400">Chất lượng</span>
                  <span className="text-white">{options.quality}</span>
                </div>
                {videoBlob && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-slate-400">Kích thước</span>
                    <span className="text-white">
                      {(videoBlob.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 transition-opacity shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Tải xuống
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {exportState === "error" && (
            <div className="py-4">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={() => setExportState("options")}
                  className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoExportModal;
