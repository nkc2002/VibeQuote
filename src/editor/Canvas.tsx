import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { TextLayer } from "./types";

interface CanvasProps {
  layers: TextLayer[];
  backgroundImage: string | null;
  backgroundGradient: string;
  boxOpacity: number;
  selectedLayerId: string | null;
  isPreviewMode: boolean;
  onSelectLayer: (id: string | null) => void;
  onMoveLayer: (id: string, x: number, y: number) => void;
  onResizeLayer?: (id: string, newFontSize: number) => void;
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
      onSelectLayer,
      onMoveLayer,
      onResizeLayer,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showSnapLines, setShowSnapLines] = useState({
      horizontal: false,
      vertical: false,
    });

    // Resize state
    const [resizing, setResizing] = useState<string | null>(null);
    const [resizeStart, setResizeStart] = useState<{
      mouseX: number;
      mouseY: number;
      fontSize: number;
      layerX: number;
      layerY: number;
      startRelX: number;
      startRelY: number;
      layerCenterX: number;
      layerCenterY: number;
    } | null>(null);

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
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();

        // Current mouse position relative to canvas
        const mouseRelX = e.clientX - rect.left;
        const mouseRelY = e.clientY - rect.top;

        // Calculate distance from layer center for scaling
        // If moving away from center (positive delta in dominant direction), scale up
        const startDistFromCenter = Math.sqrt(
          Math.pow(resizeStart.startRelX - resizeStart.layerCenterX, 2) +
            Math.pow(resizeStart.startRelY - resizeStart.layerCenterY, 2)
        );
        const currentDistFromCenter = Math.sqrt(
          Math.pow(mouseRelX - resizeStart.layerCenterX, 2) +
            Math.pow(mouseRelY - resizeStart.layerCenterY, 2)
        );

        if (startDistFromCenter === 0) return;

        // Scale factor based on distance from layer center
        const scaleFactor = currentDistFromCenter / startDistFromCenter;

        // Calculate new font size
        let newFontSize = Math.round(resizeStart.fontSize * scaleFactor);

        // Clamp between 12px and 200px
        newFontSize = Math.max(12, Math.min(200, newFontSize));

        onResizeLayer(resizing, newFontSize);
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
      (e: React.MouseEvent, layerId: string) => {
        if (isPreviewMode || !onResizeLayer) return;
        e.preventDefault();
        e.stopPropagation();

        const layer = layers.find((l) => l.id === layerId);
        if (!layer || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();

        // Calculate layer center in canvas coordinates
        const layerCenterX = (layer.x / 100) * rect.width;
        const layerCenterY = (layer.y / 100) * rect.height;

        // Mouse position relative to canvas
        const startRelX = e.clientX - rect.left;
        const startRelY = e.clientY - rect.top;

        setResizing(layerId);
        setResizeStart({
          mouseX: e.clientX,
          mouseY: e.clientY,
          fontSize: layer.fontSize,
          layerX: layer.x,
          layerY: layer.y,
          // New fields for proper calculation
          startRelX,
          startRelY,
          layerCenterX,
          layerCenterY,
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

        {/* Text layers */}
        {layers.map((layer) => (
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
              transform: "translate(-50%, -50%)",
              fontFamily: layer.fontFamily,
              fontSize: `${layer.fontSize}px`,
              color: layer.color,
              opacity: layer.opacity,
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              maxWidth: "80%",
              textAlign: "center",
              lineHeight: 1.4,
              zIndex: layer.isSelected ? 10 : 1,
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
            {/* Wrapper div for proper resize handle positioning */}
            <div className="relative inline-block">
              {layer.text}

              {/* Resize handles - only show on selected layer when not in preview mode */}
              {layer.isSelected && !isPreviewMode && onResizeLayer && (
                <>
                  {/* Corner handles - scale both dimensions */}
                  {/* SE corner (bottom-right) */}
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-primary-500 rounded-full cursor-se-resize hover:bg-primary-100 transition-colors z-50"
                    style={{ bottom: -8, right: -8 }}
                    onMouseDown={(e) => handleResizeMouseDown(e, layer.id)}
                    aria-label="Resize corner bottom-right"
                  />
                  {/* SW corner (bottom-left) */}
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-primary-500 rounded-full cursor-sw-resize hover:bg-primary-100 transition-colors z-50"
                    style={{ bottom: -8, left: -8 }}
                    onMouseDown={(e) => handleResizeMouseDown(e, layer.id)}
                    aria-label="Resize corner bottom-left"
                  />
                  {/* NE corner (top-right) */}
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-primary-500 rounded-full cursor-ne-resize hover:bg-primary-100 transition-colors z-50"
                    style={{ top: -8, right: -8 }}
                    onMouseDown={(e) => handleResizeMouseDown(e, layer.id)}
                    aria-label="Resize corner top-right"
                  />
                  {/* NW corner (top-left) */}
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-primary-500 rounded-full cursor-nw-resize hover:bg-primary-100 transition-colors z-50"
                    style={{ top: -8, left: -8 }}
                    onMouseDown={(e) => handleResizeMouseDown(e, layer.id)}
                    aria-label="Resize corner top-left"
                  />

                  {/* Edge handles - scale one dimension */}
                  {/* Top edge (north) */}
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-secondary-500 rounded-full cursor-n-resize hover:bg-secondary-100 transition-colors z-50"
                    style={{
                      top: -8,
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                    onMouseDown={(e) => handleResizeMouseDown(e, layer.id)}
                    aria-label="Resize edge top"
                  />
                  {/* Bottom edge (south) */}
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-secondary-500 rounded-full cursor-s-resize hover:bg-secondary-100 transition-colors z-50"
                    style={{
                      bottom: -8,
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                    onMouseDown={(e) => handleResizeMouseDown(e, layer.id)}
                    aria-label="Resize edge bottom"
                  />
                  {/* Left edge (west) */}
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-secondary-500 rounded-full cursor-w-resize hover:bg-secondary-100 transition-colors z-50"
                    style={{
                      left: -8,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                    onMouseDown={(e) => handleResizeMouseDown(e, layer.id)}
                    aria-label="Resize edge left"
                  />
                  {/* Right edge (east) */}
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-secondary-500 rounded-full cursor-e-resize hover:bg-secondary-100 transition-colors z-50"
                    style={{
                      right: -8,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                    onMouseDown={(e) => handleResizeMouseDown(e, layer.id)}
                    aria-label="Resize edge right"
                  />
                </>
              )}
            </div>
          </div>
        ))}

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
