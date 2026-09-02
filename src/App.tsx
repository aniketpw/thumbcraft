/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { SingleBoxInput } from './components/SingleBoxInput';
import { ThumbnailPreview } from './components/ThumbnailPreview';
import { TeacherSelector } from './components/TeacherSelector';
import { BatchExportModal } from './components/BatchExportModal';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';

import { 
  ThumbnailData, 
  ParsedInputResult, 
  TeacherProfile, 
  BatchPreset 
} from './types/thumbnail';
import { parseThumbnailInput } from './utils/parser';
import { 
  SAMPLE_TEACHERS, 
  BATCH_PRESETS, 
  TEMPLATE_DEFINITIONS, 
  TemplateDefinition 
} from './utils/sampleData';
import { PW_SHEET_FACULTY_DATABASE } from './utils/pwFacultyDatabase';
import { downloadCanvasImage, copyCanvasToClipboard } from './utils/canvasRenderer';
import { 
  fetchGoogleSheetLive, 
  getSavedSheetData, 
  SheetTeacherRow, 
  SheetBatchRow, 
  GoogleSheetSyncResult 
} from './utils/googleSheetSync';
import { logVisitorTelemetry } from './utils/visitorTracker';

export default function App() {
  const initialInput = "";
  const defaultSheetUrl = "https://docs.google.com/spreadsheets/d/10TOZqECN2LW0dJj8JuWDdeE28sV4p19KDpAGkltlvwE/edit?usp=sharing";

  const [inputValue, setInputValue] = useState<string>(initialInput);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState<boolean>(false);

  // Google Sheet Synced State (Default pre-populated with Active faculty across PCMC, Viman Nagar, TC!)
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('pw_google_sheet_url')) || defaultSheetUrl;
  });
  const [syncedTeachers, setSyncedTeachers] = useState<SheetTeacherRow[]>(() => {
    return PW_SHEET_FACULTY_DATABASE.map(t => ({
      id: t.id,
      name: t.name,
      teacherCode: t.teacherCode,
      center: t.center,
      subject: t.subject,
      title: t.title,
      imageUrl: t.imageUrl,
      driveId: t.driveId
    }));
  });
  const [syncedBatches, setSyncedBatches] = useState<SheetBatchRow[]>(() => {
    const saved = getSavedSheetData();
    return saved?.batches || [];
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>("All Centers Synced (PCMC, Viman Nagar, TC, HAD)");

  // Load saved template image from localStorage if available
  const savedBgImage = typeof window !== 'undefined' ? localStorage.getItem('pw_custom_template_bg') || undefined : undefined;

  // Realtime background auto-sync: on mount, on window focus (when user edits Google Sheet & switches tab), and every 60s
  useEffect(() => {
    let isSubscribed = true;

    const performLiveSync = () => {
      fetchGoogleSheetLive(defaultSheetUrl)
        .then((res) => {
          if (!isSubscribed) return;
          if (res.teachers?.length) {
            setSyncedTeachers(res.teachers);
          }
          if (res.batches?.length) setSyncedBatches(res.batches);
          if (res.lastSyncedAt) setLastSyncedAt(res.lastSyncedAt);
        })
        .catch((err) => {
          console.log('Live sheet sync note:', err.message);
        });
    };

    // 1. Initial sync & visitor telemetry log
    performLiveSync();
    logVisitorTelemetry('ThumbCraft');

    // 2. Immediate auto-sync when user comes back from Google Sheets tab
    window.addEventListener('focus', performLiveSync);

    // 3. Periodic refresh every 60s
    const timer = setInterval(performLiveSync, 60000);

    return () => {
      isSubscribed = false;
      window.removeEventListener('focus', performLiveSync);
      clearInterval(timer);
    };
  }, []);

  const handleSyncSuccess = (result: GoogleSheetSyncResult) => {
    setSyncedTeachers(result.teachers);
    setSyncedBatches(result.batches);
    setLastSyncedAt(result.lastSyncedAt);
    try {
      localStorage.setItem('pw_google_sheet_url', sheetUrl);
    } catch {}
  };

  // Core Thumbnail Data state
  const [thumbnailData, setThumbnailData] = useState<ThumbnailData>(() => {
    const parsed = parseThumbnailInput(initialInput);
    const defaultTemplate = TEMPLATE_DEFINITIONS[0]; // PW Official Torn
    const defaultTeacher = PW_SHEET_FACULTY_DATABASE[0] || SAMPLE_TEACHERS[0];
    const defaultBatch = BATCH_PRESETS[0];

    return {
      chapterTitle: parsed.chapterTitle || '',
      lectureNo: parsed.lectureNo || '',
      topicDescription: parsed.topicDescription || '',
      lectureLabel: parsed.lectureLabel || 'LECTURE',
      subject: parsed.subject || 'Chemistry',
      batchName: parsed.batchName || 'SIP S41-AJ31MA 2026',
      subtopics: parsed.subtopics || [],
      
      teacherId: defaultTeacher.id,
      teacherName: parsed.teacherName || defaultTeacher.name,
      teacherTitle: defaultTeacher.title,
      customTeacherImage: undefined,
      teacherPosition: 'right',
      teacherScale: 1.02,
      teacherOffsetX: 0,
      teacherOffsetY: 0,
      teacherFlip: false,
      teacherGlowColor: defaultTemplate.themeColor,
      teacherGlowBlur: 0,

      templateStyle: 'pw_official_torn',
      customBgImage: savedBgImage,
      themeColor: defaultTemplate.themeColor,
      secondaryColor: defaultTemplate.secondaryColor,
      bgColor: defaultTemplate.bgColor,
      fontFamily: defaultTemplate.fontFamily,

      badgeText: parsed.badgeText || 'LIVE',
      showBadge: true,
      extraSticker: 'LIVE',
      showSafeZone: false,
      resolution: '720p'
    };
  });

  // Current parsed result preview
  const parsedResult: ParsedInputResult = useMemo(() => {
    return parseThumbnailInput(inputValue);
  }, [inputValue]);

  // Reactive Auto-Parse: Update thumbnail when input box changes (with sheet teacher lookup)
  const handleInputChange = (newVal: string) => {
    setInputValue(newVal);
    const parsed = parseThumbnailInput(newVal);
    
    setThumbnailData((prev) => {
      let newTeacherId = prev.teacherId;
      let newTeacherName = prev.teacherName;
      let newTeacherTitle = prev.teacherTitle;
      let newCustomTeacherImage = prev.customTeacherImage;
      let newSubject = parsed.subject || prev.subject;

      if (parsed.teacherName) {
        const cleanQuery = parsed.teacherName.toLowerCase().replace('sir', '').replace("ma'am", '').replace('mam', '').trim();
        
        // 1. Search in Synced Google Sheet Teachers
        const foundInSheet = syncedTeachers.find(t => 
          t.name.toLowerCase().includes(cleanQuery)
        ) || PW_SHEET_FACULTY_DATABASE.find(t => 
          t.name.toLowerCase().includes(cleanQuery)
        );

        if (foundInSheet) {
          newTeacherId = foundInSheet.id;
          newTeacherName = foundInSheet.name;
          newTeacherTitle = foundInSheet.title;
          if (foundInSheet.imageUrl) {
            newCustomTeacherImage = foundInSheet.imageUrl;
          }
          if (foundInSheet.subject) {
            newSubject = foundInSheet.subject;
          }
        } else {
          // 2. Search in Default Faculty
          const found = SAMPLE_TEACHERS.find(t => 
            t.name.toLowerCase().includes(cleanQuery)
          );
          if (found) {
            newTeacherId = found.id;
            newTeacherName = found.name;
            newTeacherTitle = found.title;
            newCustomTeacherImage = undefined;
          } else {
            newTeacherName = parsed.teacherName;
          }
        }
      }

      // Find matching batch if detected in synced batches or presets
      let newBatchName = prev.batchName;
      if (parsed.batchName) {
        const matchedSyncedBatch = syncedBatches.find(b => 
          b.name.toLowerCase().includes(parsed.batchName!.toLowerCase().trim())
        );
        if (matchedSyncedBatch) {
          newBatchName = matchedSyncedBatch.name;
        } else {
          newBatchName = parsed.batchName.toUpperCase();
        }
      }

      return {
        ...prev,
        chapterTitle: parsed.chapterTitle || prev.chapterTitle,
        lectureNo: parsed.lectureNo || prev.lectureNo,
        topicDescription: parsed.topicDescription !== undefined ? parsed.topicDescription : prev.topicDescription,
        lectureLabel: parsed.lectureLabel || prev.lectureLabel,
        subject: newSubject,
        batchName: newBatchName,
        teacherName: newTeacherName,
        teacherId: newTeacherId,
        teacherTitle: newTeacherTitle,
        customTeacherImage: newCustomTeacherImage,
        subtopics: parsed.subtopics.length > 0 ? parsed.subtopics : prev.subtopics,
        extraSticker: (parsed.badgeText as ThumbnailData['extraSticker']) || prev.extraSticker
      };
    });
  };

  const handleUpdateThumbnailData = (patch: Partial<ThumbnailData>) => {
    setThumbnailData(prev => ({ ...prev, ...patch }));
  };

  // Select Sample 1-Click Button
  const handleSelectSample = (sampleText: string) => {
    handleInputChange(sampleText);
  };

  // Select Template
  const handleSelectTemplate = (tpl: TemplateDefinition) => {
    setThumbnailData(prev => ({
      ...prev,
      templateStyle: tpl.id,
      customBgImage: undefined,
      themeColor: tpl.themeColor,
      secondaryColor: tpl.secondaryColor,
      bgColor: tpl.bgColor,
      fontFamily: tpl.fontFamily,
      teacherGlowColor: tpl.themeColor
    }));
  };

  // Upload Custom BG (e.g. Thumbnail.png)
  const handleUploadCustomBg = (base64Url: string) => {
    try {
      localStorage.setItem('pw_custom_template_bg', base64Url);
    } catch {
      // Ignore if localStorage quota exceeded
    }
    setThumbnailData(prev => ({
      ...prev,
      customBgImage: base64Url,
      templateStyle: 'pw_official_torn'
    }));
  };

  const handleClearCustomBg = () => {
    try {
      localStorage.removeItem('pw_custom_template_bg');
    } catch {
      // Ignore
    }
    setThumbnailData(prev => ({
      ...prev,
      customBgImage: undefined,
      templateStyle: 'pw_official_torn'
    }));
  };

  // Select Faculty / Teacher
  const handleSelectTeacher = (teacher: TeacherProfile) => {
    setThumbnailData(prev => ({
      ...prev,
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherTitle: teacher.title,
      customTeacherImage: teacher.imageUrl,
      subject: teacher.subject || prev.subject
    }));
  };

  // Upload Custom Faculty Photo
  const handleUploadCustomTeacher = (base64Url: string, name: string) => {
    setThumbnailData(prev => ({
      ...prev,
      teacherId: 'custom',
      customTeacherImage: base64Url,
      teacherName: name || 'Custom Faculty'
    }));
  };

  // Select Batch
  const handleSelectBatch = (batch: BatchPreset) => {
    setThumbnailData(prev => ({
      ...prev,
      batchName: batch.name,
      batchTagline: batch.tagline,
      themeColor: batch.color,
      teacherGlowColor: batch.color
    }));
  };

  // Get active teacher image URL
  const teacherImageUrl = useMemo(() => {
    if (thumbnailData.customTeacherImage) {
      return thumbnailData.customTeacherImage;
    }
    const fromSynced = syncedTeachers.find(t => t.id === thumbnailData.teacherId);
    if (fromSynced?.imageUrl) return fromSynced.imageUrl;

    const fromSheetDb = PW_SHEET_FACULTY_DATABASE.find(t => t.id === thumbnailData.teacherId);
    if (fromSheetDb?.imageUrl) return fromSheetDb.imageUrl;

    const found = SAMPLE_TEACHERS.find(t => t.id === thumbnailData.teacherId);
    return found ? found.imageUrl : (PW_SHEET_FACULTY_DATABASE[0]?.imageUrl || SAMPLE_TEACHERS[0].imageUrl);
  }, [thumbnailData.teacherId, thumbnailData.customTeacherImage, syncedTeachers]);

  // 1-Click Download handler
  const handleDownload = useCallback((format: 'png' | 'jpeg' = 'png') => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const safeTitle = (thumbnailData.chapterTitle || 'Chapter')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 25);
    const safeLec = (thumbnailData.lectureNo || '01').replace(/[^a-zA-Z0-9]/g, '_');
    const safeBatch = (thumbnailData.batchName || 'Batch')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 15);
    const filename = `${thumbnailData.subject || 'Lecture'}_${safeTitle}_Lec${safeLec}_${safeBatch}`;

    downloadCanvasImage(canvas, filename, format);
  }, [thumbnailData]);

  // Copy to Clipboard
  const handleCopyClipboard = useCallback(async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const success = await copyCanvasToClipboard(canvas);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  }, []);

  // Magic Randomize Style
  const handleRandomizeTheme = () => {
    const randomTemplate = TEMPLATE_DEFINITIONS[Math.floor(Math.random() * TEMPLATE_DEFINITIONS.length)];
    handleSelectTemplate(randomTemplate);
  };

  // Keyboard shortcut: Ctrl+S / Cmd+S to download
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleDownload('png');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDownload]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <Header
        onDownload={handleDownload}
        onCopyClipboard={handleCopyClipboard}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onRandomizeTheme={handleRandomizeTheme}
        onOpenPresets={() => {}}
        isCopied={isCopied}
        resolution={thumbnailData.resolution}
        setResolution={(res) => handleUpdateThumbnailData({ resolution: res })}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
          
          {/* Left Column: 1-Click Single Box Input + Selectors (7 Cols) */}
          <div className="space-y-4 lg:col-span-7">
            {/* 1. Hero Unified Lecture & Batch Details Field */}
            <SingleBoxInput
              thumbnailData={thumbnailData}
              onUpdateThumbnailData={handleUpdateThumbnailData}
              onUploadCustomBg={handleUploadCustomBg}
              onClearCustomBg={handleClearCustomBg}
            />

            {/* Mobile-Only: Live Thumbnail Preview & Instant Download right after input */}
            <div className="block lg:hidden">
              <ThumbnailPreview
                thumbnailData={thumbnailData}
                teacherImageUrl={teacherImageUrl}
                onUpdateThumbnailData={handleUpdateThumbnailData}
                onDownload={handleDownload}
                onCopyClipboard={handleCopyClipboard}
                isCopied={isCopied}
              />
            </div>

            {/* 2. Faculty / Teacher Picker */}
            <TeacherSelector
              currentTeacherId={thumbnailData.teacherId}
              customTeacherImage={thumbnailData.customTeacherImage}
              teacherName={thumbnailData.teacherName}
              teacherTitle={thumbnailData.teacherTitle}
              teacherPosition={thumbnailData.teacherPosition}
              teacherScale={thumbnailData.teacherScale}
              teacherFlip={thumbnailData.teacherFlip}
              teacherGlowColor={thumbnailData.teacherGlowColor}
              teacherGlowBlur={thumbnailData.teacherGlowBlur}
              syncedTeachers={syncedTeachers}
              onOpenSheetSync={() => setIsSheetModalOpen(true)}
              onSelectTeacher={handleSelectTeacher}
              onUploadCustomTeacher={handleUploadCustomTeacher}
              onUpdateThumbnailData={handleUpdateThumbnailData}
            />
          </div>

          {/* Right Column: Desktop Sticky Live Canvas Preview & Quick Export (5 Cols) */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="sticky top-20 space-y-4">
              <ThumbnailPreview
                thumbnailData={thumbnailData}
                teacherImageUrl={teacherImageUrl}
                onUpdateThumbnailData={handleUpdateThumbnailData}
                onDownload={handleDownload}
                onCopyClipboard={handleCopyClipboard}
                isCopied={isCopied}
              />

              {/* Quick Guide Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    ⚡ Google Sheet Synced
                  </h4>
                  <button
                    onClick={() => setIsSheetModalOpen(true)}
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    Manage Sheet ({syncedTeachers.length} Faculty)
                  </button>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span>Search or type any faculty name from your sheet to auto-load photo.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
                    <span>Paste any lecture line (e.g. <code>Electrostatics - 04 : Coulomb's Law | LAKSHYA 2026</code>).</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                    <span>Use <strong>Batch Multi-Lec</strong> to export the whole week as a ZIP.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Google Sheet Sync Modal */}
      <GoogleSheetSyncModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        sheetUrl={sheetUrl}
        setSheetUrl={setSheetUrl}
        onSyncSuccess={handleSyncSuccess}
        syncedTeachersCount={syncedTeachers.length}
        syncedBatchesCount={syncedBatches.length}
        lastSyncedAt={lastSyncedAt}
      />

      {/* Batch Schedule Multi-Lecture Export Modal */}
      <BatchExportModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        baseThumbnailData={thumbnailData}
        teacherImageUrl={teacherImageUrl}
      />
    </div>
  );
}
