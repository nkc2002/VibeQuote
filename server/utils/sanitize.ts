/**
 * Input sanitization utilities
 */

// Allowed orientation values
const VALID_ORIENTATIONS = ["landscape", "portrait", "squarish"] as const;
type Orientation = (typeof VALID_ORIENTATIONS)[number];

// Allowed color values
const VALID_COLORS = [
  "black_and_white",
  "black",
  "white",
  "yellow",
  "orange",
  "red",
  "purple",
  "magenta",
  "green",
  "teal",
  "blue",
] as const;
type Color = (typeof VALID_COLORS)[number];

/**
 * Sanitize search query string
 * - Trim whitespace
 * - Remove special characters that could cause issues
 * - Limit length
 */
export const sanitizeQuery = (query: unknown): string => {
  if (typeof query !== "string") {
    return "";
  }

  // Trim and limit length
  let sanitized = query.trim().substring(0, 100);

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>{}[\]\\]/g, "");

  // Replace multiple spaces with single space
  sanitized = sanitized.replace(/\s+/g, " ");

  return sanitized;
};

/**
 * Sanitize page number
 * - Must be positive integer
 * - Default to 1 if invalid
 */
export const sanitizePage = (page: unknown): number => {
  if (typeof page === "string") {
    const parsed = parseInt(page, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 1000) {
      return parsed;
    }
  }
  if (typeof page === "number" && page > 0 && page <= 1000) {
    return Math.floor(page);
  }
  return 1;
};

/**
 * Sanitize per_page value
 * - Must be between 1 and 30
 * - Default to 20 if invalid
 */
export const sanitizePerPage = (perPage: unknown): number => {
  if (typeof perPage === "string") {
    const parsed = parseInt(perPage, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 30) {
      return parsed;
    }
  }
  if (typeof perPage === "number" && perPage >= 1 && perPage <= 30) {
    return Math.floor(perPage);
  }
  return 20;
};

/**
 * Sanitize orientation value
 * - Must be one of allowed values
 * - Return undefined if invalid
 */
export const sanitizeOrientation = (
  orientation: unknown
): Orientation | undefined => {
  if (typeof orientation === "string") {
    const lower = orientation.toLowerCase() as Orientation;
    if (VALID_ORIENTATIONS.includes(lower)) {
      return lower;
    }
  }
  return undefined;
};

/**
 * Sanitize color value
 * - Must be one of allowed values
 * - Return undefined if invalid
 */
export const sanitizeColor = (color: unknown): Color | undefined => {
  if (typeof color === "string") {
    const lower = color.toLowerCase() as Color;
    if (VALID_COLORS.includes(lower)) {
      return lower;
    }
  }
  return undefined;
};

export { VALID_ORIENTATIONS, VALID_COLORS };
export type { Orientation, Color };
