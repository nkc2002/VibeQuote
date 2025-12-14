interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  isPreviewMode: boolean;
  isGenerating: boolean;
  isAnimating?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onTogglePreview: () => void;
  onPreviewAnimation: () => void;
  onGenerate: () => void;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
}

const Toolbar = ({
  canUndo,
  canRedo,
  isPreviewMode: _isPreviewMode,
  isGenerating,
  isAnimating,
  onUndo,
  onRedo,
  onTogglePreview: _onTogglePreview,
  onPreviewAnimation,
  onGenerate,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  leftSidebarOpen,
  rightSidebarOpen,
}: ToolbarProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
      {/* Left section */}
      <div className="flex items-center gap-2">
        {/* Mobile sidebar toggle - Left */}
        <button
          onClick={onToggleLeftSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 
                    transition-colors cursor-pointer"
          aria-label={leftSidebarOpen ? "Đóng panel Quote" : "Mở panel Quote"}
          aria-expanded={leftSidebarOpen}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h8m-8 6h16"
            />
          </svg>
        </button>

        {/* Logo */}
        <a href="/" className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-cta-500 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="hidden sm:block font-heading font-bold text-white">
            VibeQuote
          </span>
        </a>
      </div>

      {/* Center section - Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-colors cursor-pointer"
          aria-label="Hoàn tác (Ctrl+Z)"
          title="Undo (Ctrl+Z)"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        </button>

        {/* Redo */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-colors cursor-pointer"
          aria-label="Làm lại (Ctrl+Y)"
          title="Redo (Ctrl+Y)"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
            />
          </svg>
        </button>

        <div
          className="w-px h-6 bg-slate-700 mx-1 sm:mx-2"
          aria-hidden="true"
        />

        {/* Preview button - Play/Stop toggle */}
        <button
          onClick={onPreviewAnimation}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer
            ${
              isAnimating
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          aria-label={isAnimating ? "Stop preview" : "Start preview"}
        >
          {isAnimating ? (
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          <span className="hidden sm:inline text-sm font-medium">
            {isAnimating ? "Stop" : "Preview"}
          </span>
        </button>

        <div
          className="w-px h-6 bg-slate-700 mx-1 sm:mx-2"
          aria-hidden="true"
        />

        {/* Generate button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg
                    bg-gradient-to-r from-primary-500 to-cta-500 text-white font-medium
                    hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200 cursor-pointer
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          aria-label="Tạo video"
          aria-busy={isGenerating}
        >
          {isGenerating ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
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
              <span className="hidden sm:inline">Đang tạo...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden sm:inline">Generate Video</span>
            </>
          )}
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Dashboard link */}
        <a
          href="#/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 
                    transition-colors cursor-pointer"
          title="Dashboard"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="hidden sm:inline text-sm font-medium">
            Dashboard
          </span>
        </a>

        {/* Mobile sidebar toggle - Right */}
        <button
          onClick={onToggleRightSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 
                    transition-colors cursor-pointer"
          aria-label={rightSidebarOpen ? "Đóng panel Style" : "Mở panel Style"}
          aria-expanded={rightSidebarOpen}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
