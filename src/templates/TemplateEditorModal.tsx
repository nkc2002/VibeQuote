import { useState, useEffect } from "react";
import {
  TemplateConfig,
  TemplateLayout,
  LAYOUT_LABELS,
  generateTemplateId,
} from "./types";
import TemplatePreview from "./TemplatePreview";

interface TemplateEditorModalProps {
  isOpen: boolean;
  template: TemplateConfig | null;
  onSave: (template: TemplateConfig) => void;
  onClose: () => void;
}

const FONT_OPTIONS = [
  { name: "Syne", value: "Syne, sans-serif" },
  { name: "Manrope", value: "Manrope, sans-serif" },
  { name: "Inter", value: "Inter, sans-serif" },
  { name: "Playfair Display", value: "Playfair Display, serif" },
  { name: "Montserrat", value: "Montserrat, sans-serif" },
];

const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)",
];

const TemplateEditorModal = ({
  isOpen,
  template,
  onSave,
  onClose,
}: TemplateEditorModalProps) => {
  const [editedTemplate, setEditedTemplate] = useState<TemplateConfig | null>(
    null
  );

  useEffect(() => {
    if (template) {
      setEditedTemplate({ ...template });
    } else {
      // Create new template
      setEditedTemplate({
        id: generateTemplateId(),
        name: "New Template",
        category: "gradient",
        layout: "center",
        background: { type: "gradient", value: GRADIENT_PRESETS[0] },
        textPosition: { x: 50, y: 50 },
        spacing: { paddingX: 10, paddingY: 10 },
        overlay: { enabled: false, color: "#000000", opacity: 0.3 },
        typography: {
          fontFamily: "Syne, sans-serif",
          fontSize: 40,
          color: "#FFFFFF",
          lineHeight: 1.5,
        },
        authorTypography: {
          fontSize: 20,
          color: "rgba(255,255,255,0.7)",
          marginTop: 24,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isCustom: true,
      });
    }
  }, [template, isOpen]);

  if (!isOpen || !editedTemplate) return null;

  const handleChange = <K extends keyof TemplateConfig>(
    key: K,
    value: TemplateConfig[K]
  ) => {
    setEditedTemplate((prev) =>
      prev ? { ...prev, [key]: value, updatedAt: Date.now() } : null
    );
  };

  const handleNestedChange = (
    key:
      | "background"
      | "textPosition"
      | "spacing"
      | "overlay"
      | "typography"
      | "authorTypography",
    nestedKey: string,
    value: unknown
  ) => {
    setEditedTemplate((prev) => {
      if (!prev) return null;
      const currentValue = prev[key];
      if (typeof currentValue === "object" && currentValue !== null) {
        return {
          ...prev,
          [key]: { ...currentValue, [nestedKey]: value },
          updatedAt: Date.now(),
        };
      }
      return prev;
    });
  };

  const handleSave = () => {
    if (editedTemplate) {
      onSave({ ...editedTemplate, isCustom: true });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2
            id="modal-title"
            className="font-heading font-bold text-xl text-slate-900"
          >
            {template ? "Chỉnh sửa Template" : "Tạo Template Mới"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100
                       transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Preview panel */}
          <div className="w-1/2 p-6 bg-slate-50 flex flex-col">
            <h3 className="font-medium text-slate-700 mb-4">Preview</h3>
            <div className="flex-1 flex items-center justify-center">
              <TemplatePreview
                template={editedTemplate}
                width={480}
                height={270}
              />
            </div>
          </div>

          {/* Settings panel */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label
                  htmlFor="template-name"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Tên template
                </label>
                <input
                  id="template-name"
                  type="text"
                  value={editedTemplate.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg
                            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Layout */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Bố cục
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(LAYOUT_LABELS) as TemplateLayout[]).map(
                    (layout) => (
                      <button
                        key={layout}
                        onClick={() => {
                          handleChange("layout", layout);
                          // Update text position based on layout
                          const positions: Record<
                            TemplateLayout,
                            { x: number; y: number }
                          > = {
                            center: { x: 50, y: 50 },
                            bottom: { x: 50, y: 75 },
                            "top-left": { x: 25, y: 25 },
                            "bottom-right": { x: 75, y: 75 },
                          };
                          handleChange("textPosition", positions[layout]);
                        }}
                        className={`px-3 py-2 text-sm rounded-lg border-2 transition-all cursor-pointer
                        ${
                          editedTemplate.layout === layout
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-slate-200 hover:border-slate-300 text-slate-600"
                        }`}
                      >
                        {LAYOUT_LABELS[layout]}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Background */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nền
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {GRADIENT_PRESETS.map((gradient, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        handleChange("background", {
                          type: "gradient",
                          value: gradient,
                        })
                      }
                      className={`aspect-square rounded-lg border-2 transition-all cursor-pointer
                        ${
                          editedTemplate.background.value === gradient
                            ? "border-primary-500 scale-105"
                            : "border-transparent hover:scale-105"
                        }`}
                      style={{ background: gradient }}
                      aria-label={`Gradient ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Spacing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="padding-x"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Padding X: {editedTemplate.spacing.paddingX}%
                  </label>
                  <input
                    id="padding-x"
                    type="range"
                    min="5"
                    max="25"
                    value={editedTemplate.spacing.paddingX}
                    onChange={(e) =>
                      handleNestedChange(
                        "spacing",
                        "paddingX",
                        Number(e.target.value)
                      )
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label
                    htmlFor="padding-y"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Padding Y: {editedTemplate.spacing.paddingY}%
                  </label>
                  <input
                    id="padding-y"
                    type="range"
                    min="5"
                    max="25"
                    value={editedTemplate.spacing.paddingY}
                    onChange={(e) =>
                      handleNestedChange(
                        "spacing",
                        "paddingY",
                        Number(e.target.value)
                      )
                    }
                    className="w-full"
                  />
                </div>
              </div>

              {/* Overlay */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">
                    Overlay tối
                  </label>
                  <button
                    onClick={() =>
                      handleNestedChange(
                        "overlay",
                        "enabled",
                        !editedTemplate.overlay.enabled
                      )
                    }
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer
                      ${
                        editedTemplate.overlay.enabled
                          ? "bg-primary-500"
                          : "bg-slate-300"
                      }`}
                    role="switch"
                    aria-checked={editedTemplate.overlay.enabled}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform
                        ${
                          editedTemplate.overlay.enabled ? "translate-x-5" : ""
                        }`}
                    />
                  </button>
                </div>
                {editedTemplate.overlay.enabled && (
                  <div>
                    <label
                      htmlFor="overlay-opacity"
                      className="block text-sm text-slate-500 mb-2"
                    >
                      Độ tối: {Math.round(editedTemplate.overlay.opacity * 100)}
                      %
                    </label>
                    <input
                      id="overlay-opacity"
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={editedTemplate.overlay.opacity}
                      onChange={(e) =>
                        handleNestedChange(
                          "overlay",
                          "opacity",
                          Number(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Typography */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Font chữ
                </label>
                <select
                  value={editedTemplate.typography.fontFamily}
                  onChange={(e) =>
                    handleNestedChange(
                      "typography",
                      "fontFamily",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg cursor-pointer
                            focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="font-size"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Cỡ chữ: {editedTemplate.typography.fontSize}px
                </label>
                <input
                  id="font-size"
                  type="range"
                  min="24"
                  max="64"
                  value={editedTemplate.typography.fontSize}
                  onChange={(e) =>
                    handleNestedChange(
                      "typography",
                      "fontSize",
                      Number(e.target.value)
                    )
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="text-color"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Màu chữ
                </label>
                <input
                  id="text-color"
                  type="color"
                  value={editedTemplate.typography.color}
                  onChange={(e) =>
                    handleNestedChange("typography", "color", e.target.value)
                  }
                  className="w-16 h-10 rounded-lg border border-slate-300 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium
                       transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-primary-500 to-cta-500 text-white 
                       font-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Lưu template
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditorModal;
