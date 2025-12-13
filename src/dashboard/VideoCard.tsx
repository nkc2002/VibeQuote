/**
 * VideoCard Component - Simplified for Client-Side Export
 *
 * Displays saved video metadata:
 * - Unsplash thumbnail
 * - Quote text
 * - Template used
 * - Created date
 *
 * Note: Videos are generated in the Editor, not from Dashboard
 */

import { VideoRecord } from "../api";
import { formatDate } from "./db";

interface VideoCardProps {
  video: VideoRecord;
  onDelete: (video: VideoRecord) => void;
}

// SVG Icons
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

const VideoCard = ({ video, onDelete }: VideoCardProps) => {
  const handleDelete = () => {
    if (
      confirm(`Bạn có chắc muốn xóa "${video.quoteText.substring(0, 30)}..."?`)
    ) {
      onDelete(video);
    }
  };

  return (
    <article
      className="group relative bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden
                 shadow-lg shadow-slate-900/5 hover:shadow-xl hover:shadow-slate-900/10 
                 hover:-translate-y-1 transition-all duration-300"
      tabIndex={0}
      aria-label={`Quote: ${video.quoteText.substring(0, 50)}`}
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
            <ImageIcon className="w-12 h-12 text-white/60" />
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent 
                     opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />

        {/* Delete button - appears on hover */}
        <div
          className="absolute inset-0 flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-all duration-300 
                     translate-y-4 group-hover:translate-y-0"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-3.5 rounded-xl bg-white/15 backdrop-blur-md hover:bg-red-500/60 text-white 
                       border border-white/30 shadow-lg shadow-black/20
                       hover:scale-110 hover:border-red-300/50 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Xóa"
            title="Xóa"
          >
            <TrashIcon />
          </button>
        </div>

        {/* Template badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white/90 text-xs font-medium">
          {video.templateName}
        </div>
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
        </div>
      </div>
    </article>
  );
};

export default VideoCard;
