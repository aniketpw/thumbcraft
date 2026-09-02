import { CHAPTER_TAG_DATABASE, ChapterTagItem } from "./pwChapterTagDatabase";

export interface BatchCodeInfo {
  rawCode: string;
  batchKey?: string;
  grade?: string;
  className?: string;
  stream?: string;
  isAirBatch: boolean;
  wing?: string;
}

export interface MatchResult {
  exactMatch?: ChapterTagItem;
  matches: Array<{
    item: ChapterTagItem;
    score: number;
    isExact: boolean;
  }>;
  otherClassMatches?: Array<{
    item: ChapterTagItem;
    score: number;
    isExact: boolean;
  }>;
  status: "matched" | "suggested" | "not_found" | "empty";
  detectedBatchInfo?: BatchCodeInfo;
}

// Known batch code prefixes mapping to Grade/Class from Google Sheet
export const BATCH_CODE_MAPPING: Record<string, { grade: string; className: string; stream: string }> = {
  "AJ": { grade: "11th JEE", className: "11th", stream: "JEE" },
  "AN": { grade: "11th NEET", className: "11th", stream: "NEET" },
  "LJ": { grade: "12th JEE", className: "12th", stream: "JEE" },
  "LN": { grade: "12th NEET", className: "12th", stream: "NEET" },
  "YA": { grade: "Dropper NEET", className: "Dropper", stream: "NEET" },
  "YN": { grade: "Dropper NEET", className: "Dropper", stream: "NEET" },
  "PJ": { grade: "Dropper JEE", className: "Dropper", stream: "JEE" },
  "UF": { grade: "10th", className: "10th", stream: "Foundation" },
  "NF": { grade: "9th", className: "9th", stream: "Foundation" },
  "UP": { grade: "8th", className: "8th", stream: "Foundation" }
};

// Parse Batch Code to extract Class, Grade and Air Batch status (ending in P)
export function parseBatchCode(batchCode?: string): BatchCodeInfo | undefined {
  if (!batchCode || !batchCode.trim()) return undefined;

  const raw = batchCode.trim().toUpperCase();
  const tokens = raw.split(/[\s\-_]+/);

  // Find 2-letter key (AJ, AN, LJ, LN, YA, YN, PJ, UF, NF, UP)
  let matchedKey: string | undefined;
  for (const key of Object.keys(BATCH_CODE_MAPPING)) {
    if (tokens.some(t => t.includes(key)) || raw.includes(key)) {
      matchedKey = key;
      break;
    }
  }

  // Air Batch check: the code token containing the batch key (e.g. AJ252MP, YA31MP) must end with 'P'
  // Ignore center names like SIP
  let isAirBatch = false;
  if (matchedKey) {
    const codeToken = tokens.find(t => t.includes(matchedKey));
    if (codeToken && codeToken.endsWith("P")) {
      isAirBatch = true;
    }
  } else {
    // Fallback: only tokens that contain digits and end with P (e.g. 252MP)
    isAirBatch = tokens.some(t => /\d+[A-Z]*P$/.test(t));
  }

  const grade = matchedKey ? BATCH_CODE_MAPPING[matchedKey].grade : undefined;
  const className = matchedKey ? BATCH_CODE_MAPPING[matchedKey].className : undefined;
  const stream = matchedKey ? BATCH_CODE_MAPPING[matchedKey].stream : undefined;

  let wing: string | undefined;
  if (isAirBatch) {
    wing = "Air Batch";
  } else if (className === "8th" || className === "9th" || className === "10th" || stream === "Foundation") {
    wing = "Foundation";
  } else if (className === "11th" || className === "12th" || className === "Dropper" || stream === "JEE" || stream === "NEET") {
    wing = "Senior Wing English";
  }

  return {
    rawCode: batchCode,
    batchKey: matchedKey,
    grade,
    className,
    stream,
    isAirBatch,
    wing
  };
}

