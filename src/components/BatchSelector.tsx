import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Check, 
  Plus,
  Search
} from 'lucide-react';
import { BatchPreset, ThumbnailData } from '../types/thumbnail';
import { BATCH_PRESETS } from '../utils/sampleData';
import { SheetBatchRow } from '../utils/googleSheetSync';

interface BatchSelectorProps {
  currentBatchName: string;
  themeColor: string;
  syncedBatches?: SheetBatchRow[];
  onSelectBatch: (batch: BatchPreset) => void;
  onUpdateThumbnailData: (patch: Partial<ThumbnailData>) => void;
}

export const BatchSelector: React.FC<BatchSelectorProps> = ({
  currentBatchName,
  themeColor,
  syncedBatches = [],
  onSelectBatch,
  onUpdateThumbnailData
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customName, setCustomName] = useState('');

  const handleApplyCustomBatch = () => {
    if (!customName.trim()) return;
    onUpdateThumbnailData({
      batchName: customName.trim().toUpperCase()
    });
    setShowCustomInput(false);
  };

  const allBatches: BatchPreset[] = useMemo(() => {
    const sheetPresets: BatchPreset[] = syncedBatches.map(sb => ({
      id: sb.id,
      name: sb.name,
      tagline: sb.tagline,
      color: sb.color || '#06b6d4',
      badgeBg: '#ffffff',
      badgeText: '#000000',
      targetExam: 'JEE / NEET'
    }));

    return [...sheetPresets, ...BATCH_PRESETS];
  }, [syncedBatches]);

  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) return allBatches;
    const q = searchQuery.toLowerCase().trim();
    return allBatches.filter(b => b.name.toLowerCase().includes(q) || b.tagline.toLowerCase().includes(q));
  }, [allBatches, searchQuery]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700 font-bold">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                Batch & Course Presets
              </h2>
              {syncedBatches.length > 0 && (
                <span className="rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                  {syncedBatches.length} From Sheet
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Select batch series (SIP, Arjuna, Lakshya, Yakeen, Prayas)
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-800"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Custom Batch</span>
        </button>
      </div>

      {/* Batch Search */}
      <div className="mb-3 relative">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search batch by code or series (e.g. SIP, Lakshya, Arjuna)..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8.5 pr-3.5 py-1.5 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-500"
        />
      </div>

      {showCustomInput && (
        <div className="mb-3 flex gap-2 rounded-xl border border-purple-200 bg-purple-50/60 p-2.5">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Type Batch Name (e.g. SANKALP JEE 2026)"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-purple-500"
          />
          <button
            onClick={handleApplyCustomBatch}
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700"
          >
            Apply
          </button>
        </div>
      )}

      {/* Batch Cards Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {filteredBatches.map((batch) => {
          const isSelected = currentBatchName.toLowerCase() === batch.name.toLowerCase() ||
                             currentBatchName.toLowerCase().startsWith(batch.name.split(' ')[0].toLowerCase());

          return (
            <button
              key={batch.id}
              onClick={() => onSelectBatch(batch)}
              className={`group relative flex flex-col rounded-xl border p-2.5 text-left transition-all ${
                isSelected
                  ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/60 shadow-xs'
                  : 'border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: batch.color }}
                />
                {isSelected && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-white">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="mt-1 text-xs font-bold text-slate-900 group-hover:text-purple-700">
                {batch.name}
              </div>
              <div className="mt-0.5 truncate text-[10px] text-slate-500">
                {batch.tagline}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
