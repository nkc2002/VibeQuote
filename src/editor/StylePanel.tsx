import { useState } from "react";
import { MOCK_FONTS, MOCK_COLORS, MOCK_GRADIENTS, MOCK_IMAGES } from "./types";
import { ImagePickerModal } from "../image-picker";

interface StylePanelProps {
  activeTab: "style" | "image";
  fontFamily: string;
  fontSize: number;
  textColor: string;
  boxOpacity: number;
  backgroundGradient: string;
  backgroundImage: string | null;
  onSetTab: (tab: "style" | "image") => void;
  onSetFontFamily: (font: string) => void;
  onSetFontSize: (size: number) => void;
  onSetTextColor: (color: string) => void;
  onSetBoxOpacity: (opacity: number) => void;
  onSetBackgroundGradient: (gradient: string) => void;
  onSetBackgroundImage: (
    image: string | { url: string; id: string | null }
  ) => void;
}

const StylePanel = ({
  activeTab,
  fontFamily,
  fontSize,
  textColor,
  boxOpacity,
  backgroundGradient,
  backgroundImage,
  onSetTab,
  onSetFontFamily,
  onSetFontSize,
  onSetTextColor,
  onSetBoxOpacity,
  onSetBackgroundGradient,
  onSetBackgroundImage,
}: StylePanelProps) => {
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  const handleImageSelect = (unsplashId: string, imageUrl: string) => {
    onSetBackgroundImage({ url: imageUrl, id: unsplashId });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="font-heading font-semibold text-white text-lg">
          Tùy chỉnh
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700" role="tablist">
        {[
          { id: "style", label: "Style" },
          { id: "image", label: "Image" },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onSetTab(tab.id as "style" | "image")}
            className={`flex-1 px-3 py-3 text-sm font-medium transition-colors cursor-pointer
              ${
                activeTab === tab.id
                  ? "text-primary-400 border-b-2 border-primary-400 bg-slate-800/50"
                  : "text-slate-400 hover:text-slate-300"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "style" && (
          <div className="space-y-6">
            {/* Font family */}
            <div>
              <label
                htmlFor="font-select"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Font chữ
              </label>
              <select
                id="font-select"
                value={fontFamily}
                onChange={(e) => onSetFontFamily(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg
                          text-white focus:outline-none focus:ring-2 focus:ring-primary-500
                          cursor-pointer"
              >
                {MOCK_FONTS.map((font) => (
                  <option
                    key={font.value}
                    value={font.value}
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Font size */}
            <div>
              <label
                htmlFor="font-size"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Cỡ chữ: {fontSize}px
              </label>
              <input
                id="font-size"
                type="range"
                min="24"
                max="96"
                step="4"
                value={fontSize}
                onChange={(e) => onSetFontSize(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none
                          [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                          [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full
                          [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>24px</span>
                <span>96px</span>
              </div>
            </div>

            {/* Text color */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Màu chữ
              </label>
              <div className="grid grid-cols-6 gap-2">
                {MOCK_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => onSetTextColor(color)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 cursor-pointer
                      ${
                        textColor === color
                          ? "border-primary-500 scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Màu ${color}`}
                    aria-pressed={textColor === color}
                  />
                ))}
              </div>
            </div>

            {/* Box opacity */}
            <div>
              <label
                htmlFor="box-opacity"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Độ tối nền: {Math.round(boxOpacity * 100)}%
              </label>
              <input
                id="box-opacity"
                type="range"
                min="0"
                max="0.8"
                step="0.1"
                value={boxOpacity}
                onChange={(e) => onSetBoxOpacity(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none
                          [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                          [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full
                          [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>
        )}

        {activeTab === "image" && (
          <div className="space-y-6">
            {/* Gradients */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">
                Gradient
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {MOCK_GRADIENTS.map((gradient, index) => (
                  <button
                    key={index}
                    onClick={() => onSetBackgroundGradient(gradient)}
                    className={`aspect-square rounded-lg border-2 transition-all duration-200 cursor-pointer
                      ${
                        backgroundGradient === gradient && !backgroundImage
                          ? "border-primary-500 scale-105"
                          : "border-transparent hover:scale-105"
                      }`}
                    style={{ background: gradient }}
                    aria-label={`Gradient ${index + 1}`}
                    aria-pressed={
                      backgroundGradient === gradient && !backgroundImage
                    }
                  />
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">
                Hình ảnh gợi ý
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {MOCK_IMAGES.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => onSetBackgroundImage(image)}
                    className={`aspect-video rounded-lg border-2 transition-all duration-200 
                               cursor-pointer overflow-hidden
                      ${
                        backgroundImage === image
                          ? "border-primary-500 scale-[1.02]"
                          : "border-transparent hover:scale-[1.02]"
                      }`}
                    aria-label={`Background image ${index + 1}`}
                    aria-pressed={backgroundImage === image}
                  >
                    <img
                      src={image}
                      alt={`Background option ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Open picker button */}
            <button
              onClick={() => setIsImagePickerOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3
                        bg-gradient-to-r from-primary-600 to-cta-600 text-white rounded-lg
                        font-medium shadow-lg hover:opacity-90
                        transition-all duration-200 cursor-pointer"
              aria-label="Mở bộ chọn ảnh"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>Tìm ảnh Unsplash</span>
            </button>

            {/* Current image info */}
            {backgroundImage && (
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <span className="text-xs text-slate-400">Ảnh đã chọn</span>
                <button
                  onClick={() => onSetBackgroundImage("")}
                  className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                >
                  Xóa
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={handleImageSelect}
      />
    </div>
  );
};

export default StylePanel;
