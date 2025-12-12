import { useRef, useEffect, useState } from "react";
import { TemplateConfig } from "./types";

interface TemplatePreviewProps {
  template: TemplateConfig;
  width?: number;
  height?: number;
  sampleQuote?: string;
  sampleAuthor?: string;
  onThumbnailGenerated?: (dataUrl: string) => void;
}

const TemplatePreview = ({
  template,
  width = 320,
  height = 180,
  sampleQuote = '"Cuộc sống là hành trình, không phải đích đến."',
  sampleAuthor = "— Unknown",
  onThumbnailGenerated,
}: TemplatePreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background
      if (template.background.type === "solid") {
        ctx.fillStyle = template.background.value;
        ctx.fillRect(0, 0, width, height);
        drawContent();
      } else if (template.background.type === "gradient") {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        // Parse gradient colors (simplified)
        const gradientValue = template.background.value;
        const colorMatches = gradientValue.match(/#[a-fA-F0-9]{6}/g);
        if (colorMatches && colorMatches.length >= 2) {
          gradient.addColorStop(0, colorMatches[0]);
          gradient.addColorStop(1, colorMatches[colorMatches.length - 1]);
        } else {
          gradient.addColorStop(0, "#667eea");
          gradient.addColorStop(1, "#764ba2");
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        drawContent();
      } else if (template.background.type === "image") {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          setImageLoaded(true);
          drawContent();
        };
        img.onerror = () => {
          // Fallback to gray
          ctx.fillStyle = "#374151";
          ctx.fillRect(0, 0, width, height);
          drawContent();
        };
        img.src = template.background.value;
        return; // Wait for image to load
      }
    };

    const drawContent = () => {
      // Draw overlay if enabled
      if (template.overlay.enabled) {
        ctx.fillStyle = template.overlay.color;
        ctx.globalAlpha = template.overlay.opacity;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
      }

      // Calculate positions
      const paddingX = (template.spacing.paddingX / 100) * width;
      const paddingY = (template.spacing.paddingY / 100) * height;
      const textX = (template.textPosition.x / 100) * width;
      const textY = (template.textPosition.y / 100) * height;

      // Scale font size for thumbnail (approximately 1/6 of full size)
      const scaleFactor = width / 1920;
      const fontSize = Math.max(
        12,
        template.typography.fontSize * scaleFactor * 3
      );
      const authorFontSize = Math.max(
        8,
        template.authorTypography.fontSize * scaleFactor * 3
      );

      // Draw quote text
      ctx.fillStyle = template.typography.color;
      ctx.font = `600 ${fontSize}px ${
        template.typography.fontFamily.split(",")[0]
      }`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Word wrap
      const maxWidth = width - paddingX * 2;
      const words = sampleQuote.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      words.forEach((word) => {
        const testLine = currentLine + (currentLine ? " " : "") + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) lines.push(currentLine);

      // Draw lines
      const lineHeight = fontSize * template.typography.lineHeight;
      const totalTextHeight = lines.length * lineHeight;
      // Adjust startY to account for paddingY
      const adjustedTextY = Math.max(
        paddingY + totalTextHeight / 2,
        Math.min(textY, height - paddingY - totalTextHeight / 2)
      );
      let startY = adjustedTextY - totalTextHeight / 2;

      lines.forEach((line, index) => {
        ctx.fillText(line, textX, startY + index * lineHeight);
      });

      // Draw author
      ctx.fillStyle = template.authorTypography.color;
      ctx.font = `500 ${authorFontSize}px ${
        template.typography.fontFamily.split(",")[0]
      }`;
      const authorY =
        startY +
        lines.length * lineHeight +
        template.authorTypography.marginTop * scaleFactor;
      ctx.fillText(sampleAuthor, textX, authorY);

      // Generate thumbnail callback
      if (onThumbnailGenerated) {
        try {
          const dataUrl = canvas.toDataURL("image/png");
          onThumbnailGenerated(dataUrl);
        } catch (e) {
          console.error("Failed to generate thumbnail:", e);
        }
      }
    };

    render();
  }, [
    template,
    width,
    height,
    sampleQuote,
    sampleAuthor,
    onThumbnailGenerated,
    imageLoaded,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg shadow-md"
      style={{ width: "100%", height: "auto", aspectRatio: "16/9" }}
    />
  );
};

export default TemplatePreview;
