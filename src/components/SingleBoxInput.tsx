import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardCheck, 
  Zap, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  Upload,
  BookOpen,
  Hash,
  Sparkles,
  Layers,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { SubjectType, ThumbnailData } from '../types/thumbnail';
import { findMatchingChapterTags, getClassChapters } from '../utils/chapterTagMatcher';

interface SingleBoxInputProps {
  inputValue?: string;
  onInputChange?: (val: string) => void;
  thumbnailData: ThumbnailData;
  onUpdateThumbnailData: (patch: Partial<ThumbnailData>) => void;
  onUploadCustomBg?: (base64Url: string) => void;
  onClearCustomBg?: () => void;
}

export const SingleBoxInput: React.FC<SingleBoxInputProps> = ({
  thumbnailData,
  onUpdateThumbnailData,
  onUploadCustomBg,
  onClearCustomBg
}) => {
  const [showSeparateFields, setShowSeparateFields] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [showSyllabusBrowser, setShowSyllabusBrowser] = useState(false);

  // Match Chapter Tag & Wing live against 1410 official Google Sheet chapters with Batch Code / Air Batch filter
  const tagMatchResult = useMemo(() => {
    return findMatchingChapterTags(thumbnailData.chapterTitle, thumbnailData.subject, thumbnailData.batchName);
  }, [thumbnailData.chapterTitle, thumbnailData.subject, thumbnailData.batchName]);

  // All official chapters belonging to the active batch's class & subject
  const classSyllabusChapters = useMemo(() => {
    if (!tagMatchResult.detectedBatchInfo?.className) return [];
    return getClassChapters(
      tagMatchResult.detectedBatchInfo.className,
      thumbnailData.subject,
      tagMatchResult.detectedBatchInfo.isAirBatch
    );
  }, [tagMatchResult.detectedBatchInfo, thumbnailData.subject]);

  // Check if current chapterTitle is already an exact applied official match
  const appliedMatch = useMemo(() => {
    return tagMatchResult.matches.find(m => 
      thumbnailData.chapterTitle.trim().toLowerCase() === m.item.chapterName.trim().toLowerCase() ||
      thumbnailData.chapterTitle.trim().toLowerCase() === m.item.tagName.trim().toLowerCase()
    );
  }, [tagMatchResult.matches, thumbnailData.chapterTitle]);

  const handleCopyTag = async (tagName: string) => {
    try {
      await navigator.clipboard.writeText(tagName);
      setCopiedTag(tagName);
      setTimeout(() => setCopiedTag(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleApplyOfficialChapter = (officialChapterName: string) => {
    onUpdateThumbnailData({ chapterTitle: officialChapterName });
    const newCombined = buildCombinedString(officialChapterName, thumbnailData.lectureNo, thumbnailData.topicDescription);
    setCombinedInput(newCombined);
  };

  // Unified string representation: "Chapter Title - Lec No : Topic Description"
  const buildCombinedString = (chapter: string, lec: string, topic: string) => {
    let str = chapter || '';
    if (lec) str += ` - ${lec}`;
    if (topic) str += ` : ${topic}`;
    return str;
  };

  const [combinedInput, setCombinedInput] = useState(() => 
    buildCombinedString(thumbnailData.chapterTitle, thumbnailData.lectureNo, thumbnailData.topicDescription)
  );

  // Sync internal combinedInput when external thumbnailData changes (e.g. from batch generator)
  useEffect(() => {
    const expected = buildCombinedString(thumbnailData.chapterTitle, thumbnailData.lectureNo, thumbnailData.topicDescription);
    setCombinedInput(expected);
  }, [thumbnailData.chapterTitle, thumbnailData.lectureNo, thumbnailData.topicDescription]);

  // Smart Parser for "Chapter Title - Lec No : Topic Description"
  const handleCombinedChange = (val: string) => {
    setCombinedInput(val);

    let clean = val.trim();
    if (!clean) {
      onUpdateThumbnailData({ chapterTitle: '', lectureNo: '', topicDescription: '' });
      return;
    }

    let chapter = '';
    let lec = '';
    let topic = '';

    if (clean.includes(':')) {
      const colonSplit = clean.split(':');
      topic = colonSplit.slice(1).join(':').trim();
      const leftPart = colonSplit[0].trim();

      if (leftPart.includes('-')) {
        const dashIdx = leftPart.lastIndexOf('-');
        chapter = leftPart.substring(0, dashIdx).trim();
        const rawLec = leftPart.substring(dashIdx + 1).trim();
        // Extract lecture digits or clean string
        const lecMatch = rawLec.match(/\d+/) || [rawLec];
        lec = lecMatch[0] || rawLec;
      } else {
        chapter = leftPart;
      }
    } else if (clean.includes('-')) {
      const dashIdx = clean.lastIndexOf('-');
      chapter = clean.substring(0, dashIdx).trim();
      const rawLec = clean.substring(dashIdx + 1).trim();
      const lecMatch = rawLec.match(/\d+/) || [rawLec];
      lec = lecMatch[0] || rawLec;
    } else {
      chapter = clean;
    }

    onUpdateThumbnailData({
      chapterTitle: chapter || clean,
      lectureNo: lec,
      topicDescription: topic
    });
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleCombinedChange(text);
      }
    } catch {
      // Fallback
    }
  };

  const handleTemplateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadCustomBg) return;

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
      {/* Header */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 font-bold">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              Lecture & Thumbnail Details
            </h2>
            <p className="text-[11px] text-slate-500">
              Enter Chapter Title, Lecture Number, Topic and Batch Code
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePasteClipboard}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs"
            title="Paste lecture string from clipboard"
          >
            <ClipboardCheck className="h-3.5 w-3.5 text-cyan-600" />
            <span>Paste Clip</span>
          </button>

          {onUploadCustomBg && (
            <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs">
              <Upload className="h-3.5 w-3.5 text-cyan-600" />
              <span>{thumbnailData.customBgImage ? 'Change Template' : 'Upload Template'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleTemplateFileUpload}
              />
            </label>
          )}

          {thumbnailData.customBgImage && onClearCustomBg && (
            <button
              onClick={onClearCustomBg}
              className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 1. Unified Main Title, Lecture & Topic Input Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-cyan-600" />
            <span>Chapter Title, Lecture Number & Topic Description</span>
          </label>
          <button
            type="button"
            onClick={() => setShowSeparateFields(!showSeparateFields)}
            className="flex items-center gap-1 text-[11px] font-semibold text-cyan-700 hover:text-cyan-800"
          >
            <Edit3 className="h-3 w-3" />
            <span>{showSeparateFields ? 'Hide Separate Boxes' : 'Edit in 3 Separate Boxes'}</span>
            {showSeparateFields ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        <div className="relative">
          <textarea
            rows={2}
            value={combinedInput}
            onChange={(e) => handleCombinedChange(e.target.value)}
            placeholder="e.g. Chemical Bonding and Molecular Structure - 11 : Reason for Hybridisaton"
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3.5 text-[15px] font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100 shadow-2xs resize-y min-h-[68px] leading-relaxed"
          />
          {combinedInput && (
            <button
              onClick={() => handleCombinedChange('')}
              className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Clear text"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Official Tag & Wing Validator (Compact & Scroll-Free) */}
        {thumbnailData.chapterTitle && (
          <div>
            {/* 1. Ultra-Compact 1-Line Verified Banner when an official match is already applied */}
            {appliedMatch && !showAllSuggestions ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50/90 border border-emerald-300 p-2.5 shadow-2xs animate-fadeIn">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-black shrink-0">
                    ✓
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="font-bold text-emerald-950">{appliedMatch.item.chapterName}</span>
                    <span className="font-mono text-[11px] text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-1.5 py-0.2 rounded shrink-0">
                      {appliedMatch.item.tagName}
                    </span>
                    <span className="rounded bg-indigo-100 border border-indigo-200 text-indigo-800 text-[10px] px-1.5 py-0.2 font-bold shrink-0">
                      Wing: {appliedMatch.item.wing}
                    </span>
                    {appliedMatch.item.className && (
                      <span className="rounded bg-slate-200/80 text-slate-700 text-[10px] px-1.5 py-0.2 font-semibold shrink-0">
                        Class {appliedMatch.item.className}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyTag(appliedMatch.item.tagName)}
                    className="flex items-center gap-1 rounded-lg bg-white border border-emerald-300 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all shadow-2xs"
                  >
                    {copiedTag === appliedMatch.item.tagName ? 'Copied!' : '📋 Copy Tag'}
                  </button>
                  {tagMatchResult.matches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setShowAllSuggestions(true)}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                    >
                      +{tagMatchResult.matches.length - 1} other matches ▼
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* 2. Compact Scrollable Box (Never scrolls page down!) */
              <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-2.5 shadow-2xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-1.5">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-black">
                      ✓
                    </span>
                    <span>Official Tags ({tagMatchResult.matches.length}):</span>

                    {tagMatchResult.detectedBatchInfo?.grade && (
                      <span className="rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] px-1.5 py-0.2 font-bold flex items-center gap-1">
                        <span>🎯 {tagMatchResult.detectedBatchInfo.grade}</span>
                        {tagMatchResult.detectedBatchInfo.isAirBatch && (
                          <span className="rounded bg-indigo-600 text-white px-1 py-0.2 text-[9px] font-black uppercase">
                            Air Batch (P)
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {tagMatchResult.detectedBatchInfo?.grade && classSyllabusChapters.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowSyllabusBrowser(prev => !prev)}
                        className="rounded-md bg-cyan-100 hover:bg-cyan-200 border border-cyan-300 text-cyan-900 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 transition-colors"
                        title={`Browse all official chapters for ${tagMatchResult.detectedBatchInfo.grade}`}
                      >
                        <span>📚</span>
                        <span>{showSyllabusBrowser ? 'Hide Syllabus' : `Browse ${tagMatchResult.detectedBatchInfo.grade} Chapters (${classSyllabusChapters.length})`}</span>
                      </button>
                    )}

                    {appliedMatch && (
                      <button
                        type="button"
                        onClick={() => setShowAllSuggestions(false)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
                      >
                        ▲ Collapse
                      </button>
                    )}
                  </div>
                </div>

                {/* Optional Syllabus Drawer */}
                {showSyllabusBrowser && classSyllabusChapters.length > 0 && (
                  <div className="rounded-lg bg-white border border-cyan-300 p-2.5 space-y-1.5 shadow-2xs animate-fadeIn">
                    <div className="flex items-center justify-between text-xs font-bold text-cyan-900 border-b border-cyan-100 pb-1">
                      <span>📖 All Official {tagMatchResult.detectedBatchInfo?.grade} {thumbnailData.subject} Chapters:</span>
                      <span className="text-[10px] text-slate-500 font-normal">Click any to apply</span>
                    </div>
                    <div className="max-h-36 overflow-y-auto pr-1 space-y-1">
                      {classSyllabusChapters.map((c, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            handleApplyOfficialChapter(c.chapterName);
                            setShowSyllabusBrowser(false);
                            setShowAllSuggestions(false);
                          }}
                          className="flex items-center justify-between p-1.5 rounded-md hover:bg-cyan-50 border border-slate-100 hover:border-cyan-300 cursor-pointer text-xs transition-all"
                        >
                          <span className="font-semibold text-slate-800 truncate">{c.chapterName}</span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.2 rounded border shrink-0">{c.tagName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tagMatchResult.matches.length > 0 ? (
                  <div className="max-h-44 overflow-y-auto pr-1 space-y-1.5">
                    {tagMatchResult.matches.map((m, idx) => {
                      const isCurrentExact = thumbnailData.chapterTitle.trim().toLowerCase() === m.item.chapterName.trim().toLowerCase() ||
                                             thumbnailData.chapterTitle.trim().toLowerCase() === m.item.tagName.trim().toLowerCase();

                      return (
                        <div
                          key={m.item.id || idx}
                          className={`flex items-center justify-between gap-2 rounded-lg p-2 transition-all ${
                            isCurrentExact
                              ? 'bg-emerald-50/90 border border-emerald-300 shadow-2xs'
                              : 'bg-white border border-slate-200 hover:border-cyan-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs truncate max-w-[280px]" title={m.item.chapterName}>
                                {m.item.chapterName}
                              </span>
                              <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                                {m.item.tagName}
                              </span>
                              {isCurrentExact && (
                                <span className="rounded bg-emerald-600 text-white text-[9px] px-1.5 py-0.2 font-bold shrink-0">
                                  ✓ Applied
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <span className="rounded bg-indigo-50 border border-indigo-200 px-1 font-bold text-indigo-700">
                                Wing: {m.item.wing}
                              </span>
                              <span className="rounded bg-slate-100 px-1 font-semibold text-slate-600">
                                Class {m.item.className}
                              </span>
                              {m.item.subject && (
                                <span className="text-cyan-800 font-medium">{m.item.subject}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                handleApplyOfficialChapter(m.item.chapterName);
                                setShowAllSuggestions(false);
                              }}
                              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-all ${
                                isCurrentExact
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-2xs'
                              }`}
                              title="Apply this official chapter name"
                            >
                              <span>⚡</span>
                              <span>{isCurrentExact ? 'Applied' : 'Apply'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyTag(m.item.tagName)}
                              className="rounded-md bg-white border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-2xs"
                              title="Copy tag name"
                            >
                              {copiedTag === m.item.tagName ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1.5 py-0.5">
                    <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <span>ℹ️</span>
                        <span>
                          <strong>"{thumbnailData.chapterTitle}"</strong> is not in the{' '}
                          <strong>{tagMatchResult.detectedBatchInfo?.grade || 'selected class'}</strong> syllabus sheet.
                          {tagMatchResult.otherClassMatches && tagMatchResult.otherClassMatches.length > 0 && (
                            <span className="block mt-0.5 text-amber-700">
                              It belongs to another class (shown below).
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Quick 1-click chips of official chapters in this class */}
                      {classSyllabusChapters.length > 0 && (
                        <div className="pt-1 border-t border-amber-200/60 space-y-1">
                          <div className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                            <span>💡 Official {tagMatchResult.detectedBatchInfo?.grade} {thumbnailData.subject} Chapters (1-Click Apply):</span>
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                            {classSyllabusChapters.map((c, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  handleApplyOfficialChapter(c.chapterName);
                                  setShowAllSuggestions(false);
                                }}
                                className="rounded-md bg-white border border-amber-300 hover:border-cyan-500 hover:bg-cyan-50 px-2 py-0.5 text-[11px] font-medium text-slate-800 transition-all shadow-2xs"
                                title={`Click to select ${c.chapterName}`}
                              >
                                {c.chapterName}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {tagMatchResult.otherClassMatches && tagMatchResult.otherClassMatches.length > 0 && (
                      <div className="max-h-40 overflow-y-auto pr-1 space-y-1.5 pt-0.5">
                        {tagMatchResult.otherClassMatches.map((m, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 rounded-lg bg-white border border-slate-200 p-2 text-xs hover:border-cyan-300 transition-all"
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 text-xs truncate max-w-[280px]" title={m.item.chapterName}>
                                  {m.item.chapterName}
                                </span>
                                <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                                  {m.item.tagName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className="rounded bg-indigo-50 border border-indigo-200 px-1 font-bold text-indigo-700">
                                  Wing: {m.item.wing}
                                </span>
                                <span className="rounded bg-amber-50 border border-amber-200 px-1 font-bold text-amber-800">
                                  Class {m.item.className}
                                </span>
                                {m.item.subject && (
                                  <span className="text-slate-600 font-medium">{m.item.subject}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  handleApplyOfficialChapter(m.item.chapterName);
                                  setShowAllSuggestions(false);
                                }}
                                className="flex items-center gap-1 rounded-md bg-cyan-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-cyan-700 shadow-2xs transition-all"
                                title="Apply this official chapter name"
                              >
                                <span>⚡ Apply</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyTag(m.item.tagName)}
                                className="rounded-md bg-white border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-2xs"
                                title="Copy tag name"
                              >
                                {copiedTag === m.item.tagName ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Optional Separate Fields Accordion */}
        {showSeparateFields && (
          <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5 animate-fadeIn">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
              <div className="sm:col-span-8">
                <label className="text-[11px] font-bold text-slate-600">Chapter Title</label>
                <input
                  type="text"
                  value={thumbnailData.chapterTitle}
                  onChange={(e) => onUpdateThumbnailData({ chapterTitle: e.target.value })}
                  placeholder="e.g. Chemical Bonding and Molecular Structure"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-2xs outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="text-[11px] font-bold text-slate-600">Lecture Number</label>
                <input
                  type="text"
                  value={thumbnailData.lectureNo}
                  onChange={(e) => onUpdateThumbnailData({ lectureNo: e.target.value })}
                  placeholder="e.g. 11 or 04"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-2xs outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600">Topic Description</label>
              <input
                type="text"
                value={thumbnailData.topicDescription}
                onChange={(e) => onUpdateThumbnailData({ topicDescription: e.target.value })}
                placeholder="e.g. Reason for Hybridisaton"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-2xs outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Batch Code & Subject Selection Grid */}
      <div className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          {/* Batch Code Input */}
          <div className="sm:col-span-7">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-cyan-600" />
              <span>Batch Code (White Card)</span>
            </label>
            <input
              type="text"
              value={thumbnailData.batchName}
              onChange={(e) => onUpdateThumbnailData({ batchName: e.target.value })}
              placeholder="e.g. SIP S41-AJ31MA 2026"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-2xs outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Subject Dropdown */}
          <div className="sm:col-span-5">
            <label className="text-xs font-bold text-slate-800">Subject</label>
            <select
              value={thumbnailData.subject}
              onChange={(e) => onUpdateThumbnailData({ subject: e.target.value as SubjectType })}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 shadow-2xs outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Botany">Botany</option>
              <option value="Zoology">Zoology</option>
              <option value="English">English</option>
              <option value="SST">SST</option>
              <option value="General">General</option>
            </select>
          </div>
        </div>

        {/* Quick Subject Switcher Buttons */}
        <div className="pt-2 border-t border-slate-200/60">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-0.5">Quick Subject:</span>
            {(['Physics', 'Chemistry', 'Mathematics', 'Botany', 'Zoology', 'English', 'SST', 'General'] as SubjectType[]).map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => onUpdateThumbnailData({ subject: subj })}
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-all ${
                  thumbnailData.subject === subj
                    ? 'bg-cyan-600 text-white shadow-2xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
