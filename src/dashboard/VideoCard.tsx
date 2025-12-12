/**
 * VideoCard Component - Premium UI
 *
 * Features:
 * - Glassmorphism card design
 * - Smooth hover animations
 * - Gradient overlay on thumbnail
 * - Download and delete buttons
 */

import { useState } from "react";
import { VideoRecord } from "../api";
import { formatDate } from "./db";

interface VideoCardProps {
  video: VideoRecord;
  onDownload: (video: VideoRecord) => Promise<void>;
  onDelete: (video: VideoRecord) => void;
}

// SVG Icons
const DownloadIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
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
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const TrashIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
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
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const VideoIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
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
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
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

const VideoCard = ({ video, onDownload, onDelete }: VideoCardProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDelete = () => {
    if (
      confirm(
        `Bạn có chắc muốn xóa video "${video.quoteText.substring(0, 30)}..."?`
      )
    ) {
      onDelete(video);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      await onDownload(video);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <article
      className="group relative bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden
                 shadow-lg shadow-slate-900/5 hover:shadow-xl hover:shadow-slate-900/10 
                 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      tabIndex={0}
      aria-label={`Video: ${video.quoteText.substring(0, 50)}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={`Thumbnail: ${video.quoteText.substring(0, 30)}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500/90 to-cta-500/90">
            <VideoIcon className="w-12 h-12 text-white/60" />
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent 
                     opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />

        {/* Action buttons - appear on hover */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-4
                     opacity-0 group-hover:opacity-100 transition-all duration-300 
                     translate-y-4 group-hover:translate-y-0"
        >
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-3.5 rounded-xl bg-white/15 backdrop-blur-md hover:bg-primary-500/60 text-white 
                       border border-white/30 shadow-lg shadow-black/20
                       hover:scale-110 hover:border-primary-300/50 active:scale-95 transition-all duration-200 cursor-pointer
                       disabled:opacity-50 disabled:cursor-wait disabled:hover:scale-100"
            aria-label="Tải xuống video"
            title="Tải xuống"
          >
            {isDownloading ? (
              <SpinnerIcon className="w-5 h-5 animate-spin" />
            ) : (
              <DownloadIcon />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-3.5 rounded-xl bg-white/15 backdrop-blur-md hover:bg-red-500/60 text-white 
                       border border-white/30 shadow-lg shadow-black/20
                       hover:scale-110 hover:border-red-300/50 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Xóa video"
            title="Xóa"
          >
            <TrashIcon />
          </button>
        </div>

        {/* Template badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white/90 text-xs font-medium">
          {video.templateName}
        </div>

        {/* Downloading overlay */}
        {isDownloading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
            <SpinnerIcon className="w-8 h-8 text-white animate-spin" />
            <span className="text-white text-sm font-medium">Đang tạo...</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p
          className="text-sm font-medium text-slate-800 line-clamp-2 mb-1.5 leading-relaxed"
          title={video.quoteText}
        >
          "{video.quoteText}"
        </p>
        {video.authorText && (
          <p className="text-xs text-slate-500 mb-3 font-medium">
            — {video.authorText}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            {formatDate(video.createdAt)}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-slate-400">Ready</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default VideoCard;
