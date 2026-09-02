import React, { useState } from 'react';
import { 
  Sliders, 
  Type, 
  Tag, 
  ListPlus, 
  Trash2, 
  Plus
} from 'lucide-react';
import { ThumbnailData } from '../types/thumbnail';

interface CustomizerDrawerProps {
  thumbnailData: ThumbnailData;
  onUpdateThumbnailData: (patch: Partial<ThumbnailData>) => void;
}

export const CustomizerDrawer: React.FC<CustomizerDrawerProps> = ({
  thumbnailData,
  onUpdateThumbnailData
}) => {
  const [newTopic, setNewTopic] = useState('');

  const handleAddTopic = () => {
    if (!newTopic.trim()) return;
    const current = thumbnailData.subtopics || [];
    if (current.length >= 4) return;
    onUpdateThumbnailData({
      subtopics: [...current, newTopic.trim()]
    });
    setNewTopic('');
  };

  const handleRemoveTopic = (index: number) => {
    const current = thumbnailData.subtopics || [];
    onUpdateThumbnailData({
      subtopics: current.filter((_, i) => i !== index)
    });
  };

  const STICKER_PRESETS: Array<ThumbnailData['extraSticker']> = [
    'LIVE',
    '100% MARKS',
    'PYQ SPECIAL',
    'NCERT BASED',
    'FREE PDF',
    'NONE'
  ];

  const FONT_OPTIONS: Array<ThumbnailData['fontFamily']> = [
    'Montserrat',
    'Bebas Neue',
    'Oswald',
    'Anton',
    'Outfit',
    'Poppins',
    'Bangers'
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 font-bold">
          <Sliders className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 sm:text-base">
            Bullet Topics, Badges & Fonts
          </h2>
          <p className="text-[11px] text-slate-500">
            Optional highlights, badges and typography
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* 1. Subtopic Highlights */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs font-bold text-slate-700">
              <ListPlus className="h-3.5 w-3.5 text-cyan-600" /> Key Topics (Max 3)
            </span>
            <span className="text-[10px] font-semibold text-slate-500">
              {thumbnailData.subtopics?.length || 0}/3
            </span>
          </div>

          <div className="space-y-1.5">
            {thumbnailData.subtopics?.map((topic, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 shadow-2xs">
                <span className="truncate font-medium">▶ {topic}</span>
                <button
                  onClick={() => handleRemoveTopic(idx)}
                  className="p-0.5 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}

            {(thumbnailData.subtopics?.length || 0) < 3 && (
              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                  placeholder="e.g. Top 10 PYQs"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAddTopic}
                  className="rounded-lg bg-slate-200 px-2 py-1 text-xs font-bold text-slate-800 hover:bg-slate-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Extra Badges & Stamps */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          <div className="mb-2 flex items-center gap-1 text-xs font-bold text-slate-700">
            <Tag className="h-3.5 w-3.5 text-red-600" /> Action Badge / Stamp
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {STICKER_PRESETS.map((sticker) => {
              const isSelected = thumbnailData.extraSticker === sticker;
              return (
                <button
                  key={sticker}
                  onClick={() => onUpdateThumbnailData({ extraSticker: sticker })}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${
                    isSelected
                      ? 'border-red-400 bg-red-50 text-red-700 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {sticker === 'LIVE' ? '🔴 LIVE' : sticker === 'NONE' ? '✕ None' : `⭐ ${sticker}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Font Selector */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          <div className="mb-2 flex items-center gap-1 text-xs font-bold text-slate-700">
            <Type className="h-3.5 w-3.5 text-cyan-600" /> Title Font
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {FONT_OPTIONS.map((font) => {
              const isSelected = thumbnailData.fontFamily === font;
              return (
                <button
                  key={font}
                  onClick={() => onUpdateThumbnailData({ fontFamily: font })}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-800 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
