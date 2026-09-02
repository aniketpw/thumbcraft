import { BatchPreset, SubjectType, TeacherProfile, TemplateStyle } from '../types/thumbnail';

// High-quality SVG Teacher Avatars (Cutout style with transparent backgrounds)
export function createTeacherCutoutSvg(
  name: string,
  suitColor: string = '#ffffff',
  tieColor: string = '#000000',
  hairColor: string = '#0f172a',
  skinColor: string = '#e2a77a',
  isGlasses: boolean = false,
  gender: 'male' | 'female' = 'male',
  shirtType: 'pw_polo' | 'blazer' = 'pw_polo'
): string {
  const isPWPolo = shirtType === 'pw_polo';
  
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" width="400" height="520">
    <defs>
      <linearGradient id="poloGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#edf2f7" />
      </linearGradient>
      <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${suitColor}" />
        <stop offset="100%" stop-color="#090d16" />
      </linearGradient>
      <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${skinColor}" />
        <stop offset="100%" stop-color="#c98a5e" />
      </linearGradient>
      <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${hairColor}" />
        <stop offset="100%" stop-color="#1e1b4b" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" flood-opacity="0.25"/>
      </filter>
    </defs>
    
    <!-- Body / Shirt -->
    <g id="body" filter="url(#shadow)">
      ${isPWPolo ? `
        <!-- White PW Polo Shirt -->
        <path d="M 50 520 L 65 310 C 75 250 120 230 160 230 L 240 230 C 280 230 325 250 335 310 L 350 520 Z" fill="url(#poloGrad)" stroke="#cbd5e1" stroke-width="1.5" />
        
        <!-- Polo Collar Left & Right -->
        <polygon points="160,230 200,285 165,295 135,245" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" />
        <polygon points="240,230 200,285 235,295 265,245" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" />
        
        <!-- Button Placket -->
        <rect x="193" y="280" width="14" height="65" rx="3" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1" />
        <circle cx="200" cy="295" r="2.5" fill="#64748b" />
        <circle cx="200" cy="320" r="2.5" fill="#64748b" />
        <circle cx="200" cy="335" r="2.5" fill="#64748b" />

        <!-- Circular PW Logo on Left Chest (Viewer's Right) -->
        <circle cx="270" cy="370" r="16" fill="#0f172a" />
        <circle cx="270" cy="370" r="14.5" fill="#ffffff" />
        <circle cx="270" cy="370" r="13" fill="#0f172a" />
        <text x="270" y="375" font-family="'Times New Roman', serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">PW</text>
      ` : `
        <!-- Blazer / Formal Suit -->
        <path d="M 60 520 L 70 330 C 80 270 120 250 160 250 L 240 250 C 280 250 320 270 330 330 L 340 520 Z" fill="url(#bodyGrad)" />
        <polygon points="175,250 200,320 225,250 200,240" fill="#ffffff" />
        <polygon points="194,270 206,270 212,410 200,440 188,410" fill="${tieColor}" />
        <polygon points="150,250 200,380 180,380 120,270" fill="#0f172a" opacity="0.6"/>
        <polygon points="250,250 200,380 220,380 280,270" fill="#0f172a" opacity="0.6"/>
      `}
    </g>

    <!-- Neck -->
    <rect x="180" y="185" width="40" height="60" rx="6" fill="url(#skinGrad)" />
    
    <!-- Head Base -->
    <ellipse cx="200" cy="145" rx="62" ry="72" fill="url(#skinGrad)" filter="url(#shadow)" />
    
    <!-- Ears -->
    <ellipse cx="138" cy="145" rx="9" ry="15" fill="${skinColor}" />
    <ellipse cx="262" cy="145" rx="9" ry="15" fill="${skinColor}" />
    
    <!-- Hair & Moustache/Beard -->
    ${gender === 'male' ? `
      <!-- Male Hair (Modern Trimmed Sidefade) -->
      <path d="M 138 135 C 134 75 165 45 200 42 C 235 45 266 75 262 135 C 252 95 235 78 200 78 C 165 78 148 95 138 135 Z" fill="url(#hairGrad)" />
      <!-- Mustache & Goatee Style (Exact match to sample faculty) -->
      <path d="M 178 178 Q 200 172 222 178 Q 215 186 200 186 Q 185 186 178 178 Z" fill="#0f172a" />
      <ellipse cx="200" cy="205" rx="10" ry="6" fill="#0f172a" opacity="0.85" />
    ` : `
      <!-- Female Hair -->
      <path d="M 125 150 C 120 70 160 40 200 40 C 240 40 280 70 275 150 C 290 220 270 290 260 320 C 250 250 265 150 255 100 C 235 70 165 70 145 100 C 135 150 150 250 140 320 C 130 290 110 220 125 150 Z" fill="url(#hairGrad)" />
    `}

    <!-- Eyebrows -->
    <path d="M 160 122 Q 175 116 190 122" stroke="#0f172a" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    <path d="M 210 122 Q 225 116 240 122" stroke="#0f172a" stroke-width="4.5" stroke-linecap="round" fill="none"/>

    <!-- Eyes -->
    <circle cx="175" cy="134" r="5.5" fill="#0f172a" />
    <circle cx="177" cy="132" r="1.8" fill="#ffffff" />
    <circle cx="225" cy="134" r="5.5" fill="#0f172a" />
    <circle cx="227" cy="132" r="1.8" fill="#ffffff" />

    <!-- Glasses (if enabled) -->
    ${isGlasses ? `
      <rect x="155" y="122" width="38" height="25" rx="5" fill="rgba(255,255,255,0.15)" stroke="#0f172a" stroke-width="3" />
      <rect x="207" y="122" width="38" height="25" rx="5" fill="rgba(255,255,255,0.15)" stroke="#0f172a" stroke-width="3" />
      <line x1="193" y1="132" x2="207" y2="132" stroke="#0f172a" stroke-width="3" />
      <line x1="155" y1="130" x2="138" y2="132" stroke="#0f172a" stroke-width="3" />
      <line x1="245" y1="130" x2="262" y2="132" stroke="#0f172a" stroke-width="3" />
    ` : ''}

    <!-- Nose -->
    <path d="M 200 134 L 195 158 L 205 158" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.6"/>

    <!-- Confident Smile -->
    <path d="M 182 188 Q 200 198 218 188" stroke="#881337" stroke-width="3.5" stroke-linecap="round" fill="none" />
    <path d="M 185 188 Q 200 195 215 188" fill="#ffffff" />

  </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_TEACHERS: TeacherProfile[] = [
  {
    id: 'pw_faculty_chemistry',
    name: 'PW Chemistry Faculty',
    subject: 'Chemistry',
    title: 'Chemistry Expert • JEE/NEET Faculty',
    imageUrl: createTeacherCutoutSvg('PW Faculty', '#ffffff', '#000000', '#090d16', '#df9e72', false, 'male', 'pw_polo'),
    defaultPosition: 'right'
  },
  {
    id: 'rajwant_sir',
    name: 'Rajwant Sir',
    subject: 'Physics',
    title: 'Physics Legend • JEE/NEET Expert',
    imageUrl: createTeacherCutoutSvg('Rajwant Sir', '#ffffff', '#06b6d4', '#020617', '#f4b285', true, 'male', 'pw_polo'),
    defaultPosition: 'right'
  },
  {
    id: 'pankaj_sir',
    name: 'Pankaj Sir',
    subject: 'Chemistry',
    title: 'Chemistry HOD • Organic Maestro',
    imageUrl: createTeacherCutoutSvg('Pankaj Sir', '#ffffff', '#10b981', '#172554', '#f1b387', true, 'male', 'pw_polo'),
    defaultPosition: 'right'
  },
  {
    id: 'mr_sir',
    name: 'MR Sir',
    subject: 'Physics',
    title: 'Physics Guru • NEET Specialist',
    imageUrl: createTeacherCutoutSvg('MR Sir', '#1e1b4b', '#eab308', '#09090b', '#e2a77a', false, 'male', 'blazer'),
    defaultPosition: 'right'
  },
  {
    id: 'alakh_sir',
    name: 'Alakh Pandey Sir',
    subject: 'Physics',
    title: 'Founder PW • Physics Mentor',
    imageUrl: createTeacherCutoutSvg('Alakh Sir', '#18181b', '#ef4444', '#18181b', '#f3b890', true, 'male', 'blazer'),
    defaultPosition: 'right'
  },
  {
    id: 'sachin_sir',
    name: 'Sachin Sir',
    subject: 'Mathematics',
    title: 'Maths Wizard • Calculus King',
    imageUrl: createTeacherCutoutSvg('Sachin Sir', '#ffffff', '#f97316', '#0f172a', '#f5bca0', false, 'male', 'pw_polo'),
    defaultPosition: 'right'
  },
  {
    id: 'tarun_sir',
    name: 'Tarun Sir',
    subject: 'Biology',
    title: 'Botany & Biology HOD • NEET Topper Maker',
    imageUrl: createTeacherCutoutSvg('Tarun Sir', '#ffffff', '#84cc16', '#1e293b', '#f2b588', true, 'male', 'pw_polo'),
    defaultPosition: 'right'
  },
  {
    id: 'samapti_mam',
    name: 'Samapti Ma\'am',
    subject: 'Biology',
    title: 'Zoology Specialist • NEET Mentor',
    imageUrl: createTeacherCutoutSvg('Samapti Mam', '#4c1d95', '#ec4899', '#18181b', '#f6c3a5', false, 'female', 'blazer'),
    defaultPosition: 'right'
  }
];

export const BATCH_PRESETS: BatchPreset[] = [
  {
    id: 'sip_s41',
    name: 'SIP S41-AJ31MA 2026',
    tagline: 'PW Special Intensive Program',
    color: '#06b6d4',
    badgeBg: '#ffffff',
    badgeText: '#000000',
    targetExam: 'JEE / NEET 2026'
  },
  {
    id: 'lakshya_jee',
    name: 'LAKSHYA JEE 2026',
    tagline: 'Class 12th + JEE Main & Advanced',
    color: '#eab308',
    badgeBg: '#ca8a04',
    badgeText: '#000000',
    targetExam: 'JEE 2026'
  },
  {
    id: 'arjuna_jee',
    name: 'ARJUNA JEE 2026',
    tagline: 'Class 11th + JEE Foundation to Apex',
    color: '#06b6d4',
    badgeBg: '#0891b2',
    badgeText: '#ffffff',
    targetExam: 'Class 11 JEE'
  },
  {
    id: 'yakeen_neet',
    name: 'YAKEEN NEET 2026',
    tagline: 'India\'s Biggest NEET Dropper Batch',
    color: '#10b981',
    badgeBg: '#059669',
    badgeText: '#ffffff',
    targetExam: 'NEET 2026'
  },
  {
    id: 'prayas_jee',
    name: 'PRAYAS JEE 2026',
    tagline: 'Dropper Batch for JEE Main & Adv',
    color: '#f97316',
    badgeBg: '#ea580c',
    badgeText: '#ffffff',
    targetExam: 'JEE Droppers'
  },
  {
    id: 'shreshtha_board',
    name: 'SHRESHTHA 12th',
    tagline: 'Target 98%+ in CBSE & State Boards',
    color: '#ec4899',
    badgeBg: '#db2777',
    badgeText: '#ffffff',
    targetExam: 'Board 2026'
  },
  {
    id: 'udaan_class10',
    name: 'UDAAN CLASS 10th',
    tagline: 'Foundation + NTSE + Olympiads',
    color: '#8b5cf6',
    badgeBg: '#7c3aed',
    badgeText: '#ffffff',
    targetExam: 'Class 10th'
  },
  {
    id: 'manzil_oneshot',
    name: 'MANZIL 2026',
    tagline: 'Free Complete One-Shot Series',
    color: '#ef4444',
    badgeBg: '#dc2626',
    badgeText: '#ffffff',
    targetExam: 'One-Shot Series'
  }
];

export interface TemplateDefinition {
  id: TemplateStyle;
  name: string;
  category: 'PW Official' | 'High CTR' | 'Batch Series' | 'Exam Special' | 'Minimalist';
  description: string;
  themeColor: string;
  secondaryColor: string;
  bgColor: string;
  fontFamily: 'Montserrat' | 'Bebas Neue' | 'Oswald' | 'Anton' | 'Outfit' | 'Poppins' | 'Bangers';
  previewGradient: string;
}

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    id: 'pw_official_torn',
    name: 'PW Official Cyan Torn Paper (Uploaded Format)',
    category: 'PW Official',
    description: 'Exact format from your image: Cyan diamond argyle, realistic torn paper rip edge, white pill batch box, and PW logo.',
    themeColor: '#00d2eb',
    secondaryColor: '#0b1a24',
    bgColor: '#ffffff',
    fontFamily: 'Montserrat',
    previewGradient: 'from-cyan-400 via-cyan-500 to-white'
  },
  {
    id: 'pw_dark_gold',
    name: 'PW Iconic Dark & Gold',
    category: 'High CTR',
    description: 'High-contrast dark texture, bold glowing yellow badge & 3D text. High YouTube CTR.',
    themeColor: '#facc15',
    secondaryColor: '#38bdf8',
    bgColor: '#090d16',
    fontFamily: 'Montserrat',
    previewGradient: 'from-amber-500 via-slate-900 to-black'
  },
  {
    id: 'cyber_neon',
    name: 'Cyber Neon Cyan',
    category: 'High CTR',
    description: 'Electric cyan & purple cyberpunk glow with geometric badges and tech grid lines.',
    themeColor: '#00f0ff',
    secondaryColor: '#f43f5e',
    bgColor: '#050814',
    fontFamily: 'Outfit',
    previewGradient: 'from-cyan-400 via-indigo-950 to-slate-950'
  },
  {
    id: 'fiery_oneshot',
    name: 'Fiery One-Shot Marathon',
    category: 'Exam Special',
    description: 'Blazing flame gradient, diagonal hazard accents & massive ONE-SHOT impact label.',
    themeColor: '#ff4d00',
    secondaryColor: '#ffd000',
    bgColor: '#180404',
    fontFamily: 'Bebas Neue',
    previewGradient: 'from-red-600 via-orange-600 to-slate-950'
  },
  {
    id: 'royal_emerald',
    name: 'Royal Emerald NEET',
    category: 'Batch Series',
    description: 'Deep royal emerald green with luxurious gold trim, perfect for Biology & NEET batches.',
    themeColor: '#10b981',
    secondaryColor: '#f59e0b',
    bgColor: '#021811',
    fontFamily: 'Poppins',
    previewGradient: 'from-emerald-600 via-teal-950 to-slate-950'
  },
  {
    id: 'split_contrast',
    name: 'Split Contrast Studio',
    category: 'Batch Series',
    description: 'Modern 50/50 dual tone layout with solid punchy typography card on left side.',
    themeColor: '#6366f1',
    secondaryColor: '#f59e0b',
    bgColor: '#0f172a',
    fontFamily: 'Montserrat',
    previewGradient: 'from-indigo-600 via-slate-900 to-slate-950'
  },
  {
    id: 'comic_action',
    name: 'Comic Pop Action (CTR 15%+)',
    category: 'High CTR',
    description: 'Vibrant sunburst background, heavy comic comic book outline text, high engagement.',
    themeColor: '#fbbf24',
    secondaryColor: '#ef4444',
    bgColor: '#1c1917',
    fontFamily: 'Bangers',
    previewGradient: 'from-amber-400 via-red-600 to-zinc-900'
  },
  {
    id: 'deep_violet',
    name: 'Deep Space Nebula JEE',
    category: 'Batch Series',
    description: 'Deep cosmic purple with starlight dust and frosted glass effect badges.',
    themeColor: '#a855f7',
    secondaryColor: '#38bdf8',
    bgColor: '#0a0314',
    fontFamily: 'Oswald',
    previewGradient: 'from-purple-600 via-violet-950 to-slate-950'
  },
  {
    id: 'board_topper',
    name: 'Board Exam Topper 95%+',
    category: 'Exam Special',
    description: 'Crisp Navy & Crimson board exam preparation styling with verified topper stamp.',
    themeColor: '#38bdf8',
    secondaryColor: '#ef4444',
    bgColor: '#0b132b',
    fontFamily: 'Montserrat',
    previewGradient: 'from-blue-600 via-slate-900 to-slate-950'
  },
  {
    id: 'minimal_studio',
    name: 'Minimal Clean Studio',
    category: 'Minimalist',
    description: 'Ultra-clean sans-serif typography hierarchy with soft atmospheric vignette.',
    themeColor: '#ffffff',
    secondaryColor: '#f59e0b',
    bgColor: '#111827',
    fontFamily: 'Outfit',
    previewGradient: 'from-slate-700 via-slate-900 to-black'
  }
];

