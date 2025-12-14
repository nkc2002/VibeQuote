import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { TextLayer } from "./types";
import { AnimationType, getAnimationState } from "./animation";
import { ParticleSystem, ParticleType } from "./particles";

// Resize handle types
type HandleType = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface CanvasProps {
  layers: TextLayer[];
  backgroundImage: string | null;
  backgroundGradient: string;
  boxOpacity: number;
  selectedLayerId: string | null;
  isPreviewMode: boolean;
  // Animation props
  textAnimation?: AnimationType;
  animationProgress?: number;
  // Particle effect prop
  particleEffect?: ParticleType;
  onSelectLayer: (id: string | null) => void;
  onMoveLayer: (id: string, x: number, y: number) => void;
  onResizeLayer?: (
    id: string,
    width: number,
    height: number,
    x?: number,
    y?: number
  ) => void;
}

export interface CanvasRef {
  captureAsDataURL: () => Promise<string>;
}

const Canvas = forwardRef<CanvasRef, CanvasProps>(
  (
    {
      layers,
      backgroundImage,
      backgroundGradient,
      boxOpacity,
      selectedLayerId,
      isPreviewMode,
      textAnimation = "none",
      animationProgress = 1,
      particleEffect = "none",
      onSelectLayer,
      onMoveLayer,
      onResizeLayer,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const particleCanvasRef = useRef<HTMLCanvasElement>(null);
    const particleSystemRef = useRef<ParticleSystem | null>(null);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showSnapLines, setShowSnapLines] = useState({
      horizontal: false,
      vertical: false,
    });

    // Resize state
    const [resizing, setResizing] = useState<string | null>(null);
    const [resizeStart, setResizeStart] = useState<{
      handleType: HandleType;
      startMouseX: number;
      startMouseY: number;
      startWidth: number;
      startHeight: number;
      startLayerX: number;
      startLayerY: number;
      canvasWidth: number;
      canvasHeight: number;
    } | null>(null);

    // Compute animation state
    const animState = useMemo(() => {
      return getAnimationState(textAnimation, animationProgress);
    }, [textAnimation, animationProgress]);

    // Initialize ParticleSystem
    useEffect(() => {
      if (particleCanvasRef.current && !particleSystemRef.current) {
        particleSystemRef.current = new ParticleSystem(
          particleCanvasRef.current
        );
      }

      return () => {
        if (particleSystemRef.current) {
          particleSystemRef.current.destroy();
          particleSystemRef.current = null;
        }
      };
    }, []);

    // Update particle effect when type changes
    useEffect(() => {
      if (particleSystemRef.current) {
        particleSystemRef.current.setEffect(particleEffect);
      }
    }, [particleEffect]);

    // Update particle canvas size when container resizes
    useEffect(() => {
      const updateParticleCanvasSize = () => {
        if (canvasRef.current && particleSystemRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          particleSystemRef.current.setSize(rect.width, rect.height);
        }
      };

      updateParticleCanvasSize();

      const resizeObserver = new ResizeObserver(updateParticleCanvasSize);
      if (canvasRef.current) {
        resizeObserver.observe(canvasRef.current);
      }

      return () => resizeObserver.disconnect();
    }, []);

    // Expose captureAsDataURL method to parent via ref
    useImperativeHandle(ref, () => ({
      captureAsDataURL: async () => {
        if (!canvasRef.current) {
          throw new Error("Canvas element not found");
        }

        const element = canvasRef.current;
        const rect = element.getBoundingClientRect();

        // Create offscreen canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }

        // Set canvas size (use 2x for better quality)
        const scale = 2;
        canvas.width = rect.width * scale;
        canvas.height = rect.height * scale;
        ctx.scale(scale, scale);

        // Draw background
        if (backgroundImage) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () =>
              reject(new Error("Failed to load background image"));
            img.src = backgroundImage;
          });

          // Draw cover-fit image
          const imgRatio = img.width / img.height;
          const canvasRatio = rect.width / rect.height;
          let drawWidth, drawHeight, drawX, drawY;

          if (imgRatio > canvasRatio) {
            drawHeight = rect.height;
            drawWidth = drawHeight * imgRatio;
            drawX = (rect.width - drawWidth) / 2;
            drawY = 0;
          } else {
            drawWidth = rect.width;
            drawHeight = drawWidth / imgRatio;
            drawX = 0;
            drawY = (rect.height - drawHeight) / 2;
          }

          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        } else {
          // Draw gradient background
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(0, 0, rect.width, rect.height);
        }

        // Draw dark overlay
        if (boxOpacity > 0) {
          ctx.fillStyle = `rgba(0, 0, 0, ${boxOpacity})`;
          ctx.fillRect(0, 0, rect.width, rect.height);
        }

        // Draw text layers
        layers.forEach((layer) => {
          const x = (layer.x / 100) * rect.width;
          const y = (layer.y / 100) * rect.height;

          ctx.save();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `${layer.fontSize}px ${layer.fontFamily}`;
          ctx.fillStyle = layer.color;
          ctx.globalAlpha = layer.opacity;

          // Add text shadow
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;

          // Draw text (handle multiline)
          const lines = layer.text.split("\n");
          const lineHeight = layer.fontSize * 1.4;
          const totalHeight = lines.length * lineHeight;
          const startY = y - totalHeight / 2 + lineHeight / 2;

          lines.forEach((line, index) => {
            ctx.fillText(line, x, startY + index * lineHeight);
          });

          ctx.restore();
        });

        return canvas.toDataURL("image/jpeg", 0.9);
      },
    }));

    // Calculate snap threshold (in percentage)
    const SNAP_THRESHOLD = 2;

    // Handle mouse down on layer
    const handleMouseDown = useCallback(
      (e: React.MouseEvent, layerId: string) => {
        if (isPreviewMode) return;

        // Don't start drag if clicking on resize handle
        const target = e.target as HTMLElement;
        if (target.hasAttribute("data-resize")) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        setDragging(layerId);
        onSelectLayer(layerId);
        setDragStart({ x: e.clientX, y: e.clientY });
      },
      [isPreviewMode, onSelectLayer]
    );

    // Handle mouse move
    useEffect(() => {
      if (!dragging || !canvasRef.current) return;

      const handleMouseMove = (e: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const layer = layers.find((l) => l.id === dragging);
        if (!layer) return;

        // Calculate new position as percentage
        const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
        const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

        let newX = layer.x + deltaX;
        let newY = layer.y + deltaY;

        // Snap to center
        const snapH = Math.abs(newX - 50) < SNAP_THRESHOLD;
        const snapV = Math.abs(newY - 50) < SNAP_THRESHOLD;

        if (snapH) newX = 50;
        if (snapV) newY = 50;

        setShowSnapLines({ horizontal: snapV, vertical: snapH });

        // Clamp to canvas bounds (with some padding)
        newX = Math.max(5, Math.min(95, newX));
        newY = Math.max(5, Math.min(95, newY));

        onMoveLayer(dragging, newX, newY);
        setDragStart({ x: e.clientX, y: e.clientY });
      };

      const handleMouseUp = () => {
        setDragging(null);
        setShowSnapLines({ horizontal: false, vertical: false });
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [dragging, dragStart, layers, onMoveLayer]);

    // Handle resize mouse events
    useEffect(() => {
      if (!resizing || !resizeStart || !canvasRef.current || !onResizeLayer)
        return;

      const handleMouseMove = (e: MouseEvent) => {
        const {
          handleType,
          startMouseX,
          startMouseY,
          startWidth,
          startHeight,
          startLayerX,
          startLayerY,
          canvasWidth,
          canvasHeight,
        } = resizeStart;

        // Calculate delta in pixels
        const dx = e.clientX - startMouseX;
        const dy = e.clientY - startMouseY;

        // Check modifier keys
        const shiftKey = e.shiftKey; // Maintain aspect ratio
        const altKey = e.altKey; // Resize from center

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startLayerX;
        let newY = startLayerY;

        // Calculate based on handle type
        // Key insight: center must move by half the drag to keep opposite edge/corner fixed
        switch (handleType) {
          // Edge handles - single dimension
          case "n": // Top edge - bottom edge fixed
            newHeight = Math.max(10, startHeight - dy);
            newY = startLayerY + ((dy / canvasHeight) * 100) / 2;
            break;
          case "s": // Bottom edge - top edge fixed
            newHeight = Math.max(10, startHeight + dy);
            newY = startLayerY + ((dy / canvasHeight) * 100) / 2;
            break;
          case "w": // Left edge - right edge fixed
            newWidth = Math.max(10, startWidth - dx);
            newX = startLayerX + ((dx / canvasWidth) * 100) / 2;
            break;
          case "e": // Right edge - left edge fixed
            newWidth = Math.max(10, startWidth + dx);
            newX = startLayerX + ((dx / canvasWidth) * 100) / 2;
            break;

          // Corner handles - both dimensions
          case "nw": // Top-left - bottom-right fixed
            newWidth = Math.max(10, startWidth - dx);
            newHeight = Math.max(10, startHeight - dy);
            newX = startLayerX + ((dx / canvasWidth) * 100) / 2;
            newY = startLayerY + ((dy / canvasHeight) * 100) / 2;
            break;
          case "ne": // Top-right - bottom-left fixed
            newWidth = Math.max(10, startWidth + dx);
            newHeight = Math.max(10, startHeight - dy);
            newX = startLayerX + ((dx / canvasWidth) * 100) / 2;
            newY = startLayerY + ((dy / canvasHeight) * 100) / 2;
            break;
          case "sw": // Bottom-left - top-right fixed
            newWidth = Math.max(10, startWidth - dx);
            newHeight = Math.max(10, startHeight + dy);
            newX = startLayerX + ((dx / canvasWidth) * 100) / 2;
            newY = startLayerY + ((dy / canvasHeight) * 100) / 2;
            break;
          case "se": // Bottom-right - top-left fixed
            newWidth = Math.max(10, startWidth + dx);
            newHeight = Math.max(10, startHeight + dy);
            newX = startLayerX + ((dx / canvasWidth) * 100) / 2;
            newY = startLayerY + ((dy / canvasHeight) * 100) / 2;
            break;
        }

        // Shift: maintain aspect ratio
        if (
          shiftKey &&
          (handleType === "nw" ||
            handleType === "ne" ||
            handleType === "sw" ||
            handleType === "se")
        ) {
          const aspectRatio = startWidth / startHeight;
          if (Math.abs(dx) > Math.abs(dy)) {
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = newHeight * aspectRatio;
          }
        }

        // Alt: resize from center (double the delta but keep layer centered)
        if (altKey) {
          const widthDiff = newWidth - startWidth;
          const heightDiff = newHeight - startHeight;
          newWidth = startWidth + widthDiff * 2;
          newHeight = startHeight + heightDiff * 2;
          newX = startLayerX; // Keep centered
          newY = startLayerY;
        }

        // Ensure minimum size
        newWidth = Math.max(10, newWidth);
        newHeight = Math.max(10, newHeight);

        // Clamp position to canvas
        newX = Math.max(2, Math.min(98, newX));
        newY = Math.max(2, Math.min(98, newY));

        onResizeLayer(resizing, newWidth, newHeight, newX, newY);
      };

      const handleMouseUp = () => {
        setResizing(null);
        setResizeStart(null);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [resizing, resizeStart, onResizeLayer]);

    // Handle resize start
    const handleResizeMouseDown = useCallback(
      (e: React.MouseEvent, layerId: string, handleType: HandleType) => {
        if (isPreviewMode || !onResizeLayer) return;
        e.preventDefault();
        e.stopPropagation();

        const layer = layers.find((l) => l.id === layerId);
        if (!layer || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();

        // Get actual layer element to measure its size (for auto-sized layers)
        const layerElement = e.currentTarget.parentElement;
        let actualWidth = layer.width;
        let actualHeight = layer.height;

        if (layerElement && (layer.width === 0 || layer.height === 0)) {
          const layerRect = layerElement.getBoundingClientRect();
          actualWidth = layer.width === 0 ? layerRect.width : layer.width;
          actualHeight = layer.height === 0 ? layerRect.height : layer.height;
        }

        setResizing(layerId);
        setResizeStart({
          handleType,
          startMouseX: e.clientX,
          startMouseY: e.clientY,
          startWidth: actualWidth,
          startHeight: actualHeight,
          startLayerX: layer.x,
          startLayerY: layer.y,
          canvasWidth: rect.width,
          canvasHeight: rect.height,
        });
      },
      [isPreviewMode, layers, onResizeLayer]
    );

    // Handle keyboard nudge
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!selectedLayerId) return;

        const layer = layers.find((l) => l.id === selectedLayerId);
        if (!layer) return;

        const step = e.shiftKey ? 5 : 1;
        let newX = layer.x;
        let newY = layer.y;

        switch (e.key) {
          case "ArrowUp":
            newY = Math.max(5, layer.y - step);
            e.preventDefault();
            break;
          case "ArrowDown":
            newY = Math.min(95, layer.y + step);
            e.preventDefault();
            break;
          case "ArrowLeft":
            newX = Math.max(5, layer.x - step);
            e.preventDefault();
            break;
          case "ArrowRight":
            newX = Math.min(95, layer.x + step);
            e.preventDefault();
            break;
          default:
            return;
        }

        onMoveLayer(selectedLayerId, newX, newY);
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedLayerId, layers, onMoveLayer]);

    // Click on canvas to deselect
    const handleCanvasClick = () => {
      if (!isPreviewMode) {
        onSelectLayer(null);
      }
    };

    return (
      <div
        ref={canvasRef}
        className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl cursor-crosshair"
        style={{
          background: backgroundImage
            ? `url(${backgroundImage}) center/cover no-repeat`
            : backgroundGradient,
        }}
        onClick={handleCanvasClick}
        role="application"
        aria-label="Canvas for editing quote video"
        tabIndex={0}
      >
        {/* Box overlay */}
        {boxOpacity > 0 && (
          <div
            className="absolute inset-0 bg-black pointer-events-none"
            style={{ opacity: boxOpacity }}
            aria-hidden="true"
          />
        )}

        {/* Snap lines */}
        {!isPreviewMode && showSnapLines.vertical && (
          <div
            className="absolute top-0 bottom-0 left-1/2 w-px bg-primary-500 pointer-events-none z-20"
            style={{ transform: "translateX(-50%)" }}
            aria-hidden="true"
          />
        )}
        {!isPreviewMode && showSnapLines.horizontal && (
          <div
            className="absolute left-0 right-0 top-1/2 h-px bg-primary-500 pointer-events-none z-20"
            style={{ transform: "translateY(-50%)" }}
            aria-hidden="true"
          />
        )}

        {/* Particle Effect Overlay Canvas */}
        <canvas
          ref={particleCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-5"
          aria-hidden="true"
        />

        {/* Text layers */}
        {layers.map((layer) => {
          // Compute animation transform
          const animTranslateX = animState.translateX || 0;
          const animTranslateY = animState.translateY || 0;
          const animScale = animState.scale ?? 1;
          const animOpacity = animState.opacity ?? 1;
          const animBlur = animState.blur ?? 0;
          const animClipPath = animState.clipPath ?? "inset(0 0 0 0)";

          return (
            <div
              key={layer.id}
              className={`absolute select-none transition-shadow duration-200 ${
                !isPreviewMode ? "cursor-move" : "cursor-default"
              } ${
                layer.isSelected && !isPreviewMode
                  ? "ring-2 ring-primary-500 ring-offset-2 ring-offset-transparent"
                  : ""
              }`}
              style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                transform: `translate(-50%, -50%) translate(${animTranslateX}px, ${animTranslateY}px) scale(${animScale})`,
                fontFamily: layer.fontFamily,
                fontSize: `${layer.fontSize}px`,
                color: layer.color,
                opacity: layer.opacity * animOpacity,
                filter: animBlur > 0 ? `blur(${animBlur}px)` : undefined,
                clipPath: animClipPath,
                textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                maxWidth: "80%",
                textAlign: "center",
                lineHeight: 1.4,
                zIndex: layer.isSelected ? 10 : 1,
                width: layer.width > 0 ? layer.width : "auto",
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
              onMouseDown={(e) => handleMouseDown(e, layer.id)}
              onClick={(e) => {
                e.stopPropagation();
                if (!isPreviewMode) onSelectLayer(layer.id);
              }}
              role="button"
              tabIndex={isPreviewMode ? -1 : 0}
              aria-label={`Text layer: ${layer.text}`}
              aria-selected={layer.isSelected}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectLayer(layer.id);
                }
              }}
            >
              {/* Typewriter effect: show partial text */}
              {textAnimation === "typewriter" ? (
                <span>
                  <span>
                    {layer.text.slice(
                      0,
                      Math.floor(layer.text.length * animState.charProgress)
                    )}
                  </span>
                  <span style={{ visibility: "hidden" }}>
                    {layer.text.slice(
                      Math.floor(layer.text.length * animState.charProgress)
                    )}
                  </span>
                </span>
              ) : (
                layer.text
              )}

              {/* Resize handles */}
              {layer.isSelected && !isPreviewMode && onResizeLayer && (
                <>
                  <div
                    data-resize="se"
                    className="absolute w-3 h-3 bg-white border-2 border-primary-500 rounded-full cursor-se-resize hover:bg-primary-100 hover:scale-125 transition-all z-50"
                    style={{ bottom: -6, right: -6 }}
                    onMouseDown={(e) =>
                      handleResizeMouseDown(e, layer.id, "se")
                    }
                  />
                  <div
                    data-resize="sw"
                    className="absolute w-3 h-3 bg-white border-2 border-primary-500 rounded-full cursor-sw-resize hover:bg-primary-100 hover:scale-125 transition-all z-50"
                    style={{ bottom: -6, left: -6 }}
                    onMouseDown={(e) =>
                      handleResizeMouseDown(e, layer.id, "sw")
                    }
                  />
                  <div
                    data-resize="ne"
                    className="absolute w-3 h-3 bg-white border-2 border-primary-500 rounded-full cursor-ne-resize hover:bg-primary-100 hover:scale-125 transition-all z-50"
                    style={{ top: -6, right: -6 }}
                    onMouseDown={(e) =>
                      handleResizeMouseDown(e, layer.id, "ne")
                    }
                  />
                  <div
                    data-resize="nw"
                    className="absolute w-3 h-3 bg-white border-2 border-primary-500 rounded-full cursor-nw-resize hover:bg-primary-100 hover:scale-125 transition-all z-50"
                    style={{ top: -6, left: -6 }}
                    onMouseDown={(e) =>
                      handleResizeMouseDown(e, layer.id, "nw")
                    }
                  />
                  <div
                    data-resize="n"
                    className="absolute w-3 h-3 bg-white border-2 border-secondary-500 rounded-full cursor-n-resize hover:bg-secondary-100 hover:scale-125 transition-all z-50"
                    style={{
                      top: -6,
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                    onMouseDown={(e) => handleResizeMouseDown(e, layer.id, "n")}
                  />
                  <div
                    data-resize="s"
                    className="absolute w-3 h-3 bg-white border-2 border-secondary-500 rounded-full cursor-s-resize hover:bg-secondary-100 hover:scale-125 transition-all z-50"
                    style={{
                      bottom: -6,
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                    onMouseDown={(e) => handleResizeMouseDown(e, layer.id, "s")}
                  />
                  <div
                    data-resize="w"
                    className="absolute w-3 h-3 bg-white border-2 border-secondary-500 rounded-full cursor-w-resize hover:bg-secondary-100 hover:scale-125 transition-all z-50"
                    style={{
                      left: -6,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                    onMouseDown={(e) => handleResizeMouseDown(e, layer.id, "w")}
                  />
                  <div
                    data-resize="e"
                    className="absolute w-3 h-3 bg-white border-2 border-secondary-500 rounded-full cursor-e-resize hover:bg-secondary-100 hover:scale-125 transition-all z-50"
                    style={{
                      right: -6,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                    onMouseDown={(e) => handleResizeMouseDown(e, layer.id, "e")}
                  />
                </>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {layers.length === 0 && !isPreviewMode && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-white/50">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
              <p className="text-sm">Nhập quote và nhấn "Thêm vào canvas"</p>
            </div>
          </div>
        )}

        {/* Preview mode indicator */}
        {isPreviewMode && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 rounded-full text-white text-xs font-medium">
            Preview
          </div>
        )}
      </div>
    );
  }
);

Canvas.displayName = "Canvas";

export default Canvas;
