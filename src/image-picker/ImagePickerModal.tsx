/**
 * Premium Image Picker Modal - Unsplash Integration
 *
 * Features:
 * - Debounced search (300ms)
 * - Responsive: 420px desktop, 360px tablet, fullscreen mobile
 * - Orientation & color filters with accessible chips
 * - Infinite scroll with skeleton loaders
 * - Focus trap & keyboard navigation
 * - Random image with subtle animation
 * - Photographer credit on hover
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  UnsplashImage,
  ImageSearchParams,
  searchImages,
  getRandomImage,
  COLOR_OPTIONS,
  POPULAR_QUERIES,
} from "./types";

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (unsplashId: string, imageUrl: string) => void;
  initialQuery?: string;
}

// Debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

// SVG Icons
const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const CloseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const SpinnerIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const ShuffleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const ExternalLinkIcon = ({
  className = "w-4 h-4",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

const ImageIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

// Suggested tags for empty state
const SUGGESTED_TAGS = [
  "minimal",
  "nature",
  "gradient",
  "texture",
  "abstract",
  "beach",
];

const ImagePickerModal = ({
  isOpen,
  onClose,
  onSelect,
  initialQuery = "",
}: ImagePickerModalProps) => {
  // State
  const [query, setQuery] = useState(initialQuery);
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<UnsplashImage | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [showRandomPulse, setShowRandomPulse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [orientation, setOrientation] =
    useState<ImageSearchParams["orientation"]>("all");
  const [color, setColor] = useState("");
  const [isSelectionSuccess, setIsSelectionSuccess] = useState(false);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced query for auto-search
  const debouncedQuery = useDebounce(query, 300);

  // Load images with abort controller
  const loadImages = useCallback(
    async (params: ImageSearchParams, append = false) => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setIsSearching(true);
        setError(null);
      }

      try {
        const response = await searchImages(params);

        if (append) {
          setImages((prev) => [...prev, ...response.results]);
        } else {
          setImages(response.results);
        }

        setTotalPages(response.total_pages);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        const errorMessage =
          err instanceof Error ? err.message : "Failed to load images";
        setError(errorMessage);

        // Fallback to mock data for development
        if (!append && images.length === 0) {
          setImages(getMockImages());
          setError("API unavailable - showing sample images");
        }
      } finally {
        setIsLoading(false);
        setIsSearching(false);
        setIsLoadingMore(false);
      }
    },
    [images.length]
  );

  // Initial load
  useEffect(() => {
    if (isOpen) {
      const initialSearchQuery =
        initialQuery ||
        POPULAR_QUERIES[Math.floor(Math.random() * POPULAR_QUERIES.length)];
      setQuery(initialSearchQuery);
      setPage(1);
      setSelectedImage(null);
      loadImages({ query: initialSearchQuery, page: 1, orientation, color });

      // Focus search input
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Debounced search effect
  useEffect(() => {
    if (!isOpen || !debouncedQuery.trim()) return;

    // Don't trigger on initial load
    if (debouncedQuery === initialQuery && images.length > 0) return;

    setPage(1);
    setSelectedImage(null);
    loadImages({ query: debouncedQuery.trim(), page: 1, orientation, color });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // Filter change handler
  const handleFilterChange = (
    newOrientation: typeof orientation,
    newColor: string
  ) => {
    setOrientation(newOrientation);
    setColor(newColor);
    setPage(1);
    setSelectedImage(null);
    loadImages({
      query: query || "nature",
      page: 1,
      orientation: newOrientation,
      color: newColor,
    });
  };

  // Infinite scroll
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || isLoadingMore || page >= totalPages) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadImages(
        { query: query || "nature", page: nextPage, orientation, color },
        true
      );
    }
  };

  // Random image handler
  const handleRandomize = async () => {
    setIsRandomizing(true);
    setError(null);

    try {
      const randomImage = await getRandomImage(query || undefined);
      setImages((prev) => {
        if (prev.some((img) => img.id === randomImage.id)) return prev;
        return [randomImage, ...prev];
      });
      setSelectedImage(randomImage);
      setShowRandomPulse(true);
      setTimeout(() => setShowRandomPulse(false), 600);

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      if (images.length > 0) {
        const randomIndex = Math.floor(Math.random() * images.length);
        setSelectedImage(images[randomIndex]);
        setShowRandomPulse(true);
        setTimeout(() => setShowRandomPulse(false), 600);
      } else {
        setError("Could not get random image");
      }
    } finally {
      setIsRandomizing(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    modal.addEventListener("keydown", handleTab);
    return () => modal.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  // Select image (keep modal open)
  const handleSelectImage = () => {
    if (selectedImage) {
      onSelect(selectedImage.id, selectedImage.urls.regular);
      setIsSelectionSuccess(true);
      setTimeout(() => setIsSelectionSuccess(false), 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-picker-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-[420px] 
                   max-h-[85dvh]
                   bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col
                   animate-[fadeInUp_0.2s_ease-out]"
      >
        {/* ========== Header ========== */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="image-picker-title"
              className="font-heading font-bold text-lg text-slate-900"
            >
              Chọn ảnh nền
            </h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100
                        transition-colors duration-150 cursor-pointer"
              aria-label="Đóng"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mb-4">
            <label htmlFor="image-search" className="sr-only">
              Tìm ảnh
            </label>
            <input
              ref={searchInputRef}
              id="image-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm ảnh (ví dụ: minimal, beach...)"
              className="w-full pl-11 pr-10 py-3 text-slate-900 bg-slate-50 
                        border-2 border-slate-200 rounded-xl
                        placeholder:text-slate-400
                        focus:outline-none focus:border-primary-400 focus:bg-white
                        transition-colors duration-150"
            />
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            {isSearching && (
              <SpinnerIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500 animate-spin" />
            )}
          </div>

          {/* Color Filter */}
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">
              Màu sắc
            </span>
            <div className="flex gap-2 items-center flex-wrap">
              {/* Clear color button */}
              <button
                onClick={() => handleFilterChange(orientation, "")}
                aria-pressed={color === ""}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer
                  min-h-[36px]
                  ${
                    color === ""
                      ? "bg-slate-200 text-slate-700"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
              >
                Tất cả
              </button>

              {/* Color swatches */}
              {COLOR_OPTIONS.slice(1).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleFilterChange(orientation, opt.value)}
                  aria-pressed={color === opt.value}
                  aria-label={`Lọc theo màu ${opt.label}`}
                  title={opt.label}
                  className={`relative w-8 h-8 rounded-full transition-all duration-150 cursor-pointer
                    flex items-center justify-center
                    ${
                      color === opt.value
                        ? "ring-2 ring-primary-500 ring-offset-2 scale-110"
                        : "hover:scale-105"
                    }`}
                  style={{
                    background:
                      opt.color || "linear-gradient(135deg, #667eea, #764ba2)",
                  }}
                >
                  {color === opt.value && (
                    <CheckIcon className="w-4 h-4 text-white drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ========== Content / Grid ========== */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 min-h-[200px]"
        >
          {/* Error message */}
          {error && (
            <div
              className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2"
              role="alert"
            >
              <svg
                className="w-5 h-5 text-amber-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm text-amber-800">{error}</p>
            </div>
          )}

          {/* Loading state - skeletons */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] rounded-xl bg-slate-200 animate-pulse"
                />
              ))}
            </div>
          ) : images.length === 0 ? (
            /* Empty state */
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mb-1">
                Không tìm thấy ảnh
              </p>
              <p className="text-sm text-slate-400 mb-4">Thử từ khóa khác</p>

              {/* Suggested tags */}
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg
                              hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Image grid */}
              <div className="grid grid-cols-2 gap-3">
                {images.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(image)}
                    className={`group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer
                               transition-all duration-150
                               focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                               ${
                                 selectedImage?.id === image.id
                                   ? "ring-2 ring-primary-500 ring-offset-2"
                                   : "hover:shadow-lg hover:scale-[1.02]"
                               }
                               ${
                                 showRandomPulse &&
                                 selectedImage?.id === image.id
                                   ? "animate-pulse"
                                   : ""
                               }`}
                    style={{ backgroundColor: image.color || "#e2e8f0" }}
                    aria-label={
                      image.alt_description ||
                      image.description ||
                      "Unsplash image"
                    }
                    aria-pressed={selectedImage?.id === image.id}
                  >
                    {/* Image */}
                    <img
                      src={`${image.urls.small}&w=320`}
                      alt={image.alt_description || image.description || ""}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />

                    {/* Photographer credit on hover */}
                    <div
                      className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-2 pt-6"
                    >
                      <a
                        href={image.links.html}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-white/90 hover:text-white transition-colors"
                      >
                        <span className="truncate">
                          {image.user?.name || "Photographer"}
                        </span>
                        <ExternalLinkIcon className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>

                    {/* Selected indicator */}
                    {selectedImage?.id === image.id && (
                      <div
                        className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full 
                                      flex items-center justify-center shadow-sm"
                      >
                        <CheckIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Loading more indicator */}
              {isLoadingMore && (
                <div className="flex justify-center py-6">
                  <SpinnerIcon className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
              )}

              {/* End of results */}
              {page >= totalPages && images.length > 0 && (
                <p className="text-center text-xs text-slate-400 py-4">
                  Hiển thị {images.length} ảnh
                </p>
              )}
            </>
          )}
        </div>

        {/* ========== Footer ========== */}
        <div
          className="flex-shrink-0 flex items-center justify-between gap-3 px-4 pt-5 pb-6
                        border-t border-slate-100 bg-white z-10"
        >
          {/* Random button */}
          <button
            onClick={handleRandomize}
            disabled={isRandomizing || isLoading}
            className="flex items-center justify-center gap-2 px-3 h-10
                      text-slate-600 hover:text-slate-800 hover:bg-white
                      rounded-xl font-medium transition-all duration-150 cursor-pointer
                      disabled:opacity-50 disabled:cursor-not-allowed
                      border border-slate-200 hover:border-slate-300 whitespace-nowrap"
          >
            <ShuffleIcon
              className={`w-5 h-5 ${isRandomizing ? "animate-spin" : ""}`}
            />
            <span>Ngẫu nhiên</span>
          </button>

          {/* Select button */}
          <button
            onClick={handleSelectImage}
            disabled={!selectedImage || isSelectionSuccess}
            className={`flex-1 sm:flex-none px-4 h-10
                      font-semibold rounded-xl whitespace-nowrap
                      transition-all duration-150 cursor-pointer
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                      ${
                        isSelectionSuccess
                          ? "bg-green-500 text-white shadow-none"
                          : "bg-gradient-to-r from-primary-500 to-cta-500 text-white hover:shadow-lg hover:shadow-primary-500/25"
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none`}
          >
            {isSelectionSuccess ? (
              <span className="flex items-center gap-2">
                <CheckIcon className="w-5 h-5" />
                Đã chọn
              </span>
            ) : (
              "Chọn ảnh"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Mock images for development/fallback
const getMockImages = (): UnsplashImage[] => [
  {
    id: "mock-1",
    urls: {
      raw: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
      full: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920",
      regular:
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1080",
      small:
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400",
      thumb:
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200",
    },
    width: 1920,
    height: 1280,
    color: "#2B3D4F",
    blur_hash: "LNF5?;01IUt7~qt7ozof9GWBoffQ",
    alt_description: "Green mountain landscape",
    description: "Beautiful mountain scenery",
    user: {
      name: "Photographer",
      username: "photo",
      profile_image: {
        small:
          "https://images.unsplash.com/placeholder-avatars/extra-large.jpg",
      },
      links: { html: "https://unsplash.com/@photo" },
    },
    links: {
      html: "https://unsplash.com",
      download: "https://unsplash.com/photos/mock-1/download",
    },
  },
  {
    id: "mock-2",
    urls: {
      raw: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      full: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920",
      regular:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080",
      small:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400",
      thumb:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200",
    },
    width: 1920,
    height: 1280,
    color: "#F5E6D3",
    blur_hash: "LNF5?;01IUt7~qt7ozof9GWBoffQ",
    alt_description: "Tropical beach",
    description: "Sandy beach with palm trees",
    user: {
      name: "Beach Lover",
      username: "beach",
      profile_image: {
        small:
          "https://images.unsplash.com/placeholder-avatars/extra-large.jpg",
      },
      links: { html: "https://unsplash.com/@beach" },
    },
    links: {
      html: "https://unsplash.com",
      download: "https://unsplash.com/photos/mock-2/download",
    },
  },
  {
    id: "mock-3",
    urls: {
      raw: "https://images.unsplash.com/photo-1557683316-973673baf926",
      full: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1920",
      regular:
        "https://images.unsplash.com/photo-1557683316-973673baf926?w=1080",
      small: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400",
      thumb: "https://images.unsplash.com/photo-1557683316-973673baf926?w=200",
    },
    width: 1920,
    height: 1080,
    color: "#667eea",
    blur_hash: "LNF5?;01IUt7~qt7ozof9GWBoffQ",
    alt_description: "Purple gradient",
    description: "Abstract gradient background",
    user: {
      name: "Designer",
      username: "design",
      profile_image: {
        small:
          "https://images.unsplash.com/placeholder-avatars/extra-large.jpg",
      },
      links: { html: "https://unsplash.com/@design" },
    },
    links: {
      html: "https://unsplash.com",
      download: "https://unsplash.com/photos/mock-3/download",
    },
  },
  {
    id: "mock-4",
    urls: {
      raw: "https://images.unsplash.com/photo-1518837695005-2083093ee35b",
      full: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920",
      regular:
        "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1080",
      small:
        "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400",
      thumb:
        "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=200",
    },
    width: 1920,
    height: 1280,
    color: "#1E3A5F",
    blur_hash: "LNF5?;01IUt7~qt7ozof9GWBoffQ",
    alt_description: "Ocean waves",
    description: "Deep blue ocean",
    user: {
      name: "Ocean Fan",
      username: "ocean",
      profile_image: {
        small:
          "https://images.unsplash.com/placeholder-avatars/extra-large.jpg",
      },
      links: { html: "https://unsplash.com/@ocean" },
    },
    links: {
      html: "https://unsplash.com",
      download: "https://unsplash.com/photos/mock-4/download",
    },
  },
  {
    id: "mock-5",
    urls: {
      raw: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07",
      full: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1920",
      regular:
        "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1080",
      small:
        "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=400",
      thumb:
        "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=200",
    },
    width: 1920,
    height: 1280,
    color: "#FF6B35",
    blur_hash: "LNF5?;01IUt7~qt7ozof9GWBoffQ",
    alt_description: "Orange flowers",
    description: "Bright orange flowers",
    user: {
      name: "Flower Lover",
      username: "flower",
      profile_image: {
        small:
          "https://images.unsplash.com/placeholder-avatars/extra-large.jpg",
      },
      links: { html: "https://unsplash.com/@flower" },
    },
    links: {
      html: "https://unsplash.com",
      download: "https://unsplash.com/photos/mock-5/download",
    },
  },
  {
    id: "mock-6",
    urls: {
      raw: "https://images.unsplash.com/photo-1490750967868-88aa4486c946",
      full: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1920",
      regular:
        "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1080",
      small:
        "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400",
      thumb:
        "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=200",
    },
    width: 1920,
    height: 1280,
    color: "#FFEAA7",
    blur_hash: "LNF5?;01IUt7~qt7ozof9GWBoffQ",
    alt_description: "Yellow sunflower field",
    description: "Bright sunflower field",
    user: {
      name: "Nature Lover",
      username: "nature",
      profile_image: {
        small:
          "https://images.unsplash.com/placeholder-avatars/extra-large.jpg",
      },
      links: { html: "https://unsplash.com/@nature" },
    },
    links: {
      html: "https://unsplash.com",
      download: "https://unsplash.com/photos/mock-6/download",
    },
  },
];

export default ImagePickerModal;
