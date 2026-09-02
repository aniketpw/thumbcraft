import React, { useState } from 'react';
import { 
  Palette, 
  Upload, 
  Check
} from 'lucide-react';
import { TemplateStyle } from '../types/thumbnail';
import { TEMPLATE_DEFINITIONS, TemplateDefinition } from '../utils/sampleData';

interface TemplateSelectorProps {
  currentTemplate: TemplateStyle;
  customBgImage?: string;
  onSelectTemplate: (template: TemplateDefinition) => void;
  onUploadCustomBg: (base64Url: string) => void;
  onClearCustomBg: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  currentTemplate,
  customBgImage,
  onSelectTemplate,
  onUploadCustomBg,
  onClearCustomBg
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'PW Official', 'High CTR', 'Batch Series', 'Exam Special'];

  const filteredTemplates = activeCategory === 'All'
    ? TEMPLATE_DEFINITIONS
    : TEMPLATE_DEFINITIONS.filter(t => t.category === activeCategory);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onUploadCustomBg(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold">
            <Palette className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              Thumbnail Template Style
            </h2>
            <p className="text-[11px] text-slate-500">
              Official PW layout or other EdTech series styles
            </p>
          </div>
        </div>

        {/* Custom Background Upload */}
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-indigo-400">
            <Upload className="h-3.5 w-3.5 text-indigo-600" />
            <span>Upload Custom BG</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          {customBgImage && (
            <button
              onClick={onClearCustomBg}
              className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              Reset BG
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {filteredTemplates.map((template) => {
          const isSelected = currentTemplate === template.id && !customBgImage;

          return (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-white'
              }`}
            >
              {/* Visual Mini Banner Preview */}
              <div className={`relative h-16 w-full bg-gradient-to-br ${template.previewGradient} p-2 flex flex-col justify-between overflow-hidden`}>
                {template.id === 'pw_official_torn' ? (
                  <img 
                    src="/pw_official_template.png" 
                    alt="PW Official Template" 
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div 
                    className="absolute -right-4 -bottom-4 h-14 w-14 rounded-full blur-xl opacity-50"
                    style={{ backgroundColor: template.themeColor }}
                  />
                )}

                <div className="relative z-10 flex items-center justify-between">
                  <span className="rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-extrabold text-white backdrop-blur">
                    {template.category}
                  </span>
                  {isSelected && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div className="relative z-10 text-[10px] font-black text-white drop-shadow truncate">
                  {template.id === 'pw_official_torn' ? 'OFFICIAL PW LAYOUT' : 'LEC 04 • CHAPTER'}
                </div>
              </div>

              {/* Template Info */}
              <div className="p-2.5 bg-white flex-1">
                <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                  {template.name}
                </div>
                <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">
                  {template.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
