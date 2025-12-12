import { useState, useEffect } from "react";
import { UserSettings, getSettings, saveSettings } from "./db";
import { DEFAULT_TEMPLATES } from "../templates/types";
import { MOCK_FONTS } from "../editor/types";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: () => void;
}

const SettingsPanel = ({
  isOpen,
  onClose,
  onSettingsChange,
}: SettingsPanelProps) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const loaded = await getSettings();
      setSettings(
        loaded || {
          id: "user_settings",
          defaultTemplateId: "tpl_gradient_purple",
          defaultFontFamily: "Syne, sans-serif",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      );
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await saveSettings(settings);
      onSettingsChange();
      onClose();
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Không thể lưu cài đặt. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2
            id="settings-title"
            className="font-heading font-bold text-xl text-slate-900"
          >
            Cài đặt
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
        <div className="p-6 space-y-6">
          {/* Default template */}
          <div>
            <label
              htmlFor="default-template"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Template mặc định
            </label>
            <select
              id="default-template"
              value={settings?.defaultTemplateId || ""}
              onChange={(e) =>
                setSettings((prev) =>
                  prev ? { ...prev, defaultTemplateId: e.target.value } : null
                )
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg cursor-pointer
                        focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {DEFAULT_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Template này sẽ được chọn sẵn khi tạo video mới
            </p>
          </div>

          {/* Default font */}
          <div>
            <label
              htmlFor="default-font"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Font chữ mặc định
            </label>
            <select
              id="default-font"
              value={settings?.defaultFontFamily || ""}
              onChange={(e) =>
                setSettings((prev) =>
                  prev ? { ...prev, defaultFontFamily: e.target.value } : null
                )
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg cursor-pointer
                        focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {MOCK_FONTS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Font này sẽ được sử dụng mặc định cho quote
            </p>
          </div>

          {/* Storage info */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Lưu trữ</h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Dữ liệu được lưu tại</span>
                <span className="font-mono text-xs bg-slate-200 px-2 py-1 rounded">
                  IndexedDB
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Tất cả video và cài đặt được lưu trữ cục bộ trên trình duyệt của
                bạn. Xóa dữ liệu trình duyệt sẽ xóa tất cả video đã lưu.
              </p>
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
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-primary-500 to-cta-500 text-white 
                       font-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer
                       disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
