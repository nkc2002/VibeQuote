/**
 * API Client for Backend Communication
 *
 * All API calls go through this client.
 * Handles credentials for httpOnly cookies.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

/**
 * Fetch wrapper with credentials and error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: ApiError; status: number }> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: "include", // Required for httpOnly cookies
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        error: data || { error: "Request failed", message: "Lỗi kết nối" },
        status: res.status,
      };
    }

    return { data, status: res.status };
  } catch (err) {
    return {
      error: {
        error: "Network error",
        message: "Lỗi kết nối, vui lòng thử lại",
      },
      status: 0,
    };
  }
}

// ============================================================
// Auth API
// ============================================================

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
}

export const authApi = {
  /**
   * Register new user
   */
  register: (data: RegisterRequest) =>
    apiCall<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Login
   */
  login: (data: LoginRequest) =>
    apiCall<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Get current user
   */
  me: () => apiCall<{ success: boolean; user: User }>("/api/auth/me"),

  /**
   * Logout
   */
  logout: () =>
    apiCall<{ success: boolean }>("/api/auth/logout", {
      method: "POST",
    }),

  /**
   * Forgot password
   */
  forgot: (email: string) =>
    apiCall<{ success: boolean; message: string }>("/api/auth/forgot", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  /**
   * Reset password
   */
  reset: (token: string, newPassword: string) =>
    apiCall<{ success: boolean; message: string }>("/api/auth/reset", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),
};

// ============================================================
// Videos API (Protected)
// ============================================================

export interface VideoRecord {
  id: string;
  quoteText: string;
  authorText: string;
  templateId: string;
  templateName: string;
  thumbnail?: string;
  videoUrl?: string;
  // Style parameters for consistent regeneration
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  boxOpacity?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  createdAt: number;
  updatedAt: number;
}

export interface CreateVideoRequest {
  quoteText: string;
  authorText?: string;
  templateId?: string;
  templateName?: string;
  thumbnail?: string;
  videoUrl?: string;
  // Style parameters
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  boxOpacity?: number;
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface VideoStats {
  total: number;
  today: number;
  thisWeek: number;
  downloadCount: number;
  favoriteTemplate: string | null;
}

export const videosApi = {
  /**
   * Get user's videos
   */
  list: () => apiCall<{ success: boolean; data: VideoRecord[] }>("/api/videos"),

  /**
   * Get a single video
   */
  get: (id: string) =>
    apiCall<{ success: boolean; data: VideoRecord }>(`/api/videos/${id}`),

  /**
   * Create a new video
   */
  create: (video: CreateVideoRequest) =>
    apiCall<{ success: boolean; data: VideoRecord }>("/api/videos", {
      method: "POST",
      body: JSON.stringify(video),
    }),

  /**
   * Update a video
   */
  update: (id: string, video: Partial<CreateVideoRequest>) =>
    apiCall<{ success: boolean; data: VideoRecord }>(`/api/videos/${id}`, {
      method: "PUT",
      body: JSON.stringify(video),
    }),

  /**
   * Delete a video
   */
  delete: (id: string) =>
    apiCall<{ success: boolean }>(`/api/videos/${id}`, {
      method: "DELETE",
    }),

  /**
   * Increment download count
   */
  incrementDownload: (id: string) =>
    apiCall<{ success: boolean; downloadCount: number }>(
      `/api/videos/download/${id}`,
      { method: "POST" }
    ),

  /**
   * Get video statistics
   */
  stats: () =>
    apiCall<{ success: boolean; data: VideoStats }>(
      "/api/videos/stats/summary"
    ),
};

// ============================================================
// Images API (Protected)
// ============================================================

export interface ImageResult {
  id: string;
  thumbUrl: string;
  regularUrl: string;
  photographer: string;
  photographerUrl: string;
}

export const imagesApi = {
  /**
   * Search images
   */
  search: (query: string, page = 1, perPage = 20) =>
    apiCall<{ results: ImageResult[]; total: number; total_pages: number }>(
      `/api/images/search?q=${encodeURIComponent(
        query
      )}&page=${page}&per_page=${perPage}`
    ),

  /**
   * Get random image
   */
  random: (query?: string) =>
    apiCall<ImageResult>(
      `/api/images/random${query ? `?query=${encodeURIComponent(query)}` : ""}`
    ),
};

export default {
  auth: authApi,
  videos: videosApi,
  images: imagesApi,
};
