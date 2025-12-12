import { useReducer, useEffect, useCallback } from "react";
import { initialEditorState } from "./types";
import { editorReducer } from "./reducer";
import Toolbar from "./Toolbar";
import QuotePanel from "./QuotePanel";
import Canvas from "./Canvas";
import StylePanel from "./StylePanel";
import { videosApi } from "../api";

const EditorPage = () => {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "UNDO" });
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        (e.ctrlKey && e.key === "y") ||
        (e.ctrlKey && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        dispatch({ type: "REDO" });
      }
      // Preview: Ctrl+P
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        dispatch({ type: "TOGGLE_PREVIEW" });
      }
      // Escape: Exit preview or deselect
      if (e.key === "Escape") {
        if (state.isPreviewMode) {
          dispatch({ type: "TOGGLE_PREVIEW" });
        } else if (state.selectedLayerId) {
          dispatch({ type: "SELECT_LAYER", payload: null });
        }
      }
      // Delete: Remove selected layer
      if (e.key === "Delete" && state.selectedLayerId) {
        dispatch({ type: "DELETE_LAYER", payload: state.selectedLayerId });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isPreviewMode, state.selectedLayerId]);

  // Handlers
  const handleSetQuote = useCallback((text: string, author: string) => {
    dispatch({ type: "SET_QUOTE", payload: { text, author } });
  }, []);

  const handleApplyToCanvas = useCallback(() => {
    dispatch({ type: "APPLY_QUOTE_TO_CANVAS" });
  }, []);

  const handleSelectLayer = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_LAYER", payload: id });
  }, []);

  const handleMoveLayer = useCallback((id: string, x: number, y: number) => {
    dispatch({ type: "MOVE_LAYER", payload: { id, x, y } });
  }, []);

  const handleGenerate = useCallback(async () => {
    // Validation
    if (!state.backgroundImage) {
      alert("Vui lòng chọn một hình nền trước khi tạo video.");
      return;
    }

    if (!state.quoteText && !state.authorText) {
      alert("Vui lòng nhập nội dung quote trước khi tạo video.");
      return;
    }

    dispatch({ type: "SET_GENERATING", payload: true });

    try {
      // Build the wrappedText with quote and author
      const quoteWithAuthor =
        state.quoteText + (state.authorText ? `\n\n— ${state.authorText}` : "");

      // Build Canvas-matching payload for precise video rendering
      const renderPayload = {
        quote: state.quoteText,
        wrappedText: quoteWithAuthor,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        fontFamily: state.fontFamily.split(",")[0].trim(), // Get first font name
        fontSize: state.fontSize,
        fontColor: `rgba(${hexToRgb(state.textColor)},1)`,
        textAlign: "center" as const,
        textBox: {
          // Center for 'center' template, bottom for 'bottom' template
          x: state.canvasWidth / 2,
          y:
            state.template === "center"
              ? state.canvasHeight / 2
              : state.canvasHeight * 0.75,
        },
        backgroundImageUrl: state.backgroundImage,
        backgroundBrightness: 1 - state.boxOpacity, // Convert overlay opacity to brightness
        backgroundBlur: 0,
        gradientOverlay: {
          enabled: state.boxOpacity > 0,
          direction: "top-bottom" as const,
          startColor: `rgba(0,0,0,${state.boxOpacity})`,
          endColor: `rgba(0,0,0,${state.boxOpacity * 0.5})`,
        },
        animation: {
          type: "subtle-zoom" as const,
          zoomStart: 1.05,
          zoomEnd: 1.0,
          fadeText: true,
          fadeDuration: 0.8,
        },
        duration: 6,
      };

      const response = await fetch("/api/render-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(renderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate video");
      }

      // Handle download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vibequote-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      // Save video metadata to MongoDB via API (including style for consistent regeneration)
      try {
        await videosApi.create({
          thumbnail: state.backgroundImage || "",
          quoteText: state.quoteText,
          authorText: state.authorText || "",
          templateId: state.template || "center",
          templateName: state.template === "center" ? "Center" : "Bottom",
          // Save style parameters for identical regeneration
          fontSize: state.fontSize,
          fontFamily: state.fontFamily,
          textColor: state.textColor,
          boxOpacity: state.boxOpacity,
          canvasWidth: state.canvasWidth,
          canvasHeight: state.canvasHeight,
        });
        console.log("Video saved to database");
      } catch (saveError) {
        console.error("Failed to save video to database:", saveError);
      }

      // Success feedback
      console.log("Video generated successfully");
    } catch (error) {
      console.error("Video generation error:", error);
      alert(
        error instanceof Error ? error.message : "Có lỗi xảy ra khi tạo video"
      );
    } finally {
      dispatch({ type: "SET_GENERATING", payload: false });
    }
  }, [
    state.backgroundImage,
    state.quoteText,
    state.authorText,
    state.template,
    state.fontSize,
    state.textColor,
    state.boxOpacity,
    state.fontFamily,
    state.canvasWidth,
    state.canvasHeight,
  ]);

  // Helper function to convert hex color to RGB
  function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(
        result[3],
        16
      )}`;
    }
    return "255,255,255";
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Toolbar */}
      <Toolbar
        canUndo={state.historyIndex >= 0}
        canRedo={state.historyIndex < state.history.length - 1}
        isPreviewMode={state.isPreviewMode}
        isGenerating={state.isGenerating}
        onUndo={() => dispatch({ type: "UNDO" })}
        onRedo={() => dispatch({ type: "REDO" })}
        onTogglePreview={() => dispatch({ type: "TOGGLE_PREVIEW" })}
        onGenerate={handleGenerate}
        onToggleLeftSidebar={() => dispatch({ type: "TOGGLE_LEFT_SIDEBAR" })}
        onToggleRightSidebar={() => dispatch({ type: "TOGGLE_RIGHT_SIDEBAR" })}
        leftSidebarOpen={state.leftSidebarOpen}
        rightSidebarOpen={state.rightSidebarOpen}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Quote Panel */}
        <aside
          className={`w-80 flex-shrink-0 bg-slate-900 border-r border-slate-700 
                     transition-all duration-300 ease-out overflow-hidden
                     ${
                       state.leftSidebarOpen
                         ? "translate-x-0"
                         : "-translate-x-full"
                     }
                     fixed lg:relative lg:translate-x-0 inset-y-0 left-0 z-40 top-[57px] lg:top-0
                     ${!state.leftSidebarOpen && "lg:w-0 lg:border-0"}`}
          aria-label="Quote panel"
          aria-hidden={!state.leftSidebarOpen}
        >
          <div
            className={`w-80 h-full ${!state.leftSidebarOpen && "lg:hidden"}`}
          >
            <QuotePanel
              quoteText={state.quoteText}
              authorText={state.authorText}
              onSetQuote={handleSetQuote}
              onApplyToCanvas={handleApplyToCanvas}
            />
          </div>
        </aside>

        {/* Mobile overlay for left sidebar */}
        {state.leftSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => dispatch({ type: "TOGGLE_LEFT_SIDEBAR" })}
            aria-hidden="true"
          />
        )}

        {/* Canvas area */}
        <main
          className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-auto"
          aria-label="Canvas editing area"
        >
          <div className="w-full max-w-5xl">
            <Canvas
              layers={state.layers}
              backgroundImage={state.backgroundImage}
              backgroundGradient={state.backgroundGradient}
              boxOpacity={state.boxOpacity}
              selectedLayerId={state.selectedLayerId}
              isPreviewMode={state.isPreviewMode}
              onSelectLayer={handleSelectLayer}
              onMoveLayer={handleMoveLayer}
            />

            {/* Canvas info */}
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>{state.layers.length} layer(s)</span>
              <span>16:9 • 1920×1080</span>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Style Panel */}
        <aside
          className={`w-80 flex-shrink-0 bg-slate-900 border-l border-slate-700 
                     transition-all duration-300 ease-out overflow-hidden
                     ${
                       state.rightSidebarOpen
                         ? "translate-x-0"
                         : "translate-x-full"
                     }
                     fixed lg:relative lg:translate-x-0 inset-y-0 right-0 z-40 top-[57px] lg:top-0
                     ${!state.rightSidebarOpen && "lg:w-0 lg:border-0"}`}
          aria-label="Style panel"
          aria-hidden={!state.rightSidebarOpen}
        >
          <div
            className={`w-80 h-full ${!state.rightSidebarOpen && "lg:hidden"}`}
          >
            <StylePanel
              activeTab={state.activeRightTab}
              template={state.template}
              fontFamily={state.fontFamily}
              fontSize={state.fontSize}
              textColor={state.textColor}
              boxOpacity={state.boxOpacity}
              backgroundGradient={state.backgroundGradient}
              backgroundImage={state.backgroundImage}
              onSetTab={(tab) =>
                dispatch({ type: "SET_RIGHT_TAB", payload: tab })
              }
              onSetTemplate={(template) =>
                dispatch({ type: "SET_TEMPLATE", payload: template })
              }
              onSetFontFamily={(font) =>
                dispatch({ type: "SET_FONT_FAMILY", payload: font })
              }
              onSetFontSize={(size) =>
                dispatch({ type: "SET_FONT_SIZE", payload: size })
              }
              onSetTextColor={(color) =>
                dispatch({ type: "SET_TEXT_COLOR", payload: color })
              }
              onSetBoxOpacity={(opacity) =>
                dispatch({ type: "SET_BOX_OPACITY", payload: opacity })
              }
              onSetBackgroundGradient={(gradient) =>
                dispatch({ type: "SET_BACKGROUND_GRADIENT", payload: gradient })
              }
              onSetBackgroundImage={(image) =>
                dispatch({ type: "SET_BACKGROUND_IMAGE", payload: image })
              }
            />
          </div>
        </aside>

        {/* Mobile overlay for right sidebar */}
        {state.rightSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => dispatch({ type: "TOGGLE_RIGHT_SIDEBAR" })}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Keyboard shortcuts help */}
      <div className="hidden lg:flex items-center justify-center gap-6 py-2 bg-slate-900/80 border-t border-slate-800 text-xs text-slate-500">
        <span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
            Ctrl+Z
          </kbd>{" "}
          Undo
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
            Ctrl+Y
          </kbd>{" "}
          Redo
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
            Ctrl+P
          </kbd>{" "}
          Preview
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
            Arrow keys
          </kbd>{" "}
          Move layer
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
            Shift+Arrow
          </kbd>{" "}
          Move faster
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
            Delete
          </kbd>{" "}
          Remove layer
        </span>
      </div>
    </div>
  );
};

export default EditorPage;
