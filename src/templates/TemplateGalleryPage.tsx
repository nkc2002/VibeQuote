import { useState, useEffect, useMemo } from "react";
import {
  TemplateConfig,
  TemplateCategory,
  DEFAULT_TEMPLATES,
  CATEGORY_LABELS,
  loadTemplatesFromStorage,
  saveTemplatesToStorage,
} from "./types";
import TemplateCard from "./TemplateCard";
import TemplateEditorModal from "./TemplateEditorModal";

const TemplateGalleryPage = () => {
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<TemplateCategory>("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateConfig | null>(
    null
  );

  // Load templates on mount
  useEffect(() => {
    const customTemplates = loadTemplatesFromStorage();
    setTemplates([...DEFAULT_TEMPLATES, ...customTemplates]);
  }, []);

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "all") return templates;
    return templates.filter((t) => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  // Handlers
  const handleOpenEditor = (template: TemplateConfig | null) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingTemplate(null);
  };

  const handleSaveTemplate = (template: TemplateConfig) => {
    setTemplates((prev) => {
      const existingIndex = prev.findIndex((t) => t.id === template.id);
      let newTemplates;
      if (existingIndex >= 0) {
        newTemplates = [...prev];
        newTemplates[existingIndex] = template;
      } else {
        newTemplates = [...prev, template];
      }
      // Save custom templates to localStorage
      saveTemplatesToStorage(newTemplates);
      return newTemplates;
    });
    handleCloseEditor();
  };

  const handleDeleteTemplate = (template: TemplateConfig) => {
    setTemplates((prev) => {
      const newTemplates = prev.filter((t) => t.id !== template.id);
      saveTemplatesToStorage(newTemplates);
      return newTemplates;
    });
  };

  const handleSelectTemplate = (template: TemplateConfig) => {
    // Navigate to editor with this template
    window.location.hash = "#/editor";
    // In a real app, you'd pass the template config via context or state management
    console.log("Selected template:", template);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page title */}
      <div className="bg-white border-b border-slate-200">
        <div className="container-custom py-6">
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900">
            Template Gallery
          </h1>
          <p className="text-slate-600 mt-1">
            Chọn template để bắt đầu tạo video quote
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="container-custom">
          <div
            className="flex items-center gap-1 overflow-x-auto py-3 -mx-4 px-4 sm:mx-0 sm:px-0"
            role="tablist"
            aria-label="Template categories"
          >
            {(Object.keys(CATEGORY_LABELS) as TemplateCategory[]).map(
              (category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  role="tab"
                  aria-selected={selectedCategory === category}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer
                  ${
                    selectedCategory === category
                      ? "bg-primary-500 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {CATEGORY_LABELS[category]}
                  {category !== "all" && (
                    <span className="ml-1.5 text-xs opacity-70">
                      ({templates.filter((t) => t.category === category).length}
                      )
                    </span>
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <main className="container-custom py-8">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 mx-auto text-slate-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
            <p className="text-slate-500">
              Không có template nào trong danh mục này
            </p>
            <button
              onClick={() => handleOpenEditor(null)}
              className="mt-4 text-primary-600 font-medium hover:text-primary-700 cursor-pointer"
            >
              Tạo template đầu tiên →
            </button>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            role="list"
            aria-label="Templates"
          >
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleOpenEditor}
                onDelete={template.isCustom ? handleDeleteTemplate : undefined}
                onSelect={handleSelectTemplate}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 text-center text-sm text-slate-500">
          <p>
            Hiển thị {filteredTemplates.length} / {templates.length} templates
            {templates.filter((t) => t.isCustom).length > 0 && (
              <>
                {" "}
                • {templates.filter((t) => t.isCustom).length} custom templates
              </>
            )}
          </p>
        </div>
      </main>

      {/* Template Editor Modal */}
      <TemplateEditorModal
        isOpen={isEditorOpen}
        template={editingTemplate}
        onSave={handleSaveTemplate}
        onClose={handleCloseEditor}
      />
    </div>
  );
};

export default TemplateGalleryPage;
