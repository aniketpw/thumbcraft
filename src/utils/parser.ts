import { ParsedInputResult, SubjectType } from '../types/thumbnail';

const SUBJECT_KEYWORDS: Record<SubjectType, string[]> = {
  Physics: [
    'physics', 'electrostatics', 'kinematics', 'optics', 'thermodynamics', 'gravitation',
    'rotational motion', 'current electricity', 'magnetism', 'capacitance', 'semiconductor',
    'waves', 'shm', 'fluids', 'work power energy', 'modern physics', 'electromagnetic',
    'ray optics', 'wave optics', 'units and measurements', 'newton laws', 'nlms', 'ktg',
    'alternating current', 'ac circuit', 'electrodynamics', 'nuclear physics'
  ],
  Chemistry: [
    'chemistry', 'organic', 'inorganic', 'physical chem', 'chemical bonding', 'periodic table',
    'thermodynamics', 'equilibrium', 'solutions', 'electrochemistry', 'chemical kinetics',
    'surface chemistry', 'metallurgy', 'p block', 'd block', 'f block', 'coordination compounds',
    'haloalkanes', 'alcohols', 'phenols', 'aldehydes', 'ketones', 'carboxylic acids', 'amines',
    'biomolecules', 'polymers', 'atomic structure', 'redox', 'hydrocarbons', 'gaseous state',
    'solid state', 'mole concept', 'goc'
  ],
  Mathematics: [
    'maths', 'mathematics', 'calculus', 'integration', 'differentiation', 'matrices',
    'determinants', 'continuity', 'differentiability', 'limits', 'relations and functions',
    'inverse trig', 'itf', 'probability', 'vectors', '3d geometry', 'straight lines',
    'circles', 'parabola', 'ellipse', 'hyperbola', 'complex numbers', 'quadratic equations',
    'permutations', 'combinations', 'pnc', 'binomial theorem', 'sequence and series', 'trigonometry'
  ],
  Botany: [
    'botany', 'plant physiology', 'photosynthesis', 'respiration', 'plant reproduction',
    'morphology of flowering plants', 'anatomy of flowering plants', 'living world',
    'biological classification', 'plant kingdom', 'ecosystem', 'biodiversity'
  ],
  Zoology: [
    'zoology', 'human physiology', 'human reproduction', 'reproductive health', 'evolution',
    'genetics', 'biotechnology', 'digestion', 'circulation', 'nervous system', 'endocrine',
    'locomotion', 'animal kingdom', 'human health and disease'
  ],
  English: ['english', 'grammar', 'reading comprehension', 'literature', 'writing skills', 'tenses'],
  SST: ['history', 'geography', 'civics', 'economics', 'sst', 'social science'],
  General: ['general knowledge', 'aptitude', 'reasoning', 'current affairs', 'general science']
};

const BATCH_KEYWORDS = [
  'Lakshya JEE', 'Lakshya NEET', 'Lakshya', 'Arjuna JEE', 'Arjuna NEET', 'Arjuna',
  'Yakeen NEET', 'Yakeen', 'Prayas JEE', 'Prayas NEET', 'Prayas', 'Shreshtha',
  'Udaan', 'Neev', 'Sankalp', 'Manzil', 'Vidyapeeth', 'Pathshala', 'Board Booster',
  'Aarambh', 'Abhimanyu', 'Crash Course', 'Fastrack', 'Victory', 'Rankers', 'Toppers'
];

