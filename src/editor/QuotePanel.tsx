import { useState } from "react";
import { MOCK_QUOTES } from "./types";

interface QuotePanelProps {
  quoteText: string;
  authorText: string;
  onSetQuote: (text: string, author: string) => void;
  onApplyToCanvas: () => void;
}

const QuotePanel = ({
  quoteText,
  authorText,
  onSetQuote,
  onApplyToCanvas,
}: QuotePanelProps) => {
  const [activeTab, setActiveTab] = useState<"input" | "library">("input");

  const handleRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * MOCK_QUOTES.length);
    const quote = MOCK_QUOTES[randomIndex];
    onSetQuote(quote.text, quote.author);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="font-heading font-semibold text-white text-lg">Quote</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "input"}
          onClick={() => setActiveTab("input")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer
            ${
              activeTab === "input"
                ? "text-primary-400 border-b-2 border-primary-400 bg-slate-800/50"
                : "text-slate-400 hover:text-slate-300"
            }`}
        >
          Nhập quote
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "library"}
          onClick={() => setActiveTab("library")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer
            ${
              activeTab === "library"
                ? "text-primary-400 border-b-2 border-primary-400 bg-slate-800/50"
                : "text-slate-400 hover:text-slate-300"
            }`}
        >
          Thư viện
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "input" ? (
          <div className="space-y-4">
            {/* Quote textarea */}
            <div>
              <label
                htmlFor="quote-input"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Nội dung quote
              </label>
              <textarea
                id="quote-input"
                value={quoteText}
                onChange={(e) => onSetQuote(e.target.value, authorText)}
                placeholder="Nhập câu quote của bạn..."
                className="w-full h-32 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg
                          text-white placeholder-slate-500 resize-none
                          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                          transition-all duration-200"
                aria-describedby="quote-hint"
              />
              <p id="quote-hint" className="mt-1 text-xs text-slate-500">
                {quoteText.length}/280 ký tự
              </p>
            </div>

            {/* Author input */}
            <div>
              <label
                htmlFor="author-input"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Tác giả (tùy chọn)
              </label>
              <input
                id="author-input"
                type="text"
                value={authorText}
                onChange={(e) => onSetQuote(quoteText, e.target.value)}
                placeholder="Ví dụ: Steve Jobs"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg
                          text-white placeholder-slate-500
                          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                          transition-all duration-200"
              />
            </div>

            {/* Random button */}
            <button
              onClick={handleRandomQuote}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 
                        bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg
                        transition-colors duration-200 cursor-pointer"
              aria-label="Lấy quote ngẫu nhiên từ thư viện"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Quote ngẫu nhiên</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {MOCK_QUOTES.map((quote, index) => (
              <button
                key={index}
                onClick={() => onSetQuote(quote.text, quote.author)}
                className={`w-full p-4 text-left rounded-lg border transition-all duration-200 cursor-pointer
                  ${
                    quoteText === quote.text
                      ? "bg-primary-900/50 border-primary-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600"
                  }`}
                aria-pressed={quoteText === quote.text}
              >
                <p className="text-sm leading-relaxed mb-2">"{quote.text}"</p>
                <p className="text-xs text-slate-500">— {quote.author}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Apply button */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onApplyToCanvas}
          disabled={!quoteText.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 
                    bg-gradient-to-r from-primary-500 to-cta-500 text-white font-medium rounded-lg
                    hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200 cursor-pointer
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          aria-label="Thêm quote vào canvas"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Thêm vào canvas</span>
        </button>
      </div>
    </div>
  );
};

export default QuotePanel;