function cleanString(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/ch\s*-\s*\d+/gi, "")
    .replace(/chapter\s*\d+/gi, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeSimilarity(s1: string, s2: string): number {
  const c1 = cleanString(s1);
  const c2 = cleanString(s2);

  if (!c1 || !c2) return 0;
  if (c1 === c2) return 1.0;
  if (c2.startsWith(c1) || c1.startsWith(c2)) return 0.96;
  if (c1.includes(c2) || c2.includes(c1)) return 0.85;

  const words1 = new Set(c1.split(" ").filter(w => w.length > 2));
  const words2 = new Set(c2.split(" ").filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let common = 0;
  for (const w of words1) {
    if (words2.has(w)) common++;
  }

  const union = new Set([...words1, ...words2]).size;
  return common / union;
}

export function findMatchingChapterTags(
  userQuery: string,
  subjectFilter?: string,
  batchCode?: string,
  maxResults: number = 6
): MatchResult {
  const query = (userQuery || "").trim();
  const batchInfo = parseBatchCode(batchCode);

  if (!query || query.length < 2) {
    return { matches: [], status: "empty", detectedBatchInfo: batchInfo };
  }

  const cleanQuery = cleanString(query);
  const scoredItems: Array<{ item: ChapterTagItem; score: number; isExact: boolean }> = [];
  const seenKeys = new Set<string>();

  for (const item of CHAPTER_TAG_DATABASE) {
    // 1. Strict Class Filter if batch specifies class (e.g. Dropper, 11th, 12th, 8th, 9th, 10th)
    if (batchInfo?.className) {
      const bClass = batchInfo.className.toLowerCase();
      const iClass = (item.className || "").toLowerCase();
      if (bClass !== iClass) {
        continue; // Strictly discard mismatching class! Never show 8th/10th/11th for Dropper!
      }
    }

    // 2. Strict Wing / Air Batch Filter
    if (batchInfo?.isAirBatch) {
      // Must be Air Batch!
      if (!item.wing.toLowerCase().includes("air")) {
        continue;
      }
    } else if (batchInfo?.wing) {
      // Must NOT be Air Batch!
      if (item.wing.toLowerCase().includes("air")) {
        continue;
      }
      // Must match Senior Wing or Foundation
      if (!item.wing.toLowerCase().includes(batchInfo.wing.toLowerCase())) {
        continue;
      }
    }

    let score = 0;
    const cleanChap = cleanString(item.chapterName);
    const cleanTag = cleanString(item.tagName);

    if (cleanChap === cleanQuery || cleanTag === cleanQuery) {
      score = 1.0;
    } else {
      const simChap = computeSimilarity(cleanQuery, item.chapterName);
      const simTag = computeSimilarity(cleanQuery, item.tagName);
      score = Math.max(simChap, simTag);
    }

    if (score < 0.25) continue;

    // Subject Boost
    if (subjectFilter && item.subject) {
      const sLower = item.subject.toLowerCase();
      const fLower = subjectFilter.toLowerCase();
      if (sLower.includes(fLower) || fLower.includes(sLower) || 
          (fLower === "maths" && sLower === "mathematics") || 
          (fLower === "mathematics" && sLower === "maths") ||
          (fLower === "botany" && (sLower === "biology" || sLower === "botany")) ||
          (fLower === "zoology" && (sLower === "biology" || sLower === "zoology"))) {
        score += 0.25;
      }
    }

    // Deduplication Key
    const dedupKey = `${item.tagName}__${item.wing}__${item.className}__${item.subject}`.toLowerCase();
    if (seenKeys.has(dedupKey)) continue;
    seenKeys.add(dedupKey);

    scoredItems.push({
      item,
      score,
      isExact: score >= 0.95
    });
  }

  scoredItems.sort((a, b) => b.score - a.score);
  const topMatches = scoredItems.slice(0, maxResults);
  const exact = topMatches.find(m => m.isExact)?.item;

  let otherClassMatches: Array<{ item: ChapterTagItem; score: number; isExact: boolean }> | undefined;

  // If 0 matches found in current class/wing, find which class this chapter actually belongs to (e.g. 11th / Dropper)
  if (topMatches.length === 0 && batchInfo?.className) {
    const otherScored: Array<{ item: ChapterTagItem; score: number; isExact: boolean }> = [];
    const otherSeen = new Set<string>();

    for (const item of CHAPTER_TAG_DATABASE) {
      let score = 0;
      const cleanChap = cleanString(item.chapterName);
      const cleanTag = cleanString(item.tagName);

      if (cleanChap === cleanQuery || cleanTag === cleanQuery) {
        score = 1.0;
      } else {
        const simChap = computeSimilarity(cleanQuery, item.chapterName);
        const simTag = computeSimilarity(cleanQuery, item.tagName);
        score = Math.max(simChap, simTag);
      }

      if (score < 0.25) continue;

      // Subject Boost
      if (subjectFilter && item.subject) {
        const sLower = item.subject.toLowerCase();
        const fLower = subjectFilter.toLowerCase();
        if (sLower.includes(fLower) || fLower.includes(sLower) ||
            (fLower === "maths" && sLower === "mathematics") || 
            (fLower === "mathematics" && sLower === "maths") ||
            (fLower === "botany" && (sLower === "biology" || sLower === "botany")) ||
            (fLower === "zoology" && (sLower === "biology" || sLower === "zoology"))) {
          score += 0.30;
        }
      }

      // Wing Preference based on batch
      if (batchInfo?.isAirBatch) {
        if (item.wing.toLowerCase().includes("air")) score += 0.30;
        else score -= 0.20;
      } else {
        if (!item.wing.toLowerCase().includes("air")) score += 0.30;
        else score -= 0.30;
      }

      const dedupKey = `${item.tagName}__${item.wing}__${item.className}__${item.subject}`.toLowerCase();
      if (otherSeen.has(dedupKey)) continue;
      otherSeen.add(dedupKey);

      otherScored.push({
        item,
        score,
        isExact: score >= 0.95
      });
    }

    otherScored.sort((a, b) => b.score - a.score);
    otherClassMatches = otherScored.slice(0, 4);
  }

  return {
    exactMatch: exact,
    matches: topMatches,
    otherClassMatches,
    status: exact ? "matched" : (topMatches.length > 0 ? "suggested" : "not_found"),
    detectedBatchInfo: batchInfo
  };
}

// Get all official chapters for a specific class, subject, and wing
export function getClassChapters(className?: string, subject?: string, isAirBatch: boolean = false): ChapterTagItem[] {
  if (!className) return [];
  const cleanClass = className.toLowerCase();
  const seen = new Set<string>();
  const results: ChapterTagItem[] = [];

  for (const item of CHAPTER_TAG_DATABASE) {
    if ((item.className || "").toLowerCase() !== cleanClass) continue;
    if (isAirBatch) {
      if (!item.wing.toLowerCase().includes("air")) continue;
    } else {
      if (item.wing.toLowerCase().includes("air")) continue;
    }

    if (subject && item.subject) {
      const sLower = item.subject.toLowerCase();
      const fLower = subject.toLowerCase();
      if (!sLower.includes(fLower) && !fLower.includes(sLower) &&
          !(fLower === "maths" && sLower === "mathematics") &&
          !(fLower === "mathematics" && sLower === "maths") &&
          !(fLower === "botany" && (sLower === "biology" || sLower === "botany")) &&
          !(fLower === "zoology" && (sLower === "biology" || sLower === "zoology"))) {
        continue;
      }
    }

    const key = item.chapterName.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(item);
  }
  return results;
}