export function parseThumbnailInput(rawInput: string): ParsedInputResult {
  const cleanInput = rawInput.trim();
  if (!cleanInput) {
    return {
      chapterTitle: 'Chemical Bonding and Molecular Structure',
      lectureNo: '11',
      topicDescription: 'Reason for Hybridisaton',
      subtopics: [],
      rawText: rawInput
    };
  }

  let remaining = cleanInput;
  let chapterTitle = '';
  let lectureNo = '01';
  let topicDescription = '';
  let lectureLabel = 'LECTURE';
  let subject: SubjectType | undefined;
  let batchName: string | undefined;
  let teacherName: string | undefined;
  let badgeText: string | undefined;
  const subtopics: string[] = [];

  // Pipe separated parts check: "Topic - 11 : Subtopic | Batch Code | Subject | Teacher"
  if (remaining.includes('|')) {
    const pipeParts = remaining.split('|').map(p => p.trim()).filter(Boolean);
    remaining = pipeParts[0]; // main content is in part 1

    for (let i = 1; i < pipeParts.length; i++) {
      const part = pipeParts[i];
      // Check if it's a batch code (e.g. SIP S41-AJ31MA 2026, Lakshya JEE, etc.)
      if (part.match(/\b(SIP|BATCH|JEE|NEET|202[4-7]|LAKSHYA|ARJUNA|YAKEEN|PRAYAS|SHRESHTHA|UDAAN|MANZIL)\b/i) || part.includes('-') && part.length > 5) {
        batchName = part;
      } else if (part.match(/\b(Sir|Mam|Ma'am|Dr\.?)\b/i) || part.toLowerCase().startsWith('by ')) {
        teacherName = part.replace(/^by\s+/i, '');
      } else {
        // Check if subject
        for (const [subj] of Object.entries(SUBJECT_KEYWORDS)) {
          if (part.toLowerCase().includes(subj.toLowerCase())) {
            subject = subj as SubjectType;
            break;
          }
        }
      }
    }
  }

  // Check for colon separator: "Chapter - 11 : Reason for Hybridisaton"
  if (remaining.includes(':')) {
    const [leftPart, rightPart] = remaining.split(':').map(p => p.trim());
    topicDescription = rightPart || '';
    remaining = leftPart || '';
  }

  // Check for hyphen lecture pattern: "Chemical Bonding and Molecular Structure - 11" or "Electrostatics - 04"
  const dashLecMatch = remaining.match(/^(.*?)\s*[-–]\s*(?:lec(?:ture)?\s*)?(\d+|one[- ]?shot)\s*$/i);
  if (dashLecMatch) {
    chapterTitle = dashLecMatch[1].trim();
    lectureNo = dashLecMatch[2].trim();
    if (lectureNo.length === 1) lectureNo = `0${lectureNo}`;
    remaining = '';
  } else {
    // 1. Detect Lecture Number & Label in remaining
    const oneShotMatch = remaining.match(/\b(one[- ]?shot|maha[- ]?marathon|full[- ]?chapter)\b/i);
    if (oneShotMatch) {
      lectureNo = 'ONE SHOT';
      lectureLabel = 'SPECIAL';
      badgeText = '1-SHOT';
      remaining = remaining.replace(oneShotMatch[0], ' ');
    } else {
      const lecMatch = remaining.match(/\b(lec(?:ture)?|l|part|ep(?:isode)?|day|session|class)[\s#.:-]*(\d+)\b/i);
      if (lecMatch) {
        const labelWord = lecMatch[1].toUpperCase();
        const num = parseInt(lecMatch[2], 10);
        lectureNo = num < 10 ? `0${num}` : `${num}`;
        
        if (labelWord.startsWith('PART')) lectureLabel = 'PART';
        else if (labelWord.startsWith('DAY')) lectureLabel = 'DAY';
        else if (labelWord.startsWith('EP')) lectureLabel = 'EPISODE';
        else lectureLabel = 'LECTURE';

        remaining = remaining.replace(lecMatch[0], ' ');
      }
    }
  }

  // 2. Detect Teacher Name if not found
  if (!teacherName) {
    const teacherMatch = remaining.match(/(?:by|faculty|sir|mam|dr\.?)\s+([A-Z][a-zA-Z\s.]+?(?:Sir|Mam|Ma'am|Dr)?)\b/i) ||
                         remaining.match(/\b([A-Z][a-zA-Z\s]{1,15}\s(?:Sir|Mam|Ma'am))\b/i);
    if (teacherMatch) {
      teacherName = teacherMatch[1].replace(/^(by|faculty)\s+/i, '').trim();
      if (!teacherName.toLowerCase().includes('sir') && !teacherName.toLowerCase().includes('mam') && !teacherName.toLowerCase().includes('dr')) {
        teacherName += ' Sir';
      }
      remaining = remaining.replace(teacherMatch[0], ' ');
    }
  }

  // 3. Detect Batch if not found
  if (!batchName) {
    for (const b of BATCH_KEYWORDS) {
      const bRegex = new RegExp(`\\b${b}\\b(?:\\s*(?:202[4-7]|11th|12th|Dropper))?`, 'i');
      const bMatch = remaining.match(bRegex);
      if (bMatch) {
        batchName = bMatch[0].trim();
        remaining = remaining.replace(bMatch[0], ' ');
        break;
      }
    }
  }

  // If chapterTitle is not set yet from dash match
  if (!chapterTitle) {
    // 5. Extract Subtopics / Highlights inside parentheses or brackets
    const parenMatch = remaining.match(/[\(\[\{](.+?)[\)\]\}]/);
    if (parenMatch) {
      const rawSub = parenMatch[1];
      if (!topicDescription) {
        topicDescription = rawSub;
      }
      rawSub.split(/[,+&|]/).forEach(s => {
        const trimmed = s.trim();
        if (trimmed && trimmed.length > 2) subtopics.push(trimmed);
      });
      remaining = remaining.replace(parenMatch[0], ' ');
    }

    chapterTitle = remaining
      .replace(/[|:;,\-_/]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (!chapterTitle || chapterTitle.length < 2) {
    chapterTitle = 'Chemical Bonding and Molecular Structure';
  }

  // 4. Detect Subject
  if (!subject) {
    const fullText = (cleanInput + ' ' + chapterTitle + ' ' + topicDescription).toLowerCase();
    for (const [subj, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
      if (keywords.some(kw => fullText.includes(kw.toLowerCase()))) {
        subject = subj as SubjectType;
        break;
      }
    }
  }

  if (!subject) {
    subject = 'Chemistry';
  }

  if (!batchName) {
    batchName = 'SIP S41-AJ31MA 2026';
  }

  if (!topicDescription) {
    topicDescription = 'Reason for Hybridisaton';
  }

  return {
    chapterTitle,
    lectureNo,
    topicDescription,
    lectureLabel,
    subject,
    batchName,
    teacherName,
    subtopics: subtopics.slice(0, 3),
    badgeText: badgeText || 'LIVE',
    rawText: cleanInput
  };
}

export function parseBatchScheduleInput(rawMultiLine: string): ParsedInputResult[] {
  const lines = rawMultiLine
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  return lines.map(line => parseThumbnailInput(line));
}
