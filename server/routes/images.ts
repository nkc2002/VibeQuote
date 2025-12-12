/**
 * GET /api/images/search
 *
 * Searches Unsplash for images via their API.
 * Implements server-side LRU caching with 5-minute TTL.
 *
 * Query Parameters:
 * - q: Search query (required)
 * - page: Page number (default: 1)
 * - per_page: Results per page (default: 20, max: 30)
 * - orientation: 'landscape' | 'portrait' | 'squarish' (optional)
 * - color: Color filter (optional)
 *
 * Response:
 * {
 *   results: [{ id, thumbUrl, regularUrl, photographer, download_location }],
 *   total: number,
 *   total_pages: number
 * }
 */

import { Router, Request, Response } from "express";
import LRUCache from "../utils/lru-cache";
import {
  sanitizeQuery,
  sanitizePage,
  sanitizePerPage,
  sanitizeOrientation,
  sanitizeColor,
} from "../utils/sanitize";

const router = Router();

// Initialize LRU cache: 100 entries max, 5 minute TTL
const imageCache = new LRUCache<ImageSearchResponse>(100, 5);

// Types
interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  width?: number;
  height?: number;
  color?: string;
  blur_hash?: string;
  description?: string | null;
  alt_description?: string | null;
  user: {
    name: string;
    username: string;
    profile_image?: {
      small: string;
    };
    links: {
      html: string;
    };
  };
  links: {
    html?: string;
    download_location: string;
  };
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

interface TransformedImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  description: string | null;
  alt_description: string | null;
  user: {
    name: string;
    username: string;
    profile_image: { small: string };
    links: { html: string };
  };
  links: {
    html: string;
    download: string;
  };
}

interface ImageSearchResponse {
  results: TransformedImage[];
  total: number;
  total_pages: number;
}

/**
 * Generate cache key from search parameters
 */
const getCacheKey = (
  query: string,
  page: number,
  perPage: number,
  orientation?: string,
  color?: string
): string => {
  return `search:${query}:${page}:${perPage}:${orientation || ""}:${
    color || ""
  }`;
};

/**
 * Transform Unsplash response to our format (preserve full data for frontend)
 */
const transformResponse = (
  data: UnsplashSearchResponse
): ImageSearchResponse => {
  return {
    results: data.results.map((photo) => ({
      id: photo.id,
      urls: photo.urls,
      width: photo.width || 1920,
      height: photo.height || 1080,
      color: photo.color || "#000000",
      blur_hash: photo.blur_hash || "",
      description: photo.description || null,
      alt_description: photo.alt_description || null,
      user: {
        name: photo.user.name,
        username: photo.user.username,
        profile_image: photo.user.profile_image || { small: "" },
        links: photo.user.links,
      },
      links: {
        html: photo.links.html || "",
        download: photo.links.download_location || "",
      },
    })),
    total: data.total,
    total_pages: data.total_pages,
  };
};

/**
 * GET /api/images/search
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    // Validate API key
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      console.error("UNSPLASH_ACCESS_KEY not configured");
      return res.status(500).json({
        error: "Image search service not configured",
        message: "Server is missing Unsplash API configuration",
      });
    }

    // Sanitize inputs
    const query = sanitizeQuery(req.query.q || req.query.query);
    const page = sanitizePage(req.query.page);
    const perPage = sanitizePerPage(req.query.per_page);
    const orientation = sanitizeOrientation(req.query.orientation);
    const color = sanitizeColor(req.query.color);

    // Validate required query
    if (!query) {
      return res.status(400).json({
        error: "Missing search query",
        message: 'Please provide a search query using the "q" parameter',
      });
    }

    // Check cache first
    const cacheKey = getCacheKey(query, page, perPage, orientation, color);
    const cached = imageCache.get(cacheKey);

    if (cached) {
      return res.json({
        ...cached,
        cached: true,
      });
    }

    // Build Unsplash API URL
    const unsplashUrl = new URL("https://api.unsplash.com/search/photos");
    unsplashUrl.searchParams.set("query", query);
    unsplashUrl.searchParams.set("page", page.toString());
    unsplashUrl.searchParams.set("per_page", perPage.toString());

    if (orientation) {
      unsplashUrl.searchParams.set("orientation", orientation);
    }
    if (color) {
      unsplashUrl.searchParams.set("color", color);
    }

    // Call Unsplash API
    const response = await fetch(unsplashUrl.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After") || "60";
      console.warn(`Unsplash rate limit hit. Retry after ${retryAfter}s`);

      return res.status(429).json({
        error: "Too many requests",
        message:
          "Image search is temporarily unavailable. Please try again in a minute.",
        retryAfter: parseInt(retryAfter, 10),
      });
    }

    // Handle other errors
    if (!response.ok) {
      console.error(
        `Unsplash API error: ${response.status} ${response.statusText}`
      );

      return res.status(response.status >= 500 ? 502 : response.status).json({
        error: "Image search failed",
        message: "Unable to fetch images. Please try again later.",
      });
    }

    // Parse and transform response
    const data: UnsplashSearchResponse = await response.json();
    const transformed = transformResponse(data);

    // Cache the result
    imageCache.set(cacheKey, transformed);

    // Return response
    return res.json({
      ...transformed,
      cached: false,
    });
  } catch (error) {
    console.error("Image search error:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred. Please try again.",
    });
  }
});

/**
 * GET /api/images/random
 * Returns a random image, optionally filtered by query
 */
router.get("/random", async (req: Request, res: Response) => {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return res.status(500).json({
        error: "Image search service not configured",
      });
    }

    const query = sanitizeQuery(req.query.query);

    const unsplashUrl = new URL("https://api.unsplash.com/photos/random");
    if (query) {
      unsplashUrl.searchParams.set("query", query);
    }
    unsplashUrl.searchParams.set("orientation", "landscape");

    const response = await fetch(unsplashUrl.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
    });

    if (response.status === 429) {
      return res.status(429).json({
        error: "Too many requests",
        message: "Please try again in a minute.",
      });
    }

    if (!response.ok) {
      return res.status(502).json({
        error: "Random image fetch failed",
      });
    }

    const photo: UnsplashPhoto = await response.json();

    return res.json({
      id: photo.id,
      urls: photo.urls,
      width: photo.width || 1920,
      height: photo.height || 1080,
      color: photo.color || "#000000",
      blur_hash: photo.blur_hash || "",
      description: photo.description || null,
      alt_description: photo.alt_description || null,
      user: {
        name: photo.user.name,
        username: photo.user.username,
        profile_image: photo.user.profile_image || { small: "" },
        links: photo.user.links,
      },
      links: {
        html: photo.links.html || "",
        download: photo.links.download_location || "",
      },
    });
  } catch (error) {
    console.error("Random image error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Export for testing
export { imageCache, getCacheKey, transformResponse };
export default router;
