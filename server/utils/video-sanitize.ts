/**
 * Text sanitization for FFmpeg drawtext filter
 * Escapes special characters that can break FFmpeg commands
 */

/**
 * Sanitize text for FFmpeg drawtext filter
 * Must escape: \ ' % : (and handle newlines)
 */
export const sanitizeTextForFFmpeg = (text: string): string => {
  if (!text || typeof text !== "string") {
    return "";
  }

  // Trim and limit length
  let sanitized = text.trim().substring(0, 500);

  // FFmpeg drawtext escape sequence:
  // 1. Escape backslashes first (\ -> \\)
  sanitized = sanitized.replace(/\\/g, "\\\\");

  // 2. Escape single quotes (' -> '\\'')
  // In FFmpeg, single quote needs to be: '\''
  sanitized = sanitized.replace(/'/g, "'\\''");

  // 3. Escape percent signs (% -> %%)
  sanitized = sanitized.replace(/%/g, "%%");

  // 4. Escape colons (: -> \\:)
  sanitized = sanitized.replace(/:/g, "\\:");

  // 5. Handle newlines - replace with FFmpeg line break
  sanitized = sanitized.replace(/\n/g, "\\n");
  sanitized = sanitized.replace(/\r/g, "");

  // 6. Remove null bytes and other control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return sanitized;
};

/**
 * Validate unsplash ID format
 * Unsplash IDs are alphanumeric with - and _
 */
export const validateUnsplashId = (id: unknown): string | null => {
  if (typeof id !== "string") {
    return null;
  }

  // Unsplash IDs are typically 11 characters, alphanumeric with - and _
  const sanitized = id.trim();
  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(sanitized)) {
    return null;
  }

  return sanitized;
};

/**
 * Validate template name
 */
export const validateTemplate = (template: unknown): string => {
  if (typeof template !== "string") {
    return "center";
  }

  const valid = ["center", "bottom", "top-left", "bottom-right"];
  return valid.includes(template) ? template : "center";
};

/**
 * Validate and sanitize style parameters
 */
export interface StyleParams {
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
  overlayOpacity?: number;
}

export const validateStyleParams = (params: unknown): StyleParams => {
  const defaults: StyleParams = {
    fontFamily: "Syne",
    fontSize: 32,
    textColor: "#FFFFFF",
    overlayOpacity: 0.4,
  };

  if (!params || typeof params !== "object") {
    return defaults;
  }

  const p = params as Record<string, unknown>;

  return {
    fontFamily:
      typeof p.fontFamily === "string"
        ? p.fontFamily.replace(/[^a-zA-Z0-9\s-]/g, "").substring(0, 50)
        : defaults.fontFamily,
    fontSize:
      typeof p.fontSize === "number" && p.fontSize >= 16 && p.fontSize <= 72
        ? Math.floor(p.fontSize)
        : defaults.fontSize,
    textColor:
      typeof p.textColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(p.textColor)
        ? p.textColor
        : defaults.textColor,
    overlayOpacity:
      typeof p.overlayOpacity === "number" &&
      p.overlayOpacity >= 0 &&
      p.overlayOpacity <= 1
        ? p.overlayOpacity
        : defaults.overlayOpacity,
  };
};

/**
 * Generate a deterministic hash for caching
 */
export const generateJobHash = (
  unsplashId: string,
  text: string,
  template: string,
  styleParams: StyleParams
): string => {
  const input = `${unsplashId}:${text}:${template}:${JSON.stringify(
    styleParams
  )}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};
