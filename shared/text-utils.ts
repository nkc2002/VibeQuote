/**
 * Shared Text Utilities
 *
 * This module provides text processing utilities that work in both
 * Frontend (browser) and Backend (Node.js) environments.
 *
 * ES Module - can be imported in both FE and BE
 */

// ============================================================
// FRONTEND: Text Wrapping (Canvas2D)
// ============================================================

/**
 * Wrap text to fit within a maximum width using Canvas 2D measurement.
 *
 * @param text - The text to wrap
 * @param fontSpec - CSS font specification (e.g., "32px Syne" or "bold 24px Arial")
 * @param maxWidth - Maximum width in pixels
 * @returns Wrapped text with \n line breaks, truncated to 120 chars
 *
 * @example
 * const wrapped = wrapTextToWidth("Long quote text here", "32px Syne", 400);
 * // Returns: "Long quote\ntext here"
 */
export function wrapTextToWidth(
  text: string,
  fontSpec: string = "32px sans-serif",
  maxWidth: number = 400
): string {
  // Handle empty/invalid input
  if (!text || typeof text !== "string") {
    return "";
  }

  // Sanitize and prepare text
  let cleanText = text.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Truncate to 120 characters max
  const MAX_CHARS = 120;
  if (cleanText.length > MAX_CHARS) {
    cleanText = cleanText.substring(0, MAX_CHARS - 3) + "...";
  }

  // Check if we're in a browser environment with Canvas support
  if (
    typeof document === "undefined" ||
    typeof HTMLCanvasElement === "undefined"
  ) {
    // Fallback for Node.js: simple character-based wrapping
    return wrapTextSimple(cleanText, Math.floor(maxWidth / 10));
  }

  try {
    // Create canvas for text measurement
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return wrapTextSimple(cleanText, Math.floor(maxWidth / 10));
    }

    ctx.font = fontSpec;

    const lines: string[] = [];

    // Process each paragraph (existing line breaks)
    const paragraphs = cleanText.split("\n");

    for (const paragraph of paragraphs) {
      if (paragraph.trim() === "") {
        lines.push("");
        continue;
      }

      const words = paragraph.split(/\s+/);
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }
    }

    return lines.join("\n");
  } catch (error) {
    // Fallback if Canvas fails
    console.warn("Canvas text measurement failed, using fallback:", error);
    return wrapTextSimple(cleanText, Math.floor(maxWidth / 10));
  }
}

/**
 * Simple character-based text wrapping (fallback for non-browser environments)
 */
function wrapTextSimple(text: string, charsPerLine: number): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length + word.length + 1 > charsPerLine && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join("\n");
}

// ============================================================
// BACKEND: FFmpeg Text Sanitization
// ============================================================

/**
 * Sanitize text for use in FFmpeg drawtext filter.
 *
 * Escapes special characters that can break FFmpeg commands:
 * - \ (backslash) -> \\
 * - ' (single quote) -> '\''
 * - % (percent) -> %%
 * - : (colon) -> \:
 * - , (comma) -> \,
 *
 * Also:
 * - Normalizes all newlines to \n
 * - Removes control characters
 * - Limits length to 500 characters
 *
 * @param wrappedText - Text with \n line breaks from wrapTextToWidth
 * @returns Sanitized text safe for FFmpeg
 *
 * @example
 * sanitizeTextForFFmpeg("It's 100% fun: enjoy")
 * // Returns: "It'\''s 100%% fun\: enjoy"
 */
export function sanitizeTextForFFmpeg(wrappedText: string): string {
  if (!wrappedText || typeof wrappedText !== "string") {
    return "";
  }

  // Limit length
  const MAX_LENGTH = 500;
  let sanitized = wrappedText.substring(0, MAX_LENGTH);

  // 1. Normalize newlines first
  sanitized = sanitized.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. Remove null bytes and control characters (except newline and tab)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 3. Escape backslashes FIRST (before other escapes add more backslashes)
  sanitized = sanitized.replace(/\\/g, "\\\\");

  // 4. Escape single quotes for FFmpeg shell ('' -> '\'')
  // In FFmpeg drawtext, single quote needs: '\''
  sanitized = sanitized.replace(/'/g, "'\\''");

  // 5. Escape percent signs (% -> %%)
  sanitized = sanitized.replace(/%/g, "%%");

  // 6. Escape colons (: -> \:)
  sanitized = sanitized.replace(/:/g, "\\:");

  // 7. Escape commas (, -> \,)
  sanitized = sanitized.replace(/,/g, "\\,");

  // 8. Convert newlines to FFmpeg escape sequence
  sanitized = sanitized.replace(/\n/g, "\\n");

  return sanitized;
}

// ============================================================
// Additional Utilities
// ============================================================

/**
 * Count actual display characters (useful for UI previews)
 */
export function countDisplayChars(text: string): number {
  if (!text) return 0;
  // Remove escape sequences for counting
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\:/g, ":")
    .replace(/\\,/g, ",")
    .replace(/%%/g, "%")
    .replace(/'\\''}/g, "'").length;
}

/**
 * Preview text as it would appear (unescape for display)
 */
export function unescapeForPreview(sanitizedText: string): string {
  if (!sanitizedText) return "";

  return sanitizedText
    .replace(/\\n/g, "\n")
    .replace(/\\:/g, ":")
    .replace(/\\,/g, ",")
    .replace(/%%/g, "%")
    .replace(/'\\''}/g, "'")
    .replace(/\\\\/g, "\\");
}

// Default export for convenience
export default {
  wrapTextToWidth,
  sanitizeTextForFFmpeg,
  countDisplayChars,
  unescapeForPreview,
};
