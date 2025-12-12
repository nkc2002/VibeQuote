import {
  EditorState,
  EditorAction,
  createTextLayer,
  EditorHistoryItem,
} from "./types";

// Save current state to history
const saveToHistory = (state: EditorState): EditorHistoryItem => ({
  layers: JSON.parse(JSON.stringify(state.layers)),
  backgroundImage: state.backgroundImage,
  backgroundImageId: state.backgroundImageId,
  backgroundGradient: state.backgroundGradient,
});

// Editor reducer
export function editorReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  switch (action.type) {
    case "SET_QUOTE":
      return {
        ...state,
        quoteText: action.payload.text,
        authorText: action.payload.author,
      };

    case "APPLY_QUOTE_TO_CANVAS": {
      // Save current state to history before making changes
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        saveToHistory(state),
      ];

      // Create new layers for quote and author
      const quoteLayers = [];

      if (state.quoteText.trim()) {
        quoteLayers.push(
          createTextLayer(
            `"${state.quoteText}"`,
            state.template,
            state.fontFamily,
            state.fontSize,
            state.textColor,
            false
          )
        );
      }

      if (state.authorText.trim()) {
        quoteLayers.push(
          createTextLayer(
            `— ${state.authorText}`,
            state.template,
            state.fontFamily,
            state.fontSize,
            state.textColor,
            true
          )
        );
      }

      return {
        ...state,
        layers: [...state.layers, ...quoteLayers],
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case "SET_TEMPLATE":
      return { ...state, template: action.payload };

    case "SET_FONT_FAMILY": {
      // Update all layers with new font
      const updatedLayers = state.layers.map((layer) => ({
        ...layer,
        fontFamily: action.payload,
      }));
      return { ...state, fontFamily: action.payload, layers: updatedLayers };
    }

    case "SET_FONT_SIZE": {
      // Update all layers with new font size (maintaining ratio for author)
      const updatedLayers = state.layers.map((layer) => ({
        ...layer,
        fontSize: layer.text.startsWith("—")
          ? action.payload * 0.6
          : action.payload,
      }));
      return { ...state, fontSize: action.payload, layers: updatedLayers };
    }

    case "SET_TEXT_COLOR": {
      // Update all layers with new color
      const updatedLayers = state.layers.map((layer) => ({
        ...layer,
        color: action.payload,
      }));
      return { ...state, textColor: action.payload, layers: updatedLayers };
    }

    case "SET_BOX_OPACITY":
      return { ...state, boxOpacity: action.payload };

    case "SET_BACKGROUND_IMAGE": {
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        saveToHistory(state),
      ];

      let imageUrl: string | null = null;
      let imageId: string | null = null;

      if (typeof action.payload === "string") {
        imageUrl = action.payload || null;
        imageId = null; // Reset ID if just URL or clearing
      } else {
        imageUrl = action.payload.url;
        imageId = action.payload.id;
      }

      return {
        ...state,
        backgroundImage: imageUrl,
        backgroundImageId: imageId,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case "SET_BACKGROUND_GRADIENT": {
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        saveToHistory(state),
      ];
      return {
        ...state,
        backgroundGradient: action.payload,
        backgroundImage: null, // Clear image when setting gradient
        backgroundImageId: null,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case "SELECT_LAYER":
      return {
        ...state,
        selectedLayerId: action.payload,
        layers: state.layers.map((layer) => ({
          ...layer,
          isSelected: layer.id === action.payload,
        })),
      };

    case "MOVE_LAYER": {
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        saveToHistory(state),
      ];

      return {
        ...state,
        layers: state.layers.map((layer) =>
          layer.id === action.payload.id
            ? { ...layer, x: action.payload.x, y: action.payload.y }
            : layer
        ),
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case "ADD_LAYER": {
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        saveToHistory(state),
      ];

      return {
        ...state,
        layers: [...state.layers, action.payload],
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case "UPDATE_LAYER": {
      return {
        ...state,
        layers: state.layers.map((layer) =>
          layer.id === action.payload.id
            ? { ...layer, ...action.payload }
            : layer
        ),
      };
    }

    case "RESIZE_LAYER": {
      // Update layer's width/height and optionally position
      const { id, width, height, x, y } = action.payload;
      return {
        ...state,
        layers: state.layers.map((layer) =>
          layer.id === id
            ? {
                ...layer,
                width,
                height,
                ...(x !== undefined && { x }),
                ...(y !== undefined && { y }),
              }
            : layer
        ),
      };
    }

    case "DELETE_LAYER": {
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        saveToHistory(state),
      ];

      return {
        ...state,
        layers: state.layers.filter((layer) => layer.id !== action.payload),
        selectedLayerId:
          state.selectedLayerId === action.payload
            ? null
            : state.selectedLayerId,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case "UNDO": {
      if (state.historyIndex < 0) return state;

      const previousState = state.history[state.historyIndex];
      return {
        ...state,
        layers: previousState.layers,
        backgroundImage: previousState.backgroundImage,
        backgroundImageId: previousState.backgroundImageId,
        backgroundGradient: previousState.backgroundGradient,
        historyIndex: state.historyIndex - 1,
      };
    }

    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state;

      const nextState = state.history[state.historyIndex + 1];
      return {
        ...state,
        layers: nextState.layers,
        backgroundImage: nextState.backgroundImage,
        backgroundImageId: nextState.backgroundImageId,
        backgroundGradient: nextState.backgroundGradient,
        historyIndex: state.historyIndex + 1,
      };
    }

    case "TOGGLE_PREVIEW":
      return { ...state, isPreviewMode: !state.isPreviewMode };

    case "SET_GENERATING":
      return { ...state, isGenerating: action.payload };

    case "TOGGLE_LEFT_SIDEBAR":
      return { ...state, leftSidebarOpen: !state.leftSidebarOpen };

    case "TOGGLE_RIGHT_SIDEBAR":
      return { ...state, rightSidebarOpen: !state.rightSidebarOpen };

    case "SET_RIGHT_TAB":
      return { ...state, activeRightTab: action.payload };

    default:
      return state;
  }
}
