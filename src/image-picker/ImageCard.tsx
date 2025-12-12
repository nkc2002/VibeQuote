import { useState } from "react";
import { UnsplashImage, FALLBACK_IMAGE } from "./types";

interface ImageCardProps {
  image: UnsplashImage;
  isSelected: boolean;
  onSelect: (image: UnsplashImage) => void;
}

const ImageCard = ({ image, isSelected, onSelect }: ImageCardProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <button
      onClick={() => onSelect(image)}
      className={`group relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer
                 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                 ${
                   isSelected
                     ? "ring-2 ring-primary-500 ring-offset-2 scale-[0.98]"
                     : "hover:scale-[0.98]"
                 }`}
      style={{ backgroundColor: image.color || "#e2e8f0" }}
      aria-label={`Select image: ${
        image.alt_description || image.description || "Unsplash image"
      }`}
      aria-pressed={isSelected}
    >
      {/* Placeholder / Loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-slate-200" />
      )}

      {/* Image */}
      <img
        src={hasError ? FALLBACK_IMAGE : image.urls.small}
        alt={image.alt_description || image.description || "Image"}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300
          ${isLoaded || hasError ? "opacity-100" : "opacity-0"}`}
      />

      {/* Hover overlay with photographer credit */}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <a
          href={image.links.html}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white 
                       transition-colors cursor-pointer backdrop-blur-sm"
          aria-label="Xem trên Unsplash"
          title="Xem trên Unsplash"
        >
          <svg
            className="w-6 h-6"
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
        </a>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </button>
  );
};

export default ImageCard;
