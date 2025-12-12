/**
 * Text Wrapping Demo Component
 *
 * Live preview of wrapTextToWidth function.
 * Shows how text wraps in real-time as you type.
 */

import { useState, useEffect, useRef } from "react";
import { wrapTextToWidth, sanitizeTextForFFmpeg } from "../../shared";

interface TextWrapDemoProps {
  onTextWrapped?: (wrappedText: string) => void;
}

const TextWrapDemo = ({ onTextWrapped }: TextWrapDemoProps) => {
  const [inputText, setInputText] = useState(
    "Life is what happens when you're busy making other plans."
  );
  const [fontFamily, setFontFamily] = useState("Syne");
  const [fontSize, setFontSize] = useState(32);
  const [maxWidth, setMaxWidth] = useState(400);
  const [wrappedText, setWrappedText] = useState("");
  const [sanitizedText, setSanitizedText] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Font options
  const fonts = [
    "Syne",
    "Manrope",
    "Playfair Display",
    "Inter",
    "Arial",
    "Georgia",
  ];

  // Update wrapped text when inputs change
  useEffect(() => {
    const fontSpec = `${fontSize}px ${fontFamily}`;
    const wrapped = wrapTextToWidth(inputText, fontSpec, maxWidth);
    setWrappedText(wrapped);

    // Also show FFmpeg sanitized version
    const sanitized = sanitizeTextForFFmpeg(wrapped);
    setSanitizedText(sanitized);

    // Callback for parent
    onTextWrapped?.(wrapped);
  }, [inputText, fontFamily, fontSize, maxWidth, onTextWrapped]);

  // Draw preview on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1E293B";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw width indicator
    ctx.strokeStyle = "rgba(139, 92, 246, 0.5)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(20 + maxWidth, 0);
    ctx.lineTo(20 + maxWidth, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Setup text style
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = "#FFFFFF";
    ctx.textBaseline = "top";

    // Draw wrapped text
    const lines = wrappedText.split("\n");
    const lineHeight = fontSize * 1.4;
    let y = 20;

    for (const line of lines) {
      ctx.fillText(line, 20, y);
      y += lineHeight;
    }

    // Draw character count
    ctx.font = "12px monospace";
    ctx.fillStyle = "#94A3B8";
    ctx.fillText(
      `${inputText.length}/120 chars`,
      canvas.width - 100,
      canvas.height - 20
    );
  }, [wrappedText, fontFamily, fontSize, maxWidth, inputText.length]);

  return (
    <div className="bg-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-heading font-bold text-lg text-white mb-1">
          Text Wrapping Demo
        </h3>
        <p className="text-sm text-slate-400">
          Live preview of{" "}
          <code className="text-primary-400">wrapTextToWidth()</code> function
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Font family */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Font Family
          </label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg
                      text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {fonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Font size */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Font Size: {fontSize}px
          </label>
          <input
            type="range"
            min="16"
            max="48"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>

        {/* Max width */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Max Width: {maxWidth}px
          </label>
          <input
            type="range"
            min="200"
            max="600"
            step="20"
            value={maxWidth}
            onChange={(e) => setMaxWidth(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
      </div>

      {/* Input text */}
      <div>
        <label className="block text-sm text-slate-300 mb-2">Input Text</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter quote text..."
          rows={3}
          maxLength={120}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg
                    text-white placeholder-slate-400 resize-none
                    focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-slate-500 mt-1">
          {inputText.length}/120 characters (truncated if exceeded)
        </p>
      </div>

      {/* Canvas Preview */}
      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Live Preview
        </label>
        <canvas
          ref={canvasRef}
          width={640}
          height={200}
          className="w-full bg-slate-900 rounded-lg border border-slate-700"
          style={{ maxWidth: "100%", height: "auto" }}
        />
        <p className="text-xs text-slate-500 mt-1">
          Purple dashed line shows max width boundary
        </p>
      </div>

      {/* Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wrapped text (with visible \n) */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Wrapped Output <span className="text-slate-500">(\\n visible)</span>
          </label>
          <pre className="p-4 bg-slate-900 rounded-lg text-sm text-green-400 font-mono overflow-x-auto">
            {JSON.stringify(wrappedText)}
          </pre>
        </div>

        {/* Sanitized for FFmpeg */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            FFmpeg Sanitized <span className="text-slate-500">(escaped)</span>
          </label>
          <pre className="p-4 bg-slate-900 rounded-lg text-sm text-amber-400 font-mono overflow-x-auto">
            {JSON.stringify(sanitizedText)}
          </pre>
        </div>
      </div>

      {/* Test cases */}
      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Quick Test Cases
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Quote with apostrophe", text: "It's 100% fun: enjoy!" },
            { label: "Backslash", text: "Path\\to\\file" },
            { label: "Chinese", text: "人生就是这样: 漢字" },
            { label: "Emoji", text: "Hello 👋 World 🌍" },
            {
              label: "Long text",
              text: "This is a much longer piece of text that will definitely need to be wrapped across multiple lines when displayed in the video canvas preview area.",
            },
          ].map(({ label, text }) => (
            <button
              key={label}
              onClick={() => setInputText(text)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm
                        rounded-lg transition-colors cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TextWrapDemo;
