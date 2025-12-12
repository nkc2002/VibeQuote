// Editor State Types and Mock Data

export interface TextLayer {
  id: string;
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number;
  fontFamily: string;
  color: string;
  opacity: number;
  isSelected: boolean;
}

export interface EditorState {
  // Canvas
  canvasWidth: number;
  canvasHeight: number;
  backgroundImage: string | null;
  backgroundImageId: string | null;
  backgroundGradient: string;

  // Text layers
  layers: TextLayer[];
  selectedLayerId: string | null;

  // Quote input
  quoteText: string;
  authorText: string;

  // Style settings
  template: "center" | "bottom";
  fontFamily: string;
  fontSize: number;
  textColor: string;
  boxOpacity: number;

  // History for undo/redo
  history: EditorHistoryItem[];
  historyIndex: number;

  // UI state
  isGenerating: boolean;
  isPreviewMode: boolean;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  activeRightTab: "template" | "style" | "image";
}

export interface EditorHistoryItem {
  layers: TextLayer[];
  backgroundImage: string | null;
  backgroundImageId: string | null;
  backgroundGradient: string;
}

// Action types
export type EditorAction =
  | { type: "SET_QUOTE"; payload: { text: string; author: string } }
  | { type: "SET_TEMPLATE"; payload: "center" | "bottom" }
  | { type: "SET_FONT_FAMILY"; payload: string }
  | { type: "SET_FONT_SIZE"; payload: number }
  | { type: "SET_TEXT_COLOR"; payload: string }
  | { type: "SET_BOX_OPACITY"; payload: number }
  | {
      type: "SET_BACKGROUND_IMAGE";
      payload: string | { url: string; id: string | null };
    }
  | { type: "SET_BACKGROUND_GRADIENT"; payload: string }
  | { type: "SELECT_LAYER"; payload: string | null }
  | { type: "MOVE_LAYER"; payload: { id: string; x: number; y: number } }
  | { type: "ADD_LAYER"; payload: TextLayer }
  | { type: "UPDATE_LAYER"; payload: Partial<TextLayer> & { id: string } }
  | { type: "DELETE_LAYER"; payload: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "TOGGLE_PREVIEW" }
  | { type: "SET_GENERATING"; payload: boolean }
  | { type: "TOGGLE_LEFT_SIDEBAR" }
  | { type: "TOGGLE_RIGHT_SIDEBAR" }
  | { type: "SET_RIGHT_TAB"; payload: "template" | "style" | "image" }
  | { type: "APPLY_QUOTE_TO_CANVAS" };

// Mock data
export const MOCK_QUOTES = [
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs",
  },
  {
    text: "Cuộc sống không phải là chờ đợi cơn bão đi qua, mà là học cách nhảy múa dưới mưa.",
    author: "Vivian Greene",
  },
  {
    text: "Thành công là đi từ thất bại này đến thất bại khác mà không mất đi sự nhiệt huyết.",
    author: "Winston Churchill",
  },
  {
    text: "Hãy là sự thay đổi mà bạn muốn thấy trong thế giới.",
    author: "Mahatma Gandhi",
  },
  {
    text: "Không gì là không thể với một trái tim kiên cường.",
    author: "Unknown",
  },
];

export const MOCK_FONTS = [
  { name: "Syne", value: "Syne, sans-serif" },
  { name: "Manrope", value: "Manrope, sans-serif" },
  { name: "Inter", value: "Inter, sans-serif" },
  { name: "Playfair Display", value: "Playfair Display, serif" },
  { name: "Montserrat", value: "Montserrat, sans-serif" },
  { name: "Roboto", value: "Roboto, sans-serif" },
];

export const MOCK_COLORS = [
  "#FFFFFF",
  "#000000",
  "#F8FAFC",
  "#0F172A",
  "#8B5CF6",
  "#EC4899",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#84CC16",
];

export const MOCK_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)",
  "linear-gradient(135deg, #232526 0%, #414345 100%)",
];

export const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80",
  "https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80",
];

// Initial state
export const initialEditorState: EditorState = {
  canvasWidth: 1920,
  canvasHeight: 1080,
  backgroundImage: null,
  backgroundImageId: null,
  backgroundGradient: MOCK_GRADIENTS[0],

  layers: [],
  selectedLayerId: null,

  quoteText: "",
  authorText: "",

  template: "center",
  fontFamily: MOCK_FONTS[0].value,
  fontSize: 48,
  textColor: "#FFFFFF",
  boxOpacity: 0,

  history: [],
  historyIndex: -1,

  isGenerating: false,
  isPreviewMode: false,
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  activeRightTab: "template",
};

// Helper to generate unique IDs
export const generateId = () =>
  `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Create layer from current settings
export const createTextLayer = (
  text: string,
  template: "center" | "bottom",
  fontFamily: string,
  fontSize: number,
  color: string,
  isAuthor: boolean = false
): TextLayer => {
  const yPosition =
    template === "center"
      ? isAuthor
        ? 55
        : 45 // Center: quote at 45%, author at 55%
      : isAuthor
      ? 85
      : 75; // Bottom: quote at 75%, author at 85%

  return {
    id: generateId(),
    text,
    x: 50, // Center horizontally
    y: yPosition,
    fontSize: isAuthor ? fontSize * 0.6 : fontSize,
    fontFamily,
    color,
    opacity: 1,
    isSelected: false,
  };
};