export const SAMPLE_INPUT_PRESETS = [
  {
    title: 'PW Format (From Your Image) - Chemical Bonding',
    text: 'Chemical Bonding and Molecular Structure - 11 : Reason for Hybridisaton | SIP S41-AJ31MA 2026 | Chemistry'
  },
  {
    title: 'Physics - Electrostatics (Lakshya)',
    text: 'Electrostatics - 04 : Coulomb\'s Law + Electric Field Intensity | LAKSHYA JEE 2026 | Physics'
  },
  {
    title: 'Physics - Rotational Motion (Arjuna)',
    text: 'Rotational Motion - 03 : Moment of Inertia & Theorem of Parallel Axes | ARJUNA JEE 2026 | Physics'
  },
  {
    title: 'Chemistry - Organic GOC (Yakeen)',
    text: 'General Organic Chemistry - 05 : Inductive & Resonance Effect | YAKEEN NEET 2026 | Chemistry'
  },
  {
    title: 'Maths - Definite Integration (Prayas)',
    text: 'Definite Integration - 08 : King\'s Property & Top 10 PYQs | PRAYAS JEE 2026 | Mathematics'
  },
  {
    title: 'Biology - Genetics & Punnett Square',
    text: 'Principles of Inheritance - 02 : Mendel\'s Laws & Dihybrid Cross | YAKEEN NEET 2026 | Biology'
  }
];

export const DEMO_BATCH_SCHEDULE = `Chemical Bonding and Molecular Structure - 01 : Octet Rule & Lewis Structures | SIP S41-AJ31MA 2026 | Chemistry
Chemical Bonding and Molecular Structure - 02 : Ionic Bonding & Lattice Energy | SIP S41-AJ31MA 2026 | Chemistry
Chemical Bonding and Molecular Structure - 03 : Covalent Bond & Dipole Moment | SIP S41-AJ31MA 2026 | Chemistry
Chemical Bonding and Molecular Structure - 11 : Reason for Hybridisaton | SIP S41-AJ31MA 2026 | Chemistry
Electrostatics - 01 : Electric Charges & Coulomb's Law | LAKSHYA JEE 2026 | Physics
Electrostatics - 02 : Electric Field Lines & Gauss Law | LAKSHYA JEE 2026 | Physics`;
