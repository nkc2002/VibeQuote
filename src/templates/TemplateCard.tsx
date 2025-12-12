import { TemplateConfig, downloadTemplateJSON } from "./types";
import TemplatePreview from "./TemplatePreview";

interface TemplateCardProps {
  template: TemplateConfig;
  onEdit: (template: TemplateConfig) => void;
  onDelete?: (template: TemplateConfig) => void;
  onSelect?: (template: TemplateConfig) => void;
}

const TemplateCard = ({
  template,
  onEdit,
  onDelete,
  onSelect,
}: TemplateCardProps) => {
  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadTemplateJSON(template);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(template);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      onDelete &&
      confirm(`Bạn có chắc muốn xóa template "${template.name}"?`)
    ) {
      onDelete(template);
    }
  };

  return (
    <article
      className="group relative rounded-2xl bg-white border border-slate-200 overflow-hidden
                 shadow-sm hover:shadow-xl hover:scale-[1.02] 
                 transition-all duration-300 cursor-pointer"
      onClick={() => onSelect?.(template)}
      tabIndex={0}
      role="button"
      aria-label={`Template: ${template.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(template);
        }
      }}
    >
      {/* Preview */}
      <div className="relative aspect-video overflow-hidden">
        <TemplatePreview template={template} width={400} height={225} />

        {/* Hover overlay with actions */}
        <div
          className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-hidden="true"
        >
          <button
            onClick={handleEdit}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white 
                       transition-colors cursor-pointer"
            aria-label="Chỉnh sửa template"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={handleExport}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white 
                       transition-colors cursor-pointer"
            aria-label="Xuất JSON"
          >
            <svg
              className="w-5 h-5"
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
          </button>
          {template.isCustom && onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-red-500/50 hover:bg-red-500/70 text-white 
                         transition-colors cursor-pointer"
              aria-label="Xóa template"
            >
              <svg
                className="w-5 h-5"
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
            </button>
          )}
        </div>

        {/* Custom badge */}
        {template.isCustom && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-primary-500 text-white text-xs font-medium rounded-full">
            Custom
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-heading font-semibold text-slate-900 truncate">
            {template.name}
          </h3>
          <span className="text-xs text-slate-500 capitalize">
            {template.layout}
          </span>
        </div>
        <p className="text-sm text-slate-500 capitalize">{template.category}</p>
      </div>
    </article>
  );
};

export default TemplateCard;
