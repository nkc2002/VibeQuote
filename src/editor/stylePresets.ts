/**
 * Style Presets System
 *
 * Unified presets that combine layout AND visual style together.
 * Replaces the old Template concept entirely.
 */

import { AnimationType } from "./animation";

// ============================================================
// Style Preset Types
// ============================================================

export type LayoutPosition = "center" | "bottom" | "top";

export interface TextShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface TextGlow {
  blur: number;
  color: string;
  spread?: number;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  category: "minimal" | "bold" | "elegant" | "creative" | "dark" | "light";

  // Layout
  layout: LayoutPosition;

  // Typography
  fontFamily: string;
  fontWeight: number;
  fontSize: number; // base size, will be scaled
  letterSpacing?: number; // em units
  lineHeight?: number;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";

  // Colors
  textColor: string;
  authorColor?: string; // optional, defaults to textColor with lower opacity

  // Effects
  shadow?: TextShadow;
  glow?: TextGlow;

  // Background
  overlayOpacity?: number; // 0-1
  overlayColor?: string; // default black

  // Animation
  animation?: AnimationType;

  // Preview thumbnail gradient (for UI display)
  previewGradient?: string;
}

// ============================================================
// Predefined Style Presets (12+)
// ============================================================

export const STYLE_PRESETS: StylePreset[] = [
  // ==================== MINIMAL ====================
  {
    id: "minimal-clean",
    name: "Clean",
    description: "Minimalist, modern look",
    category: "minimal",
    layout: "center",
    fontFamily: "Inter, sans-serif",
    fontWeight: 400,
    fontSize: 48,
    letterSpacing: 0,
    textColor: "#FFFFFF",
    shadow: { offsetX: 0, offsetY: 2, blur: 8, color: "rgba(0,0,0,0.5)" },
    overlayOpacity: 0.2,
    animation: "fadeIn",
    previewGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    id: "minimal-sans",
    name: "Sans Serif",
    description: "Simple, readable sans-serif",
    category: "minimal",
    layout: "center",
    fontFamily: "Roboto, sans-serif",
    fontWeight: 300,
    fontSize: 44,
    letterSpacing: 0.02,
    textColor: "#FFFFFF",
    shadow: { offsetX: 0, offsetY: 1, blur: 4, color: "rgba(0,0,0,0.4)" },
    overlayOpacity: 0.15,
    animation: "fadeIn",
    previewGradient: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
  },

  // ==================== BOLD ====================
  {
    id: "bold-impact",
    name: "Impact",
    description: "Strong, attention-grabbing",
    category: "bold",
    layout: "center",
    fontFamily: "Montserrat, sans-serif",
    fontWeight: 800,
    fontSize: 56,
    letterSpacing: -0.02,
    textTransform: "uppercase",
    textColor: "#FFFFFF",
    shadow: { offsetX: 0, offsetY: 4, blur: 16, color: "rgba(0,0,0,0.7)" },
    overlayOpacity: 0.4,
    animation: "scaleInSoft",
    previewGradient: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)",
  },
  {
    id: "bold-neon",
    name: "Neon",
    description: "Vibrant neon glow effect",
    category: "bold",
    layout: "center",
    fontFamily: "Orbitron, sans-serif",
    fontWeight: 700,
    fontSize: 48,
    letterSpacing: 0.05,
    textTransform: "uppercase",
    textColor: "#00FFFF",
    glow: { blur: 20, color: "#00FFFF", spread: 10 },
    overlayOpacity: 0.6,
    animation: "fadeIn",
    previewGradient:
      "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  },

  // ==================== ELEGANT ====================
  {
    id: "elegant-serif",
    name: "Classic Serif",
    description: "Timeless, sophisticated",
    category: "elegant",
    layout: "center",
    fontFamily: "Playfair Display, serif",
    fontWeight: 500,
    fontSize: 52,
    letterSpacing: 0.01,
    lineHeight: 1.4,
    textColor: "#FFFFFF",
    shadow: { offsetX: 0, offsetY: 2, blur: 12, color: "rgba(0,0,0,0.4)" },
    overlayOpacity: 0.25,
    animation: "fadeIn",
    previewGradient: "linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)",
  },
  {
    id: "elegant-script",
    name: "Script",
    description: "Handwritten elegance",
    category: "elegant",
    layout: "center",
    fontFamily: "Dancing Script, cursive",
    fontWeight: 600,
    fontSize: 56,
    letterSpacing: 0,
    textColor: "#FFFFFF",
    shadow: { offsetX: 0, offsetY: 3, blur: 10, color: "rgba(0,0,0,0.5)" },
    overlayOpacity: 0.3,
    animation: "slideUp",
    previewGradient: "linear-gradient(135deg, #834d9b 0%, #d04ed6 100%)",
  },
  {
    id: "elegant-gold",
    name: "Golden",
    description: "Luxurious gold accent",
    category: "elegant",
    layout: "center",
    fontFamily: "Cormorant Garamond, serif",
    fontWeight: 600,
    fontSize: 50,
    letterSpacing: 0.03,
    textColor: "#FFD700",
    authorColor: "#FFFFFF",
    shadow: { offsetX: 0, offsetY: 2, blur: 8, color: "rgba(0,0,0,0.6)" },
    overlayOpacity: 0.4,
    animation: "fadeIn",
    previewGradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
  },

  // ==================== CREATIVE ====================
  {
    id: "creative-retro",
    name: "Retro",
    description: "Vintage vibe",
    category: "creative",
    layout: "bottom",
    fontFamily: "Bebas Neue, sans-serif",
    fontWeight: 400,
    fontSize: 60,
    letterSpacing: 0.1,
    textTransform: "uppercase",
    textColor: "#FFE4B5",
    shadow: { offsetX: 3, offsetY: 3, blur: 0, color: "#8B4513" },
    overlayOpacity: 0.35,
    animation: "scaleInSoft",
    previewGradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    id: "creative-grunge",
    name: "Grunge",
    description: "Raw, edgy aesthetic",
    category: "creative",
    layout: "center",
    fontFamily: "Special Elite, cursive",
    fontWeight: 400,
    fontSize: 44,
    letterSpacing: 0.02,
    textColor: "#E8E8E8",
    shadow: { offsetX: 2, offsetY: 2, blur: 4, color: "rgba(0,0,0,0.8)" },
    overlayOpacity: 0.5,
    animation: "fadeIn",
    previewGradient: "linear-gradient(135deg, #434343 0%, #000000 100%)",
  },

  // ==================== DARK ====================
  {
    id: "dark-cinematic",
    name: "Cinematic",
    description: "Movie-style dramatic look",
    category: "dark",
    layout: "bottom",
    fontFamily: "Oswald, sans-serif",
    fontWeight: 500,
    fontSize: 48,
    letterSpacing: 0.05,
    textTransform: "uppercase",
    textColor: "#FFFFFF",
    shadow: { offsetX: 0, offsetY: 4, blur: 20, color: "rgba(0,0,0,0.8)" },
    overlayOpacity: 0.5,
    animation: "slideUp",
    previewGradient: "linear-gradient(135deg, #0f0f0f 0%, #232526 100%)",
  },
  {
    id: "dark-moody",
    name: "Moody",
    description: "Deep, atmospheric",
    category: "dark",
    layout: "center",
    fontFamily: "Lora, serif",
    fontWeight: 400,
    fontSize: 46,
    letterSpacing: 0.01,
    lineHeight: 1.5,
    textColor: "#D4D4D4",
    shadow: { offsetX: 0, offsetY: 2, blur: 12, color: "rgba(0,0,0,0.6)" },
    overlayOpacity: 0.45,
    animation: "fadeIn",
    previewGradient: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
  },

  // ==================== LIGHT ====================
  {
    id: "light-fresh",
    name: "Fresh",
    description: "Bright, positive energy",
    category: "light",
    layout: "center",
    fontFamily: "Poppins, sans-serif",
    fontWeight: 600,
    fontSize: 46,
    letterSpacing: 0,
    textColor: "#1A1A1A",
    shadow: { offsetX: 0, offsetY: 2, blur: 8, color: "rgba(255,255,255,0.8)" },
    overlayOpacity: 0.1,
    animation: "fadeIn",
    previewGradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  },
  {
    id: "light-soft",
    name: "Soft",
    description: "Gentle, calming",
    category: "light",
    layout: "center",
    fontFamily: "Quicksand, sans-serif",
    fontWeight: 500,
    fontSize: 44,
    letterSpacing: 0.01,
    textColor: "#2D2D2D",
    shadow: { offsetX: 0, offsetY: 1, blur: 6, color: "rgba(255,255,255,0.6)" },
    overlayOpacity: 0.05,
    animation: "fadeIn",
    previewGradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  },
];

// ============================================================
// Helper Functions
// ============================================================

export function getPresetById(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find((preset) => preset.id === id);
}

export function getPresetsByCategory(
  category: StylePreset["category"]
): StylePreset[] {
  return STYLE_PRESETS.filter((preset) => preset.category === category);
}

export function getAllCategories(): StylePreset["category"][] {
  return ["minimal", "bold", "elegant", "creative", "dark", "light"];
}

export function getCategoryLabel(category: StylePreset["category"]): string {
  const labels: Record<StylePreset["category"], string> = {
    minimal: "Tối giản",
    bold: "Nổi bật",
    elegant: "Sang trọng",
    creative: "Sáng tạo",
    dark: "Tối",
    light: "Sáng",
  };
  return labels[category];
}

/**
 * Get Y position based on layout
 */
export function getLayoutYPosition(
  layout: LayoutPosition,
  isAuthor: boolean
): number {
  switch (layout) {
    case "top":
      return isAuthor ? 25 : 15;
    case "bottom":
      return isAuthor ? 85 : 75;
    case "center":
    default:
      return isAuthor ? 55 : 45;
  }
}
