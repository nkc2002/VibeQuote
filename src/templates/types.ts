// Template Gallery Types

export interface TemplateConfig {
  id: string;
  name: string;
  category: TemplateCategory;
  layout: TemplateLayout;
  background: {
    type: "gradient" | "solid" | "image";
    value: string;
  };
  textPosition: {
    x: number; // percentage
    y: number; // percentage
  };
  spacing: {
    paddingX: number; // percentage
    paddingY: number; // percentage
  };
  overlay: {
    enabled: boolean;
    color: string;
    opacity: number;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    color: string;
    lineHeight: number;
  };
  authorTypography: {
    fontSize: number;
    color: string;
    marginTop: number;
  };
  createdAt: number;
  updatedAt: number;
  isCustom: boolean;
}

export type TemplateCategory =
  | "all"
  | "minimal"
  | "gradient"
  | "photo"
  | "dark"
  | "colorful";
export type TemplateLayout = "center" | "bottom" | "top-left" | "bottom-right";

// Default templates
export const DEFAULT_TEMPLATES: TemplateConfig[] = [
  {
    id: "tpl_minimal_center",
    name: "Minimal Center",
    category: "minimal",
    layout: "center",
    background: { type: "solid", value: "#FFFFFF" },
    textPosition: { x: 50, y: 50 },
    spacing: { paddingX: 10, paddingY: 10 },
    overlay: { enabled: false, color: "#000000", opacity: 0 },
    typography: {
      fontFamily: "Syne, sans-serif",
      fontSize: 36,
      color: "#0F172A",
      lineHeight: 1.5,
    },
    authorTypography: { fontSize: 18, color: "#64748B", marginTop: 24 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isCustom: false,
  },
  {
    id: "tpl_gradient_purple",
    name: "Purple Gradient",
    category: "gradient",
    layout: "center",
    background: {
      type: "gradient",
      value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    textPosition: { x: 50, y: 50 },
    spacing: { paddingX: 12, paddingY: 15 },
    overlay: { enabled: false, color: "#000000", opacity: 0 },
    typography: {
      fontFamily: "Syne, sans-serif",
      fontSize: 40,
      color: "#FFFFFF",
      lineHeight: 1.4,
    },
    authorTypography: {
      fontSize: 20,
      color: "rgba(255,255,255,0.7)",
      marginTop: 28,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isCustom: false,
  },
  {
    id: "tpl_gradient_sunset",
    name: "Sunset Vibes",
    category: "gradient",
    layout: "bottom",
    background: {
      type: "gradient",
      value: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    },
    textPosition: { x: 50, y: 75 },
    spacing: { paddingX: 10, paddingY: 8 },
    overlay: { enabled: true, color: "#000000", opacity: 0.2 },
    typography: {
      fontFamily: "Manrope, sans-serif",
      fontSize: 38,
      color: "#FFFFFF",
      lineHeight: 1.5,
    },
    authorTypography: {
      fontSize: 18,
      color: "rgba(255,255,255,0.8)",
      marginTop: 20,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isCustom: false,
  },
  {
    id: "tpl_dark_elegant",
    name: "Dark Elegant",
    category: "dark",
    layout: "center",
    background: {
      type: "gradient",
      value: "linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)",
    },
    textPosition: { x: 50, y: 50 },
    spacing: { paddingX: 15, paddingY: 12 },
    overlay: { enabled: false, color: "#000000", opacity: 0 },
    typography: {
      fontFamily: "Playfair Display, serif",
      fontSize: 42,
      color: "#FFFFFF",
      lineHeight: 1.5,
    },
    authorTypography: {
      fontSize: 20,
      color: "rgba(255,255,255,0.6)",
      marginTop: 32,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isCustom: false,
  },
  {
    id: "tpl_ocean_blue",
    name: "Ocean Blue",
    category: "gradient",
    layout: "center",
    background: {
      type: "gradient",
      value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
    textPosition: { x: 50, y: 45 },
    spacing: { paddingX: 12, paddingY: 10 },
    overlay: { enabled: true, color: "#000000", opacity: 0.15 },
    typography: {
      fontFamily: "Inter, sans-serif",
      fontSize: 36,
      color: "#FFFFFF",
      lineHeight: 1.5,
    },
    authorTypography: {
      fontSize: 18,
      color: "rgba(255,255,255,0.75)",
      marginTop: 24,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isCustom: false,
  },
  {
    id: "tpl_colorful_pop",
    name: "Colorful Pop",
    category: "colorful",
    layout: "bottom-right",
    background: {
      type: "gradient",
      value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    textPosition: { x: 70, y: 70 },
    spacing: { paddingX: 8, paddingY: 8 },
    overlay: { enabled: false, color: "#000000", opacity: 0 },
    typography: {
      fontFamily: "Montserrat, sans-serif",
      fontSize: 34,
      color: "#FFFFFF",
      lineHeight: 1.4,
    },
    authorTypography: {
      fontSize: 16,
      color: "rgba(255,255,255,0.8)",
      marginTop: 16,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isCustom: false,
  },
  {
    id: "tpl_minimal_dark",
    name: "Minimal Dark",
    category: "dark",
    layout: "center",
    background: { type: "solid", value: "#0F172A" },
    textPosition: { x: 50, y: 50 },
    spacing: { paddingX: 15, paddingY: 15 },
    overlay: { enabled: false, color: "#000000", opacity: 0 },
    typography: {
      fontFamily: "Syne, sans-serif",
      fontSize: 40,
      color: "#F8FAFC",
      lineHeight: 1.5,
    },
    authorTypography: { fontSize: 20, color: "#94A3B8", marginTop: 28 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isCustom: false,
  },
  {
    id: "tpl_nature_photo",
    name: "Nature",
    category: "photo",
    layout: "bottom",
    background: {
      type: "image",
      value:
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
    },
    textPosition: { x: 50, y: 80 },
    spacing: { paddingX: 8, paddingY: 6 },
    overlay: { enabled: true, color: "#000000", opacity: 0.4 },
    typography: {
      fontFamily: "Manrope, sans-serif",
      fontSize: 36,
      color: "#FFFFFF",
      lineHeight: 1.5,
    },
    authorTypography: {
      fontSize: 18,
      color: "rgba(255,255,255,0.8)",
      marginTop: 20,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isCustom: false,
  },
  {
    id: "tpl_forest_photo",
    name: "Forest",
    category: "photo",
    layout: "center",
    background: {
      type: "image",
      value:
        "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
    },
    textPosition: { x: 50, y: 50 },
    spacing: { paddingX: 10, paddingY: 10 },
    overlay: { enabled: true, color: "#000000", opacity: 0.5 },
    typography: {
      fontFamily: "Playfair Display, serif",
      fontSize: 38,
      color: "#FFFFFF",
      lineHeight: 1.5,
    },
    authorTypography: {
      fontSize: 18,
      color: "rgba(255,255,255,0.7)",
      marginTop: 24,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isCustom: false,
  },
];

// Category labels
export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  all: "Tất cả",
  minimal: "Tối giản",
  gradient: "Gradient",
  photo: "Ảnh nền",
  dark: "Tối màu",
  colorful: "Màu sắc",
};

// Layout labels
export const LAYOUT_LABELS: Record<TemplateLayout, string> = {
  center: "Giữa",
  bottom: "Dưới",
  "top-left": "Trên trái",
  "bottom-right": "Dưới phải",
};

// LocalStorage key
export const TEMPLATES_STORAGE_KEY = "vibequote_custom_templates";

// Helper functions
export const generateTemplateId = () =>
  `tpl_custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const saveTemplatesToStorage = (templates: TemplateConfig[]) => {
  const customTemplates = templates.filter((t) => t.isCustom);
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(customTemplates));
};

export const loadTemplatesFromStorage = (): TemplateConfig[] => {
  try {
    const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const exportTemplateAsJSON = (template: TemplateConfig): string => {
  return JSON.stringify(template, null, 2);
};

export const downloadTemplateJSON = (template: TemplateConfig) => {
  const json = exportTemplateAsJSON(template);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${template.name.toLowerCase().replace(/\s+/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
