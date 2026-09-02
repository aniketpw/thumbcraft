export type SubjectType = 
  | 'Physics' 
  | 'Chemistry' 
  | 'Mathematics' 
  | 'Botany' 
  | 'Zoology'
  | 'English' 
  | 'SST'
  | 'General';

export type TemplateStyle = 
  | 'pw_official_torn' // The exact user requested cyan torn paper template
  | 'pw_dark_gold'
  | 'cyber_neon'
  | 'fiery_oneshot'
  | 'royal_emerald'
  | 'split_contrast'
  | 'comic_action'
  | 'deep_violet'
  | 'board_topper'
  | 'minimal_studio'
  | 'custom_bg';

export interface TeacherProfile {
  id: string;
  name: string;
  rawName?: string;
  teacherCode?: string;
  center?: string;
  subject: SubjectType;
  title: string;
  imageUrl: string;
  driveId?: string;
  defaultPosition?: 'right' | 'left' | 'center';
  isCustom?: boolean;
}

export interface BatchPreset {
  id: string;
  name: string;
  tagline: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  targetExam: string;
  iconName?: string;
}

export interface ThumbnailData {
  // Main Content for PW Layout (Image 2 format)
  chapterTitle: string;
  lectureNo: string; // e.g. "11", "04", "01"
  topicDescription: string; // e.g. "Reason for Hybridisaton", "Coulomb's Law & Electric Field"
  batchName: string; // e.g. "SIP S41-AJ31MA 2026", "LAKSHYA JEE 2026"
  subject: SubjectType;
  
  // Extra customizable fields
  lectureLabel: string; // e.g. "LEC", "LECTURE", "-"
  subtopics: string[];
  
  // Teacher
  teacherId: string;
  teacherName: string;
  teacherTitle: string;
  customTeacherImage?: string;
  teacherPosition: 'right' | 'left';
  teacherScale: number;
  teacherOffsetX: number;
  teacherOffsetY: number;
  teacherFlip: boolean;
  teacherGlowColor: string;
  teacherGlowBlur: number;

  // Visual Theme & Template
  templateStyle: TemplateStyle;
  customBgImage?: string;
  themeColor: string;
  secondaryColor: string;
  bgColor: string;
  fontFamily: 'Montserrat' | 'Bebas Neue' | 'Oswald' | 'Anton' | 'Outfit' | 'Poppins' | 'Bangers';
  
  // Badges & Stickers
  badgeText: string;
  showBadge: boolean;
  extraSticker?: 'LIVE' | '100% MARKS' | 'PYQ SPECIAL' | 'NCERT BASED' | 'FREE PDF' | 'NONE';
  showSafeZone: boolean;
  resolution: '720p' | '1080p';
}

export interface ParsedInputResult {
  chapterTitle: string;
  lectureNo: string;
  topicDescription: string;
  lectureLabel?: string;
  subject?: SubjectType;
  batchName?: string;
  teacherName?: string;
  subtopics: string[];
  badgeText?: string;
  rawText: string;
}

export interface BatchQueueItem {
  id: string;
  data: ThumbnailData;
  thumbnailUrl?: string;
  status: 'pending' | 'rendered' | 'error';
}
