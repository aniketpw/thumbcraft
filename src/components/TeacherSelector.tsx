import React, { useState, useMemo, useEffect } from 'react';
import { 
  UserCheck, 
  Upload, 
  Check, 
  FlipHorizontal, 
  Sliders,
  Search,
  FileSpreadsheet,
  Lock,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { TeacherProfile, ThumbnailData } from '../types/thumbnail';
import { SAMPLE_TEACHERS } from '../utils/sampleData';
import { SheetTeacherRow } from '../utils/googleSheetSync';

interface TeacherSelectorProps {
  currentTeacherId: string;
  customTeacherImage?: string;
  teacherName: string;
  teacherTitle: string;
  teacherPosition: 'right' | 'left';
  teacherScale: number;
  teacherFlip: boolean;
  teacherGlowColor: string;
  teacherGlowBlur: number;
  syncedTeachers?: SheetTeacherRow[];
  onOpenSheetSync?: () => void;
  onSelectTeacher: (teacher: TeacherProfile) => void;
  onUploadCustomTeacher: (base64Url: string, name: string) => void;
  onUpdateThumbnailData: (patch: Partial<ThumbnailData>) => void;
}

// Single Teacher Avatar Card with Multi-Endpoint Fallback & Access Restricted State
const TeacherCard: React.FC<{
  teacher: TeacherProfile;
  isSelected: boolean;
  onSelect: () => void;
  onUploadSpecific: (file: File) => void;
}> = ({ teacher, isSelected, onSelect, onUploadSpecific }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);

  // Extract drive ID if available
  const driveId = useMemo(() => {
    if (teacher.driveId) return teacher.driveId;
    const match = (teacher.imageUrl || '').match(/\/d\/([a-zA-Z0-9_-]+)/) || 
                  (teacher.imageUrl || '').match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }, [teacher.imageUrl, teacher.driveId]);

  const candidateUrls = useMemo(() => {
    if (!driveId) return [teacher.imageUrl];
    return [
      `https://lh3.googleusercontent.com/d/${driveId}`,
      `https://drive.google.com/thumbnail?id=${driveId}&sz=w500`,
      `https://drive.usercontent.google.com/download?id=${driveId}&export=view`
    ];
  }, [driveId, teacher.imageUrl]);

  const currentSrc = candidateUrls[currentUrlIndex] || teacher.imageUrl;

  const handleImageError = () => {
    if (currentUrlIndex < candidateUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
    } else {
      setImageError(true);
    }
  };

  // Get Initials
  const initials = teacher.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const driveUrl = driveId ? `https://drive.google.com/file/d/${driveId}/view?usp=sharing` : null;

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col items-center rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
        isSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/60 shadow-xs'
          : 'border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-white'
      }`}
    >
      {/* Avatar Container */}
      <div className="relative mb-1.5 h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100 p-0.5 group-hover:border-emerald-400 shadow-2xs flex items-center justify-center">
        {!imageError ? (
          <img
            src={currentSrc}
            alt={teacher.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-amber-50 text-amber-700">
            <span className="text-xs font-black">{initials}</span>
            <Lock className="h-2.5 w-2.5 text-amber-600 mt-0.5" />
          </div>
        )}

        {isSelected && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check className="h-2.5 w-2.5 stroke-[3]" />
          </span>
        )}
      </div>

      {/* Teacher Name & Subject & Code & Center */}
      <div className="w-full truncate text-xs font-bold text-slate-900 group-hover:text-emerald-700">
        {teacher.name}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] font-medium text-slate-500">
        <span className="font-semibold text-slate-700">{teacher.subject}</span>
        {teacher.teacherCode && (
          <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-bold text-slate-700">
            {teacher.teacherCode}
          </span>
        )}
        {teacher.center && (
          <span className="rounded bg-emerald-50 border border-emerald-200 px-1 py-0.2 text-[8px] font-semibold text-emerald-700">
            {teacher.center}
          </span>
        )}
      </div>

      {/* Access Status / Drive Link */}
      {imageError ? (
        <div className="mt-1 flex flex-col items-center gap-1 w-full">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
            <Lock className="h-2.5 w-2.5 text-amber-600" /> Not in Access
          </span>
          {driveUrl && (
            <div className="flex items-center gap-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
              <a
                href={driveUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-0.5 text-[10px] font-semibold text-cyan-700 hover:underline"
                title="Open in Google Drive to request or check access"
              >
                <span>Drive</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
              <label className="flex cursor-pointer items-center gap-0.5 text-[10px] font-semibold text-emerald-700 hover:underline">
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadSpecific(f);
                  }}
                />
              </label>
            </div>
          )}
        </div>
      ) : (
        <span className="mt-1 text-[9px] font-semibold text-emerald-700">
          Photo Ready
        </span>
      )}
    </div>
  );
};

export const TeacherSelector: React.FC<TeacherSelectorProps> = ({
  currentTeacherId,
  customTeacherImage,
  teacherName,
  teacherTitle,
  teacherPosition,
  teacherScale,
  teacherFlip,
  teacherGlowColor,
  teacherGlowBlur,
  syncedTeachers = [],
  onOpenSheetSync,
  onSelectTeacher,
  onUploadCustomTeacher,
  onUpdateThumbnailData
}) => {
  const [activeCenter, setActiveCenter] = useState<string>('All Centers');
  const [activeSubject, setActiveSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showControls, setShowControls] = useState(false);

  const centers = ['All Centers', 'PCMC', 'Viman Nagar', 'TC'];
  const subjects = ['All', 'Physics', 'Chemistry', 'Mathematics', 'Botany', 'Zoology', 'English', 'SST', 'General'];

  const subjectOrder: Record<string, number> = {
    'Physics': 1,
    'Chemistry': 2,
    'Mathematics': 3,
    'Botany': 4,
    'Zoology': 5,
    'English': 6,
    'SST': 7,
    'General': 99
  };

  // All active teachers from Google Sheet
  const allTeachers: TeacherProfile[] = useMemo(() => {
    if (syncedTeachers && syncedTeachers.length > 0) {
      return syncedTeachers.map(st => ({
        id: st.id,
        name: st.name,
        teacherCode: st.teacherCode,
        center: st.center,
        subject: st.subject,
        title: st.title,
        imageUrl: st.imageUrl,
        driveId: st.driveId,
        defaultPosition: 'right',
        isCustom: true
      }));
    }
    return SAMPLE_TEACHERS;
  }, [syncedTeachers]);

  const filteredTeachers = useMemo(() => {
    const list = allTeachers.filter(t => {
      const teacherCenter = (t.center || '').toLowerCase().trim();
      const selectedCenter = activeCenter.toLowerCase().trim();

      const matchesCenter = activeCenter === 'All Centers' || 
        teacherCenter === selectedCenter || 
        (selectedCenter === 'tc' && (teacherCenter.includes('tc') || teacherCenter.includes('tuition'))) ||
        (selectedCenter === 'pcmc' && (teacherCenter.includes('pcmc') || teacherCenter.includes('pimpri'))) ||
        (selectedCenter === 'viman nagar' && teacherCenter.includes('viman'));

      const matchesSubject = activeSubject === 'All' || t.subject === activeSubject;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        t.name.toLowerCase().includes(q) ||
        (t.teacherCode && t.teacherCode.toLowerCase().includes(q)) ||
        (t.center && t.center.toLowerCase().includes(q)) ||
        t.subject.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q);
      return matchesCenter && matchesSubject && matchesSearch;
    });

    // Ensure General is at the very end
    return [...list].sort((a, b) => {
      const ordA = subjectOrder[a.subject] || 50;
      const ordB = subjectOrder[b.subject] || 50;
      if (ordA !== ordB) return ordA - ordB;
      return a.name.localeCompare(b.name);
    });
  }, [allTeachers, activeCenter, activeSubject, searchQuery]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const customName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        onUploadCustomTeacher(event.target.result as string, customName);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadForTeacher = (file: File, teacher: TeacherProfile) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onUploadCustomTeacher(event.target.result as string, teacher.name);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold">
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                Faculty / Teacher Photo
              </h2>
              {syncedTeachers.length > 0 && (
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  {filteredTeachers.length} Available
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Select faculty by Center & Subject or upload PNG cutout
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenSheetSync && (
            <button
              onClick={onOpenSheetSync}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100"
              title="Sync teachers and batches from Google Sheet"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Google Sheet Sync</span>
            </button>
          )}

          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-emerald-400">
            <Upload className="h-3.5 w-3.5 text-emerald-600" />
            <span>Upload Cutout</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {/* 1. Subsheet / Center Filter Tabs */}
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-2.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Center:</span>
        {centers.map((center) => (
          <button
            key={center}
            onClick={() => setActiveCenter(center)}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              activeCenter === center
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'border border-slate-200 bg-slate-50/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {center}
          </button>
        ))}
      </div>

      {/* 2. Realtime Search Bar */}
      <div className="mb-2.5 relative">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search teacher by name, code (e.g. CRA, PSG, MIA) or center..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8.5 pr-3.5 py-1.5 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* 3. Subject Filter Pills */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {subjects.map((subj) => (
            <button
              key={subj}
              onClick={() => setActiveSubject(subj)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                activeSubject === subj
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowControls(!showControls)}
          className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
        >
          <Sliders className="h-3 w-3" />
          <span>{showControls ? 'Hide Adjustments' : 'Adjust Position & Size'}</span>
        </button>
      </div>

      {/* Teacher Cards Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* Custom Uploaded Teacher card if exists */}
        {customTeacherImage && (
          <button
            onClick={() => onUpdateThumbnailData({ teacherId: 'custom' })}
            className={`group relative flex flex-col items-center rounded-xl border p-2.5 text-center transition-all ${
              currentTeacherId === 'custom'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/60 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
            }`}
          >
            <div className="relative mb-2 h-16 w-16 overflow-hidden rounded-full border-2 border-emerald-500 bg-white p-1 shadow-2xs">
              <img src={customTeacherImage} alt="Custom" className="h-full w-full object-contain" />
              <span className="absolute top-0 right-0 rounded-full bg-emerald-600 p-0.5 text-white">
                <Check className="h-2.5 w-2.5" />
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900">{teacherName || 'Custom Faculty'}</div>
            <div className="text-[10px] font-medium text-emerald-700">Uploaded Cutout</div>
          </button>
        )}

        {filteredTeachers.map((teacher) => {
          const isSelected = currentTeacherId === teacher.id && !customTeacherImage;

          return (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              isSelected={isSelected}
              onSelect={() => onSelectTeacher(teacher)}
              onUploadSpecific={(file) => handleUploadForTeacher(file, teacher)}
            />
          );
        })}
      </div>

      {/* Cutout Fine-Tuning Controls */}
      {showControls && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {/* Position */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Position</label>
              <div className="mt-1 flex rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  onClick={() => onUpdateThumbnailData({ teacherPosition: 'left' })}
                  className={`flex-1 rounded py-1 text-[11px] font-bold ${
                    teacherPosition === 'left' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                  }`}
                >
                  Left
                </button>
                <button
                  onClick={() => onUpdateThumbnailData({ teacherPosition: 'right' })}
                  className={`flex-1 rounded py-1 text-[11px] font-bold ${
                    teacherPosition === 'right' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                  }`}
                >
                  Right
                </button>
              </div>
            </div>

            {/* Flip Horizontal */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Flip Face</label>
              <button
                onClick={() => onUpdateThumbnailData({ teacherFlip: !teacherFlip })}
                className={`mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border py-1 text-xs font-semibold ${
                  teacherFlip ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <FlipHorizontal className="h-3.5 w-3.5" />
                <span>{teacherFlip ? 'Flipped' : 'Normal'}</span>
              </button>
            </div>

            {/* Scale */}
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-600 uppercase">
                <span>Scale</span>
                <span>{Math.round(teacherScale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.35"
                step="0.05"
                value={teacherScale}
                onChange={(e) => onUpdateThumbnailData({ teacherScale: parseFloat(e.target.value) })}
                className="mt-2 w-full accent-emerald-600"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

