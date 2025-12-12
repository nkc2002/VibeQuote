import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import html2canvas from "html2canvas";
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

    // Expose captureAsDataURL method to parent via ref
    useImperativeHandle(ref, () => ({
      captureAsDataURL: async () => {
        if (!canvasRef.current) {
          throw new Error("Canvas element not found");
        }

        const canvas = await html2canvas(canvasRef.current, {
          useCORS: true,
          allowTaint: true,
          scale: 2, // Higher quality
          backgroundColor: null,
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
            {layer.text}
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
