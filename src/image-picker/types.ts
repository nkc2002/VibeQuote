// Image Picker Types and API

export interface UnsplashImage {
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
    profile_image: {
      small: string;
    };
    links: {
      html: string;
    };
  };
  links: {
    html: string;
    download: string;
  };
}

export interface ImageSearchParams {
  query: string;
  page: number;
  perPage?: number;
  orientation?: "landscape" | "portrait" | "squarish" | "all";
  color?: string;
}

export interface ImageSearchResponse {
  results: UnsplashImage[];
  total: number;
  total_pages: number;
}

export interface ImagePickerState {
  query: string;
  images: UnsplashImage[];
  selectedImage: UnsplashImage | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  orientation: "landscape" | "portrait" | "squarish" | "all";
  color: string;
}

// Orientation options
export const ORIENTATION_OPTIONS: {
  value: ImageSearchParams["orientation"];
  label: string;
}[] = [
  { value: "all", label: "Tất cả" },
  { value: "landscape", label: "Ngang" },
  { value: "portrait", label: "Dọc" },
  { value: "squarish", label: "Vuông" },
];

// Color filter options
export const COLOR_OPTIONS = [
  { value: "", label: "Tất cả", color: "" },
  {
    value: "black_and_white",
    label: "Trắng đen",
    color: "linear-gradient(to right, #000 50%, #fff 50%)",
  },
  { value: "black", label: "Đen", color: "#000000" },
  { value: "white", label: "Trắng", color: "#FFFFFF" },
  { value: "yellow", label: "Vàng", color: "#FACC15" },
  { value: "orange", label: "Cam", color: "#FB923C" },
  { value: "red", label: "Đỏ", color: "#EF4444" },
  { value: "purple", label: "Tím", color: "#A855F7" },
  { value: "magenta", label: "Hồng", color: "#EC4899" },
  { value: "green", label: "Xanh lá", color: "#22C55E" },
  { value: "teal", label: "Xanh ngọc", color: "#14B8A6" },
  { value: "blue", label: "Xanh dương", color: "#3B82F6" },
];

// Default popular search queries for initial state
export const POPULAR_QUERIES = [
  "nature",
  "mountains",
  "ocean",
  "forest",
  "sky",
  "sunset",
  "city",
  "minimal",
];

// API helper - calls our backend proxy
export const searchImages = async (
  params: ImageSearchParams
): Promise<ImageSearchResponse> => {
  const { query, page, perPage = 20, orientation, color } = params;

  // Build query string
  const searchParams = new URLSearchParams({
    query: query || "nature",
    page: page.toString(),
    per_page: perPage.toString(),
  });

  if (orientation && orientation !== "all") {
    searchParams.set("orientation", orientation);
  }

  if (color) {
    searchParams.set("color", color);
  }

  // Call our backend API with credentials (auth required)
  const response = await fetch(
    `/api/images/search?${searchParams.toString()}`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Image search failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

// Get a random image
export const getRandomImage = async (
  query?: string
): Promise<UnsplashImage> => {
  const searchParams = new URLSearchParams();
  if (query) {
    searchParams.set("query", query);
  }

  const response = await fetch(
    `/api/images/random?${searchParams.toString()}`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(`Random image fetch failed: ${response.status}`);
  }

  return response.json();
};

// Fallback placeholder for broken images
export const FALLBACK_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+CiAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNlMmU4ZjAiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk0YTNiOCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPg==";
