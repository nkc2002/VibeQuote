import { useState } from "react";
import { MOCK_FONTS, MOCK_COLORS, MOCK_GRADIENTS, MOCK_IMAGES } from "./types";
import { ImagePickerModal } from "../image-picker";
import {
  getAllCategories,
  getCategoryLabel,
  getPresetsByCategory,
} from "./stylePresets";
import { AnimationType } from "./animation";
import { MUSIC_TRACKS, formatDuration } from "./music";
import { ParticleType } from "./particles";

// Particle effect options
const PARTICLE_OPTIONS: { id: ParticleType; name: string; icon: string }[] = [
  { id: "none", name: "Không", icon: "○" },
  { id: "snow", name: "Tuyết", icon: "❄" },
  { id: "dust", name: "Bụi", icon: "✦" },
  { id: "sparkles", name: "Lấp lánh", icon: "✨" },
];

// Animation options with icons and labels
const ANIMATION_OPTIONS: {
  id: AnimationType;
  name: string;
  icon: string;
  description: string;
}[] = [
  { id: "none", name: "Không", icon: "○", description: "Hiện ngay lập tức" },
  { id: "fadeIn", name: "Fade In", icon: "◐", description: "Mờ dần hiện ra" },
  {
    id: "slideUp",
    name: "Slide Up",
    icon: "↑",
    description: "Trượt lên từ dưới",
  },
  {
    id: "fadeSlide",
    name: "Fade Slide",
    icon: "⤴",
    description: "Fade + trượt lên nhẹ",
  },
  {
    id: "scaleInSoft",
    name: "Scale In",
    icon: "⊕",
    description: "Phóng to nhẹ từ 90%",
  },
  {
    id: "blurReveal",
    name: "Blur Reveal",
    icon: "◎",
    description: "Từ mờ đến rõ",
  },
  {
    id: "maskReveal",
    name: "Mask Reveal",
    icon: "▤",
    description: "Lộ ra từ dưới lên",
  },
  {
    id: "typewriter",
    name: "Typewriter",
    icon: "⌨",
    description: "Gõ từng chữ",
  },
];

interface StylePanelProps {
  activeTab: "style" | "image";
  activePresetId: string | null;
  textAnimation: string;
  // Particle effect
  particleEffect: ParticleType;
  // Music props
  selectedMusicId: string | null;
  musicVolume: number;
  musicEnabled: boolean;
  isMusicPlaying: boolean;
  // Other style props
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
  onApplyPreset: (presetId: string) => void;
  onSetTextAnimation: (animation: string) => void;
  onSetParticleEffect: (effect: ParticleType) => void;
  // Music callbacks
  onSetMusicTrack: (trackId: string | null) => void;
  onPlayMusicTrack: (trackId: string) => void;
  onSetMusicVolume: (volume: number) => void;
  onToggleMusicEnabled: () => void;
  onToggleMusicPlaying: () => void;
}

