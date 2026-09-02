import { SubjectType, TeacherProfile, BatchPreset } from "../types/thumbnail";

export interface SheetTeacherRow {
  id: string;
  name: string;
  subject: SubjectType;
  title: string;
  imageUrl: string;
  driveId?: string;
  teacherCode?: string;
  center?: string;
}

export interface SheetBatchRow {
  id: string;
  name: string;
  tagline: string;
  color: string;
}

export interface GoogleSheetSyncResult {
  teachers: SheetTeacherRow[];
  batches: SheetBatchRow[];
  lastSyncedAt: string;
  error?: string;
}

// Convert Google Drive sharing links or drive IDs to direct cross-origin image URLs
export function convertGoogleDriveUrlToDirect(urlOrId: string): string {
  if (!urlOrId) return "";
  const trimmed = urlOrId.trim();

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;

  // Match Google Drive file ID
  const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || 
                      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
                      trimmed.match(/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/);

  if (fileIdMatch && fileIdMatch[1]) {
    return "https://lh3.googleusercontent.com/d/" + fileIdMatch[1];
  }

  // If already just the drive ID
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(trimmed)) {
    return "https://lh3.googleusercontent.com/d/" + trimmed;
  }

  return trimmed;
}

// Parse CSV text into arrays of rows
export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === "\"" && nextChar === "\"") {
        currentField += "\"";
        i++;
      } else if (char === "\"") {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === "\"") {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\r") {
      } else if (char === "\n") {
        currentRow.push(currentField.trim());
        if (currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Extract Sheet ID from URL
export function extractSheetId(urlOrId: string): string {
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  return urlOrId.trim();
}

function formatTeacherName(raw: string): string {
  const name = raw.replace(/\./g, " ").replace(/[-_]\s*[A-Z0-9]{2,5}$/i, "").trim();
  return name.split(" ").map(w => {
    if (w.length <= 3 && w === w.toUpperCase()) return w;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(" ");
}

function extractCode(name?: string, explicitCode?: string): string {
  if (explicitCode && explicitCode.trim()) return explicitCode.trim().toUpperCase();
  if (!name) return "";
  const match = name.match(/[-_ ]\s*([A-Z0-9]{2,5})\b/) || name.match(/\b([A-Z0-9]{3,4})\b/);
  return match ? match[1] : "";
}

// Map subject from 1st letter of Teacher Code:
// P -> Physics, C -> Chemistry, M -> Mathematics, B -> Botany, Z -> Zoology, E -> English, S -> SST
export function mapSubjectFromCode(code?: string, name?: string): SubjectType {
  const cleanCode = (code || "").trim().toUpperCase();
  let firstLetter = cleanCode.charAt(0);
  
  if (!firstLetter && name) {
    const match = name.match(/[-_ ]\s*([CPMBZES][A-Z0-9]{1,3})\b/) || name.match(/\b([CPMBZES][A-Z0-9]{2,3})\b/);
    if (match) firstLetter = match[1].charAt(0);
  }

  if (!firstLetter && name) {
    const lower = name.toLowerCase();
    if (lower.includes("zool")) return "Zoology";
    if (lower.includes("bot") || lower.includes("bio")) return "Botany";
    if (lower.includes("phys")) return "Physics";
    if (lower.includes("chem")) return "Chemistry";
    if (lower.includes("math")) return "Mathematics";
    if (lower.includes("eng")) return "English";
    if (lower.includes("sst") || lower.includes("soc")) return "SST";
  }

  switch(firstLetter) {
    case "P": return "Physics";
    case "C": return "Chemistry";
    case "M": return "Mathematics";
    case "B": return "Botany";
    case "Z": return "Zoology";
    case "E": return "English";
    case "S": return "SST";
    default: return "General";
  }
}

// Process parsed CSV rows into Teachers for a specific Center
export function processCenterSheetRows(rows: string[][], centerName: string, requireActive: boolean): SheetTeacherRow[] {
  if (!rows || rows.length < 2) return [];

  const header = rows[0].map(h => (h || "").toLowerCase().replace(/[^a-z0-9]/g, ""));
  let nameIdx = header.findIndex(h => h === "name" || h.includes("teachername") || h.includes("faculty"));
  let driveIdIdx = header.findIndex(h => h.includes("driveid") || (h.includes("id") && !h.includes("teacher")));
  let driveLinkIdx = header.findIndex(h => h.includes("drivelink") || h.includes("link") || h.includes("photo") || h.includes("image") || h.includes("url"));
  let teacherCodeIdx = header.findIndex(h => h.includes("teachercode") || h.includes("code") || h.includes("facultycode"));
  let statusIdx = header.findIndex(h => h.includes("status") || h.includes("active") || h.includes("state"));

  if (nameIdx === -1) nameIdx = 1;
  if (driveLinkIdx === -1) driveLinkIdx = 3;
  if (driveIdIdx === -1 && rows[0].length > 4) driveIdIdx = 4;
  if (teacherCodeIdx === -1 && rows[0].length > 5) teacherCodeIdx = 5;
  if (statusIdx === -1 && rows[0].length > 6) statusIdx = 6;

  const teachers: SheetTeacherRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const rawName = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].trim() : "";
    const rawDriveId = driveIdIdx !== -1 && row[driveIdIdx] ? row[driveIdIdx].trim() : "";
    const rawLink = driveLinkIdx !== -1 && row[driveLinkIdx] ? row[driveLinkIdx].trim() : "";
    const driveKey = rawDriveId || rawLink;
    if (!rawName || !driveKey) continue;

    const rawStatus = statusIdx !== -1 && row[statusIdx] ? row[statusIdx].trim().toLowerCase() : "";
    if (requireActive) {
      if (rawStatus !== "active") continue;
    }

    const explicitCode = teacherCodeIdx !== -1 && row[teacherCodeIdx] ? row[teacherCodeIdx].trim() : "";
    const code = extractCode(rawName, explicitCode);
    const subject = mapSubjectFromCode(code, rawName);
    const directPhotoUrl = convertGoogleDriveUrlToDirect(driveKey);
    const displayName = formatTeacherName(rawName);

    teachers.push({
      id: "pw_teacher_" + centerName.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + i + "_" + (rawDriveId ? rawDriveId.substring(0, 8) : displayName.toLowerCase().replace(/[^a-z0-9]/g, "_")),
      name: displayName,
      teacherCode: code,
      subject,
      center: centerName,
      title: subject + " Faculty | " + centerName,
      imageUrl: directPhotoUrl,
      driveId: rawDriveId
    });
  }

  return teachers;
}

export function processSheetData(rows: string[][]): { teachers: SheetTeacherRow[]; batches: SheetBatchRow[] } {
  return {
    teachers: processCenterSheetRows(rows, "PCMC", true),
    batches: []
  };
}

// Dynamic list of candidate center names to auto-detect and sync from Google Sheets
export const KNOWN_CENTER_CANDIDATES = [
  "PCMC", 
  "Viman Nagar", 
  "TC", 
  "HAD", 
  "Hadapsar", 
  "FC Road", 
  "Aundh", 
  "Camp", 
  "Swargate", 
  "Kothrud", 
  "Wakad", 
  "Hinjewadi", 
  "Baner", 
  "Kalyani Nagar", 
  "Pimpri", 
  "Pune", 
  "JM Road", 
  "Chinchwad"
];

// Fetch all subsheets dynamically live from client browser
export async function fetchGoogleSheetLive(
  sheetUrlOrId: string, 
  customSubsheets: string[] = []
): Promise<GoogleSheetSyncResult> {
  const sheetId = extractSheetId(sheetUrlOrId);
  if (!sheetId) {
    throw new Error("Invalid Google Sheet URL or ID");
  }

  // Get default sheet (PCMC / gid=0) signature to identify fallback responses
  let pcmcSig = "";
  try {
    const pcmcRes = await fetch("https://docs.google.com/spreadsheets/d/" + sheetId + "/gviz/tq?tqx=out:csv&gid=0");
    if (pcmcRes.ok) {
      const pcmcText = await pcmcRes.text();
      pcmcSig = pcmcText.substring(0, 100);
    }
  } catch {}

  const allToTest = Array.from(new Set([
    "PCMC", 
    "Viman Nagar", 
    "TC", 
    "HAD", 
    ...customSubsheets, 
    ...KNOWN_CENTER_CANDIDATES
  ]));

  const allTeachers: SheetTeacherRow[] = [];
  const discoveredCenters: string[] = [];

  for (const sheetName of allToTest) {
    try {
      const u = "https://docs.google.com/spreadsheets/d/" + sheetId + "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(sheetName);
      const res = await fetch(u);
      if (!res.ok) continue;

      const txt = await res.text();
      if (!txt || txt.includes("<!DOCTYPE html>") || txt.length < 20) continue;

      // Check if Google Sheets fell back to default sheet (gid=0)
      const sig = txt.substring(0, 100);
      const isDefaultFallback = sheetName !== "PCMC" && sig === pcmcSig;
      if (isDefaultFallback) continue;

      discoveredCenters.push(sheetName);
      const parsedRows = parseCSV(txt);
      const requireActive = sheetName === "PCMC";
      const centerTeachers = processCenterSheetRows(parsedRows, sheetName, requireActive);
      allTeachers.push(...centerTeachers);
    } catch {}
  }

  // Subject Sort order
  const subjectOrder: Record<string, number> = {
    "Physics": 1,
    "Chemistry": 2,
    "Mathematics": 3,
    "Botany": 4,
    "Zoology": 5,
    "English": 6,
    "SST": 7,
    "General": 99
  };

  allTeachers.sort((a, b) => {
    const ordA = subjectOrder[a.subject] || 50;
    const ordB = subjectOrder[b.subject] || 50;
    if (ordA !== ordB) return ordA - ordB;
    return a.name.localeCompare(b.name);
  });

  const result: GoogleSheetSyncResult = {
    teachers: allTeachers,
    batches: [],
    lastSyncedAt: new Date().toLocaleTimeString()
  };

  try {
    localStorage.setItem("pw_synced_sheet_data", JSON.stringify(result));
    localStorage.setItem("pw_google_sheet_id", sheetId);
  } catch (e) {}

  return result;
}

// Load cached sheet data from localStorage
export function getSavedSheetData(): GoogleSheetSyncResult | null {
  try {
    const raw = localStorage.getItem("pw_synced_sheet_data");
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return null;
}