// Check icon SVG
const CheckIcon = () => (
  <svg
    className="w-4 h-4 text-white"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={3}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const StylePanel = ({
  activeTab,
  activePresetId,
  textAnimation,
  particleEffect,
  selectedMusicId,
  musicVolume,
  musicEnabled,
  isMusicPlaying,
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
  onApplyPreset,
  onSetTextAnimation,
  onSetParticleEffect,
  onSetMusicTrack,
  onPlayMusicTrack,
  onSetMusicVolume,
  onToggleMusicEnabled,
  onToggleMusicPlaying,
}: StylePanelProps) => {
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "minimal"
  );

  const handleImageSelect = (unsplashId: string, imageUrl: string) => {
    onSetBackgroundImage({ url: imageUrl, id: unsplashId });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="font-heading font-semibold text-white text-lg">
          Tùy chỉnh
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50" role="tablist">
        {[
          { id: "style", label: "Style", icon: "✦" },
          { id: "image", label: "Image", icon: "◐" },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onSetTab(tab.id as "style" | "image")}
            className={`flex-1 px-3 py-3 text-sm font-medium transition-all duration-200 cursor-pointer
              ${
                activeTab === tab.id
                  ? "text-primary-400 border-b-2 border-primary-500 bg-primary-500/5"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
              }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "style" && (
          <div className="divide-y divide-slate-700/30">
            {/* Style Presets Section */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">
                  Style Presets
                </h3>
                {activePresetId && (
                  <span className="text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>

              {/* Presets by Category - Compact Accordion */}
              <div className="space-y-2">
                {getAllCategories().map((category) => {
                  const presets = getPresetsByCategory(category);
                  if (presets.length === 0) return null;
                  const isExpanded = expandedCategory === category;
                  const hasActivePreset = presets.some(
                    (p) => p.id === activePresetId
                  );

                  return (
                    <div
                      key={category}
                      className={`rounded-lg overflow-hidden transition-colors ${
                        hasActivePreset
                          ? "bg-primary-500/5 ring-1 ring-primary-500/20"
                          : "bg-slate-800/30"
                      }`}
                    >
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between px-3 py-2.5 cursor-pointer
                                   hover:bg-slate-700/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-medium uppercase tracking-wider ${
                              hasActivePreset
                                ? "text-primary-400"
                                : "text-slate-400"
                            }`}
                          >
                            {getCategoryLabel(category)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({presets.length})
                          </span>
                        </div>
                        <svg
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Preset Cards */}
                      {isExpanded && (
                        <div className="p-2 grid grid-cols-2 gap-1.5">
                          {presets.map((preset) => {
                            const isActive = preset.id === activePresetId;
                            return (
                              <button
                                key={preset.id}
                                onClick={() => onApplyPreset(preset.id)}
                                className={`relative p-2 rounded-lg transition-all duration-200 cursor-pointer text-left
                                  ${
                                    isActive
                                      ? "bg-primary-500/20 ring-2 ring-primary-500"
                                      : "bg-slate-800/50 hover:bg-slate-700/50 ring-1 ring-slate-700/50 hover:ring-slate-600"
                                  }`}
                              >
                                {/* Active Check Badge */}
                                {isActive && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center shadow-lg">
                                    <CheckIcon />
                                  </div>
                                )}

                                {/* Preview */}
                                <div
                                  className="w-full h-10 rounded-md mb-1.5 flex items-center justify-center overflow-hidden"
                                  style={{
                                    background:
                                      preset.previewGradient ||
                                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                  }}
                                >
                                  <span
                                    className="text-sm font-semibold"
                                    style={{
                                      fontFamily: preset.fontFamily,
                                      fontWeight: preset.fontWeight,
                                      color: preset.textColor,
                                      textShadow: preset.shadow
                                        ? `${preset.shadow.offsetX}px ${preset.shadow.offsetY}px ${preset.shadow.blur}px ${preset.shadow.color}`
                                        : preset.glow
                                        ? `0 0 ${preset.glow.blur}px ${preset.glow.color}`
                                        : "none",
                                      textTransform:
                                        preset.textTransform || "none",
                                      letterSpacing: preset.letterSpacing
                                        ? `${preset.letterSpacing}em`
                                        : "normal",
                                    }}
                                  >
                                    Aa
                                  </span>
                                </div>

                                {/* Name */}
                                <p
                                  className={`text-xs font-medium truncate ${
                                    isActive
                                      ? "text-primary-300"
                                      : "text-slate-300"
                                  }`}
                                >
                                  {preset.name}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Animation Section */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-primary-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Text Animation
              </h3>

              <div className="grid grid-cols-3 gap-1.5">
                {ANIMATION_OPTIONS.map((anim) => {
                  const isActive = textAnimation === anim.id;
                  return (
                    <button
                      key={anim.id}
                      onClick={() => onSetTextAnimation(anim.id)}
                      className={`relative flex flex-col items-center gap-1 p-2.5 rounded-lg transition-all duration-200 cursor-pointer
                        ${
                          isActive
                            ? "bg-primary-500/20 ring-2 ring-primary-500 text-primary-300"
                            : "bg-slate-800/50 hover:bg-slate-700/50 ring-1 ring-slate-700/50 hover:ring-slate-600 text-slate-400 hover:text-slate-300"
                        }`}
                      title={anim.description}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary-500 rounded-full" />
                      )}

                      {/* Icon */}
                      <span
                        className={`text-lg leading-none ${
                          isActive ? "text-primary-400" : "text-slate-500"
                        }`}
                      >
                        {anim.icon}
                      </span>

                      {/* Name */}
                      <span className="text-[10px] font-medium leading-tight text-center">
                        {anim.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Particle Effects Section */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-primary-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                Effects
              </h3>
              <div className="grid grid-cols-4 gap-1.5">
                {PARTICLE_OPTIONS.map((effect) => {
                  const isActive = particleEffect === effect.id;
                  return (
                    <button
                      key={effect.id}
                      onClick={() => onSetParticleEffect(effect.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all cursor-pointer
                        ${
                          isActive
                            ? "bg-primary-500/20 ring-2 ring-primary-500 text-primary-300"
                            : "bg-slate-800/50 hover:bg-slate-700/50 ring-1 ring-slate-700/50 hover:ring-slate-600 text-slate-400"
                        }`}
                    >
                      <span
                        className={`text-base ${
                          isActive ? "text-primary-400" : "text-slate-500"
                        }`}
                      >
                        {effect.icon}
                      </span>
                      <span className="text-[9px] font-medium">
                        {effect.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Music Section */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-primary-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                  Music
                </h3>
                {/* Enable/Disable Toggle */}
                <button
                  onClick={onToggleMusicEnabled}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                    musicEnabled ? "bg-primary-500" : "bg-slate-700"
                  }`}
                  aria-label={musicEnabled ? "Disable music" : "Enable music"}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      musicEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={musicVolume}
                    onChange={(e) => onSetMusicVolume(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                              [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:cursor-pointer"
                    disabled={!musicEnabled}
                  />
                  <span className="text-xs text-slate-400 w-8 text-right">
                    {Math.round(musicVolume * 100)}%
                  </span>
                </div>
              </div>

              {/* Track List */}
              <div
                className={`space-y-1 max-h-40 overflow-y-auto ${
                  !musicEnabled && "opacity-50 pointer-events-none"
                }`}
              >
                {MUSIC_TRACKS.slice(0, 6).map((track) => {
                  const isSelected = selectedMusicId === track.id;
                  const isPlaying = isSelected && isMusicPlaying;
                  return (
                    <div
                      key={track.id}
                      className={`flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary-500/20 ring-1 ring-primary-500/50"
                          : "bg-slate-800/50 hover:bg-slate-700/50"
                      }`}
                      onClick={() => onSetMusicTrack(track.id)}
                    >
                      {/* Play/Pause Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSelected) {
                            // Toggle play/pause for selected track
                            onToggleMusicPlaying();
                          } else {
                            // Select new track and start playing (atomic action)
                            onPlayMusicTrack(track.id);
                          }
                        }}
                        className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-primary-500 text-white"
                            : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                        }`}
                      >
                        {isPlaying ? (
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        ) : (
                          <svg
                            className="w-3 h-3 ml-0.5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-medium truncate ${
                            isSelected ? "text-primary-300" : "text-slate-300"
                          }`}
                        >
                          {track.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {formatDuration(track.duration)}
                        </p>
                      </div>

                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Manual Adjustments Section */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                Chỉnh sửa thủ công
              </h3>

              <div className="space-y-4">
                {/* Font family */}
                <div>
                  <label
                    htmlFor="font-select"
                    className="block text-xs font-medium text-slate-400 mb-1.5"
                  >
                    Font chữ
                  </label>
                  <select
                    id="font-select"
                    value={fontFamily}
                    onChange={(e) => onSetFontFamily(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/70 border border-slate-700/50 rounded-lg
                              text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50
                              focus:border-primary-500/50 cursor-pointer transition-colors"
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
                    className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5"
                  >
                    <span>Cỡ chữ</span>
                    <span className="text-primary-400 font-semibold">
                      {fontSize}px
                    </span>
                  </label>
                  <input
                    id="font-size"
                    type="range"
                    min="24"
                    max="96"
                    step="4"
                    value={fontSize}
                    onChange={(e) => onSetFontSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                              [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                              [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
                  />
                </div>

                {/* Text color */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Màu chữ
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MOCK_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => onSetTextColor(color)}
                        className={`w-7 h-7 rounded-md transition-all duration-200 cursor-pointer
                          ${
                            textColor === color
                              ? "ring-2 ring-primary-500 ring-offset-2 ring-offset-slate-900 scale-105"
                              : "hover:scale-110 ring-1 ring-white/10"
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
                    className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5"
                  >
                    <span>Độ tối nền</span>
                    <span className="text-primary-400 font-semibold">
                      {Math.round(boxOpacity * 100)}%
                    </span>
                  </label>
                  <input
                    id="box-opacity"
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.1"
                    value={boxOpacity}
                    onChange={(e) => onSetBoxOpacity(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                              [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                              [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "image" && (
          <div className="p-4 space-y-5">
            {/* Gradients */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-2.5">
                Gradient
              </h3>
              <div className="grid grid-cols-4 gap-1.5">
                {MOCK_GRADIENTS.map((gradient, index) => (
                  <button
                    key={index}
                    onClick={() => onSetBackgroundGradient(gradient)}
                    className={`aspect-square rounded-lg transition-all duration-200 cursor-pointer
                      ${
                        backgroundGradient === gradient && !backgroundImage
                          ? "ring-2 ring-primary-500 scale-105"
                          : "hover:scale-105 ring-1 ring-white/10"
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
              <h3 className="text-sm font-semibold text-white mb-2.5">
                Hình ảnh gợi ý
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {MOCK_IMAGES.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => onSetBackgroundImage(image)}
                    className={`aspect-video rounded-lg transition-all duration-200 
                               cursor-pointer overflow-hidden
                      ${
                        backgroundImage === image
                          ? "ring-2 ring-primary-500 scale-[1.02]"
                          : "hover:scale-[1.02] ring-1 ring-white/10"
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
                        font-medium shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30
                        hover:opacity-95 active:scale-[0.99]
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
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg ring-1 ring-slate-700/50">
                <span className="text-xs text-slate-400">Ảnh đã chọn</span>
                <button
                  onClick={() => onSetBackgroundImage("")}
                  className="text-xs text-red-400 hover:text-red-300 cursor-pointer
                            transition-colors px-2 py-1 rounded hover:bg-red-500/10"
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
