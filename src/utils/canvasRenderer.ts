import { ThumbnailData } from '../types/thumbnail';
import { renderExactPwTornTemplate, drawSubjectIcon } from './pwTemplateGenerator';
import { 
  PW_OFFICIAL_TEMPLATE_DATA_URL,
  PW_OFFICIAL_TEMPLATE_WIDTH,
  PW_OFFICIAL_TEMPLATE_HEIGHT,
  PW_OFFICIAL_TEMPLATE_ASPECT_RATIO 
} from '../assets/pwTemplateImage';

// Cache loaded image elements and pixel content bounds
const imageCache = new Map<string, HTMLImageElement>();
const contentBoundsCache = new WeakMap<HTMLImageElement, { sX: number; sY: number; sW: number; sH: number }>();

function getNonTransparentBounds(img: HTMLImageElement): { sX: number; sY: number; sW: number; sH: number } {
  if (contentBoundsCache.has(img)) {
    return contentBoundsCache.get(img)!;
  }

  const naturalW = img.naturalWidth || 600;
  const naturalH = img.naturalHeight || 800;

  try {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = naturalW;
    tempCanvas.height = naturalH;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) {
      const fallback = { sX: 0, sY: 0, sW: naturalW, sH: naturalH };
      contentBoundsCache.set(img, fallback);
      return fallback;
    }

    tempCtx.drawImage(img, 0, 0);
    const imgData = tempCtx.getImageData(0, 0, naturalW, naturalH);
    const { data, width, height } = imgData;

    let minX = width, minY = height, maxX = 0, maxY = 0;
    let found = false;

    // Scan every 2 pixels for high performance
    const step = 2;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 15) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!found) {
      const fallback = { sX: 0, sY: 0, sW: naturalW, sH: naturalH };
      contentBoundsCache.set(img, fallback);
      return fallback;
    }

    const sX = Math.max(0, minX);
    const sY = Math.max(0, minY);
    const sW = Math.min(width - sX, (maxX - minX) + 1);
    const sH = Math.min(height - sY, (maxY - minY) + 1);

    const result = { sX, sY, sW, sH };
    contentBoundsCache.set(img, result);
    return result;
  } catch {
    // If getImageData fails (e.g. cross-origin restrictions), fallback to full dimensions
    const fallback = { sX: 0, sY: 0, sW: naturalW, sH: naturalH };
    contentBoundsCache.set(img, fallback);
    return fallback;
  }
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!;
    if (cached.complete && cached.naturalWidth > 0) return Promise.resolve(cached);
  }

  // Generate fallback URLs for Google Drive
  const driveIdMatch = src.match(/\/d\/([a-zA-Z0-9_-]+)/) || src.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const driveId = driveIdMatch ? driveIdMatch[1] : null;

  const candidateUrls = [src];
  if (driveId) {
    candidateUrls.push(
      `https://lh3.googleusercontent.com/d/${driveId}`,
      `https://drive.usercontent.google.com/download?id=${driveId}&export=view`,
      `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`
    );
  }

  const tryLoad = (urlIndex: number): Promise<HTMLImageElement | null> => {
    if (urlIndex >= candidateUrls.length) return Promise.resolve(null);
    const currentUrl = candidateUrls[urlIndex];

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      (img as any).referrerPolicy = 'no-referrer';

      img.onload = () => {
        if (img.naturalWidth > 0) {
          imageCache.set(src, img);
          resolve(img);
        } else {
          tryLoad(urlIndex + 1).then(resolve);
        }
      };

      img.onerror = () => {
        // Retry next candidate URL
        tryLoad(urlIndex + 1).then(resolve);
      };

      img.src = currentUrl;
    });
  };

  return tryLoad(0);
}

export async function renderThumbnailToCanvas(
  canvas: HTMLCanvasElement,
  data: ThumbnailData,
  teacherImageUrl: string
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Determine template background image
  let bgImg: HTMLImageElement | null = null;
  const isPwTorn = data.templateStyle === 'pw_official_torn';

  if (data.customBgImage) {
    try {
      bgImg = await loadImage(data.customBgImage);
    } catch (e) {
      console.warn('Failed to load custom background image:', e);
    }
  } else if (isPwTorn) {
    try {
      bgImg = await loadImage(PW_OFFICIAL_TEMPLATE_DATA_URL);
    } catch (e) {
      console.warn('Failed to load official PW template image:', e);
    }
  }

  // 2. Set EXACT Dimensions:
  // Preserve exact natural aspect ratio of the template (784/376) so there is ZERO stretching!
  const is1080p = data.resolution === '1080p';
  let width: number;
  let height: number;

  if (isPwTorn || data.customBgImage) {
    const targetW = is1080p ? 1920 : 1280;
    const aspect = bgImg ? (bgImg.naturalWidth / bgImg.naturalHeight) : PW_OFFICIAL_TEMPLATE_ASPECT_RATIO;
    width = targetW;
    height = Math.round(targetW / aspect);
  } else {
    width = is1080p ? 1920 : 1280;
    height = is1080p ? 1080 : 720;
  }

  const scaleRatio = width / 1920;

  canvas.width = width;
  canvas.height = height;

  // Handle PW Official Torn Template (Exact User Format)
  if (isPwTorn || (data.customBgImage && !['comic_action', 'fiery_oneshot', 'cyber_neon', 'pw_dark_gold', 'royal_emerald', 'split_contrast', 'deep_violet', 'board_topper', 'minimal_studio'].includes(data.templateStyle))) {
    await renderPwOfficialTornLayout(ctx, width, height, data, teacherImageUrl, scaleRatio, bgImg);
    if (data.showSafeZone) {
      drawSafeZoneGuide(ctx, width, height, scaleRatio);
    }
    return;
  }

  // 1. Draw Background
  await drawBackground(ctx, width, height, data, scaleRatio);

  // 2. Draw Background Decor / Grid / Lighting Accents
  drawBackgroundLightingAndDecor(ctx, width, height, data, scaleRatio);

  // 3. Draw Teacher Cutout & Glow
  await drawTeacher(ctx, width, height, data, teacherImageUrl, scaleRatio);

  // 4. Draw Left Content Elements (Batch, Subject, Lecture, Title, Subtopics)
  drawThumbnailContent(ctx, width, height, data, scaleRatio);

  // 5. Draw Extra Badges & Stickers (e.g., LIVE, PYQ SPECIAL)
  drawBadgesAndStickers(ctx, width, height, data, scaleRatio);

  // 6. Draw Safe Zone Simulation if enabled (YouTube timestamp box)
  if (data.showSafeZone) {
    drawSafeZoneGuide(ctx, width, height, scaleRatio);
  }
}

// Dedicated renderer for PW Official Torn Paper Cyan Layout
async function renderPwOfficialTornLayout(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: ThumbnailData,
  teacherImageUrl: string,
  scale: number,
  preloadedBgImg: HTMLImageElement | null = null
) {
  // 1. Background: Exact uploaded template image (or loaded data URL)
  if (preloadedBgImg) {
    ctx.drawImage(preloadedBgImg, 0, 0, width, height);
  } else if (data.customBgImage) {
    try {
      const bgImg = await loadImage(data.customBgImage);
      ctx.drawImage(bgImg, 0, 0, width, height);
    } catch {
      renderExactPwTornTemplate(ctx, width, height, scale);
    }
  } else {
    try {
      const bgImg = await loadImage(PW_OFFICIAL_TEMPLATE_DATA_URL);
      ctx.drawImage(bgImg, 0, 0, width, height);
    } catch {
      renderExactPwTornTemplate(ctx, width, height, scale);
    }
  }

  // 2. Draw Teacher on the Right White Half (Auto-Trimmed & Uniformly Grounded)
  if (teacherImageUrl) {
    try {
      const img = await loadImage(teacherImageUrl);
      if (img) {
        const isRight = data.teacherPosition === 'right';
        const bounds = getNonTransparentBounds(img);
        const { sX, sY, sW, sH } = bounds;
        const aspect = (sW && sH) ? (sW / sH) : 0.75;

        // Prominent, uniform height scale across all teachers (94% height)
        let drawH = height * 0.94 * data.teacherScale;
        let drawW = drawH * aspect;

        // Cap maximum width so it stays within the white section without overflowing torn paper
        const maxSlotW = width * 0.39 * data.teacherScale;
        if (drawW > maxSlotW) {
          drawW = maxSlotW;
          drawH = drawW / aspect;
        }

        // Horizontal center in right white area
        const slotCenterX = isRight ? width * 0.81 : width * 0.19;
        const targetX = slotCenterX - drawW / 2 + data.teacherOffsetX * scale;
        // Grounded precisely at the bottom edge of thumbnail
        const targetY = height - drawH + data.teacherOffsetY * scale;

        ctx.save();

        // Realistic soft cutout shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
        ctx.shadowBlur = 14 * scale;
        ctx.shadowOffsetY = 4 * scale;

        if (data.teacherFlip) {
          ctx.translate(targetX + drawW, targetY);
          ctx.scale(-1, 1);
          ctx.drawImage(img, sX, sY, sW, sH, 0, 0, drawW, drawH);
        } else {
          ctx.drawImage(img, sX, sY, sW, sH, targetX, targetY, drawW, drawH);
        }

        ctx.restore();
      }
    } catch (err) {
      console.error('Failed to draw teacher for PW Torn layout:', err);
    }
  }

  // 3. Top Cyan Text Content: Centered in the Cyan Area with Balanced Line Wrapping
  const cyanCenterX = width * 0.315;
  const maxCyanWidth = width * 0.55;
  const cyanTopY = height * 0.055;
  const cyanMaxBottomY = height * 0.55;
  const cyanAvailableH = cyanMaxBottomY - cyanTopY;

  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let chapterPart = (data.chapterTitle || '').trim();
  const lecPart = data.lectureNo ? ` - ${data.lectureNo}` : '';
  let topicPart = (data.topicDescription || '').trim();

  // Helper to split text into balanced lines of roughly equal visual width
  const wrapTextToBalancedLines = (text: string, currentFontSize: number, maxW: number): string[] => {
    ctx.font = `700 ${currentFontSize}px 'Montserrat', sans-serif`;
    const clean = text.trim();
    if (!clean) return [];

    if (ctx.measureText(clean).width <= maxW) {
      return [clean];
    }

    const words = clean.split(/\s+/).filter(w => w.length > 0);
    if (words.length <= 1) return [clean];

    // Attempt balanced 2-line split if possible
    const totalW = ctx.measureText(clean).width;
    const estimatedLines = Math.ceil(totalW / maxW);

    if (estimatedLines <= 2 && words.length >= 2) {
      let bestSplit = 1;
      let minDiff = Infinity;
      for (let i = 1; i < words.length; i++) {
        const l1 = words.slice(0, i).join(' ');
        const l2 = words.slice(i).join(' ');
        const w1 = ctx.measureText(l1).width;
        const w2 = ctx.measureText(l2).width;
        if (w1 <= maxW && w2 <= maxW) {
          const diff = Math.abs(w1 - w2);
          if (diff < minDiff) {
            minDiff = diff;
            bestSplit = i;
          }
        }
      }
      if (minDiff !== Infinity) {
        return [words.slice(0, bestSplit).join(' '), words.slice(bestSplit).join(' ')];
      }
    }

    // Standard greedy wrap
    const wrapped: string[] = [];
    let curLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const testLine = curLine + ' ' + words[i];
      if (ctx.measureText(testLine).width <= maxW) {
        curLine = testLine;
      } else {
        wrapped.push(curLine);
        curLine = words[i];
      }
    }
    if (curLine) wrapped.push(curLine);
    const cleanLines = wrapped.filter(l => l.trim() !== ':' && l.trim() !== '-' && l.trim() !== '|');
    return cleanLines.length > 0 ? cleanLines : wrapped;
  };

  // Determine optimal font size (between height * 0.088 down to height * 0.058)
  let targetFontSize = Math.round(height * 0.088);
  let finalLines: string[] = [];

  for (let testSize = targetFontSize; testSize >= Math.round(height * 0.056); testSize -= 2) {
    ctx.font = `700 ${testSize}px 'Montserrat', sans-serif`;
    const candidateLines: string[] = [];

    if (chapterPart && topicPart) {
      const headerText = `${chapterPart}${lecPart}`.trim();
      const headerLines = wrapTextToBalancedLines(headerText, testSize, maxCyanWidth);
      const topicLines = wrapTextToBalancedLines(topicPart, testSize, maxCyanWidth);
      candidateLines.push(...headerLines, ...topicLines);
    } else if (chapterPart) {
      const fullHeader = `${chapterPart}${lecPart}`.trim();
      const headerLines = wrapTextToBalancedLines(fullHeader, testSize, maxCyanWidth);
      candidateLines.push(...headerLines);
    } else if (topicPart) {
      const topicLines = wrapTextToBalancedLines(topicPart, testSize, maxCyanWidth);
      candidateLines.push(...topicLines);
    }

    const testLineHeight = testSize * 1.20;
    const totalH = candidateLines.length * testLineHeight;

    if (totalH <= cyanAvailableH || testSize <= Math.round(height * 0.058)) {
      targetFontSize = testSize;
      finalLines = candidateLines;
      break;
    }
  }

  // Draw lines vertically centered in the cyan region
  if (finalLines.length === 0 && (chapterPart || topicPart)) {
    finalLines = [chapterPart || topicPart];
  }

  // If no text, keep cyan area COMPLETELY BLANK as user requested
  if (finalLines.length > 0) {
    const lineHeight = targetFontSize * 1.22;
    const totalBlockH = (finalLines.length - 1) * lineHeight;
    const cyanCenterY = cyanTopY + (cyanAvailableH / 2);
    let startY = cyanCenterY - (totalBlockH / 2);

    ctx.font = `700 ${targetFontSize}px 'Montserrat', sans-serif`;
    finalLines.forEach((line) => {
      ctx.fillText(line, cyanCenterX, startY);
      startY += lineHeight;
    });
  }

  ctx.restore();

  // 4. Batch Code in Lower White Pill Card (e.g. "SIP S41-AJ31MA 2026")
  ctx.save();
  const pillX = width * 0.019;
  const pillY = height * 0.585;
  const pillW = width * 0.59;
  const pillH = height * 0.165;

  const batchCodeText = (data.batchName || 'SIP S41-AJ31MA 2026').toUpperCase();
  
  let batchFontSize = Math.round(pillH * 0.50);
  ctx.font = `800 ${batchFontSize}px 'Montserrat', 'Outfit', sans-serif`;
  let measuredBatchW = ctx.measureText(batchCodeText).width;

  while (measuredBatchW > pillW - (width * 0.06) && batchFontSize > 16) {
    batchFontSize -= 2;
    ctx.font = `800 ${batchFontSize}px 'Montserrat', 'Outfit', sans-serif`;
    measuredBatchW = ctx.measureText(batchCodeText).width;
  }

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(batchCodeText, pillX + width * 0.032, pillY + pillH / 2);
  ctx.restore();

  // 5. Subject Banner & Icon Below White Pill Card (e.g. Set-Square for Maths, No icon for SST & English)
  ctx.save();
  const subjectY = height * 0.825;
  const subjectX = width * 0.035;
  const iconSize = height * 0.098;

  const hasIcon = data.subject !== 'SST' && data.subject !== 'English';

  if (hasIcon) {
    drawSubjectIcon(ctx, data.subject, subjectX, subjectY, iconSize);
  }

  // Subject Text in Clean Bold Italic with standard weight
  const subjectFontSize = Math.round(height * 0.088);
  ctx.font = `italic 700 ${subjectFontSize}px 'Montserrat', sans-serif`;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const textStartX = hasIcon ? subjectX + iconSize + width * 0.022 : subjectX;
  ctx.fillText(
    data.subject.toUpperCase(), 
    textStartX, 
    subjectY + iconSize / 2
  );

  ctx.restore();
}

async function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: ThumbnailData,
  scale: number
) {
  // If custom background uploaded
  if (data.customBgImage) {
    try {
      const bgImg = await loadImage(data.customBgImage);
      ctx.drawImage(bgImg, 0, 0, width, height);
      // Add subtle dark overlay for text readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, width, height);
      return;
    } catch {
      // fallback to procedural
    }
  }

  // Procedural templates
  const { templateStyle, themeColor, secondaryColor, bgColor } = data;

  switch (templateStyle) {
    case 'comic_action': {
      // Comic Sunburst Background
      ctx.fillStyle = '#ffb703';
      ctx.fillRect(0, 0, width, height);

      // Sunburst rays
      const centerX = width * 0.75;
      const centerY = height * 0.5;
      const rays = 24;
      ctx.fillStyle = '#fb8500';
      for (let i = 0; i < rays; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        const angle1 = (i * 2 * Math.PI) / rays;
        const angle2 = ((i + 0.5) * 2 * Math.PI) / rays;
        ctx.arc(centerX, centerY, width * 1.5, angle1, angle2);
        ctx.closePath();
        ctx.fill();
      }

      // Halftone dot overlay / dark vignette
      const comicGrad = ctx.createRadialGradient(width / 2, height / 2, 200 * scale, width / 2, height / 2, width);
      comicGrad.addColorStop(0, 'rgba(0,0,0,0)');
      comicGrad.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = comicGrad;
      ctx.fillRect(0, 0, width, height);
      break;
    }

    case 'fiery_oneshot': {
      const fireGrad = ctx.createRadialGradient(width * 0.25, height * 0.5, 50 * scale, width * 0.5, height * 0.5, width);
      fireGrad.addColorStop(0, '#ea580c');
      fireGrad.addColorStop(0.4, '#991b1b');
      fireGrad.addColorStop(0.8, '#450a0a');
      fireGrad.addColorStop(1, '#0f0505');
      ctx.fillStyle = fireGrad;
      ctx.fillRect(0, 0, width, height);

      // Diagonal hazard speed stripes
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 40 * scale;
      for (let x = -width; x < width * 2; x += 120 * scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + height, height);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case 'cyber_neon': {
      const cyberGrad = ctx.createLinearGradient(0, 0, width, height);
      cyberGrad.addColorStop(0, '#030712');
      cyberGrad.addColorStop(0.5, '#0b0f19');
      cyberGrad.addColorStop(1, '#020617');
      ctx.fillStyle = cyberGrad;
      ctx.fillRect(0, 0, width, height);

      // Perspective Grid Lines
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.lineWidth = 1.5 * scale;
      for (let x = 0; x < width; x += 80 * scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 80 * scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case 'royal_emerald': {
      const emGrad = ctx.createLinearGradient(0, 0, width, height);
      emGrad.addColorStop(0, '#022c22');
      emGrad.addColorStop(0.6, '#064e3b');
      emGrad.addColorStop(1, '#021811');
      ctx.fillStyle = emGrad;
      ctx.fillRect(0, 0, width, height);
      break;
    }

    case 'deep_violet': {
      const vioGrad = ctx.createRadialGradient(width * 0.3, height * 0.4, 50, width * 0.5, height * 0.5, width);
      vioGrad.addColorStop(0, '#4c1d95');
      vioGrad.addColorStop(0.5, '#1e1b4b');
      vioGrad.addColorStop(1, '#090514');
      ctx.fillStyle = vioGrad;
      ctx.fillRect(0, 0, width, height);
      break;
    }

    case 'split_contrast': {
      // Left side colored card, right side dark
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Left panel with angle
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width * 0.62, 0);
      ctx.lineTo(width * 0.54, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Border glow separator
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.moveTo(width * 0.62, 0);
      ctx.lineTo(width * 0.54, height);
      ctx.stroke();
      break;
    }

    case 'board_topper': {
      const boardGrad = ctx.createLinearGradient(0, 0, width, height);
      boardGrad.addColorStop(0, '#082f49');
      boardGrad.addColorStop(0.5, '#0f172a');
      boardGrad.addColorStop(1, '#020617');
      ctx.fillStyle = boardGrad;
      ctx.fillRect(0, 0, width, height);
      break;
    }

    case 'pw_dark_gold':
    default: {
      // Signature PW Dark High-Contrast Gradient
      const baseGrad = ctx.createRadialGradient(
        width * 0.3, height * 0.5, 100 * scale,
        width * 0.5, height * 0.5, width * 0.8
      );
      baseGrad.addColorStop(0, '#1e1b4b');
      baseGrad.addColorStop(0.4, '#0f172a');
      baseGrad.addColorStop(1, '#050811');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle tech hexagon/grid texture
      ctx.save();
      ctx.globalAlpha = 0.04;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1 * scale;
      const step = 60 * scale;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
  }
}

function drawBackgroundLightingAndDecor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: ThumbnailData,
  scale: number
) {
  const { themeColor, secondaryColor, templateStyle } = data;

  // 1. Large Ambient Backlight behind Teacher (right side)
  const glowX = data.teacherPosition === 'right' ? width * 0.78 : width * 0.22;
  const glowY = height * 0.52;
  const glowRad = 480 * scale;

  const auraGrad = ctx.createRadialGradient(glowX, glowY, 40 * scale, glowX, glowY, glowRad);
  auraGrad.addColorStop(0, themeColor + '66'); // 40% opacity
  auraGrad.addColorStop(0.5, secondaryColor + '26'); // 15% opacity
  auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = auraGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Corner Vignette / Cinematic lighting
  const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // 3. Glowing Top Accent Bar
  const topGrad = ctx.createLinearGradient(0, 0, width, 0);
  topGrad.addColorStop(0, themeColor);
  topGrad.addColorStop(0.5, secondaryColor);
  topGrad.addColorStop(1, themeColor);
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, 8 * scale);
}

async function drawTeacher(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: ThumbnailData,
  teacherImageUrl: string,
  scale: number
) {
  if (!teacherImageUrl) return;

  try {
    const img = await loadImage(teacherImageUrl);
    if (!img) return;

    const isRight = data.teacherPosition === 'right';
    const bounds = getNonTransparentBounds(img);
    const { sX, sY, sW, sH } = bounds;
    const aspect = (sW && sH) ? (sW / sH) : 0.75;

    let drawH = height * 0.92 * data.teacherScale;
    let drawW = drawH * aspect;

    const maxSlotW = width * 0.42 * data.teacherScale;
    if (drawW > maxSlotW) {
      drawW = maxSlotW;
      drawH = drawW / aspect;
    }

    const slotCenterX = isRight ? width * 0.78 : width * 0.22;
    const targetX = slotCenterX - drawW / 2 + data.teacherOffsetX * scale;
    const targetY = height - drawH + data.teacherOffsetY * scale;

    ctx.save();

    // Teacher glow rim effect
    if (data.teacherGlowBlur > 0) {
      ctx.save();
      ctx.shadowColor = data.teacherGlowColor || data.themeColor;
      ctx.shadowBlur = data.teacherGlowBlur * scale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw shadow silhouette
      if (data.teacherFlip) {
        ctx.translate(targetX + drawW, targetY);
        ctx.scale(-1, 1);
        ctx.drawImage(img, sX, sY, sW, sH, 0, 0, drawW, drawH);
      } else {
        ctx.drawImage(img, sX, sY, sW, sH, targetX, targetY, drawW, drawH);
      }
      ctx.restore();
    }

    // Draw main teacher image
    if (data.teacherFlip) {
      ctx.translate(targetX + drawW, targetY);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sX, sY, sW, sH, 0, 0, drawW, drawH);
    } else {
      ctx.drawImage(img, sX, sY, sW, sH, targetX, targetY, drawW, drawH);
    }

    ctx.restore();

    // Teacher Name Ribbon at bottom of cutout
    drawTeacherNameBadge(ctx, targetX, targetY, drawW, drawH, data, scale, width, height);

  } catch (err) {
    console.error('Failed to render teacher image:', err);
  }
}

function drawTeacherNameBadge(
  ctx: CanvasRenderingContext2D,
  teacherX: number,
  teacherY: number,
  teacherW: number,
  teacherH: number,
  data: ThumbnailData,
  scale: number,
  canvasW: number,
  canvasH: number
) {
  if (!data.teacherName) return;

  const isRight = data.teacherPosition === 'right';
  const badgeCenterX = isRight ? teacherX + teacherW * 0.48 : teacherX + teacherW * 0.52;
  const badgeY = canvasH - 95 * scale;

  ctx.save();
  ctx.font = `800 ${24 * scale}px Montserrat, Outfit, sans-serif`;
  const nameWidth = ctx.measureText(data.teacherName.toUpperCase()).width;
  const boxW = Math.max(nameWidth + 60 * scale, 240 * scale);
  const boxH = 58 * scale;
  const boxX = badgeCenterX - boxW / 2;

  // Background card
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = data.themeColor;
  ctx.lineWidth = 2.5 * scale;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 15 * scale;
  ctx.shadowOffsetY = 6 * scale;

  roundRect(ctx, boxX, badgeY, boxW, boxH, 12 * scale);
  ctx.fill();
  ctx.stroke();

  // Left colored indicator bar
  ctx.fillStyle = data.themeColor;
  roundRect(ctx, boxX + 4 * scale, badgeY + 4 * scale, 6 * scale, boxH - 8 * scale, 3 * scale);
  ctx.fill();

  // Text
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.teacherName.toUpperCase(), badgeCenterX + 6 * scale, badgeY + boxH * 0.38);

  // Subtitle / Title if present
  if (data.teacherTitle) {
    ctx.font = `600 ${14 * scale}px Montserrat, sans-serif`;
    ctx.fillStyle = data.themeColor;
    const cleanTitle = data.teacherTitle.length > 28 ? data.teacherTitle.substring(0, 26) + '...' : data.teacherTitle;
    ctx.fillText(cleanTitle, badgeCenterX + 6 * scale, badgeY + boxH * 0.72);
  }

  ctx.restore();
}

function drawThumbnailContent(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: ThumbnailData,
  scale: number
) {
  const isTeacherRight = data.teacherPosition === 'right';
  const leftMargin = isTeacherRight ? 70 * scale : width * 0.42;
  const contentWidth = isTeacherRight ? width * 0.56 : width * 0.52;

  let currentY = 65 * scale;

  // 1. Batch & Subject Pill Header
  currentY = drawBatchAndSubjectHeader(ctx, leftMargin, currentY, data, scale);

  // 2. Huge Lecture Badge & Number
  currentY = drawLectureBadge(ctx, leftMargin, currentY, data, scale);

  // 3. Chapter Title (Bold, Multi-line with 3D shadow/outline)
  currentY = drawChapterTitle(ctx, leftMargin, currentY, contentWidth, data, scale);

  // 4. Key Subtopics / Highlights Box
  if (data.subtopics && data.subtopics.length > 0) {
    drawSubtopicsBox(ctx, leftMargin, currentY, contentWidth, data, scale);
  }
}

function drawBatchAndSubjectHeader(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  data: ThumbnailData,
  scale: number
): number {
  ctx.save();

  // Batch Name Badge
  const batchText = (data.batchName || 'LAKSHYA JEE 2026').toUpperCase();
  ctx.font = `900 ${22 * scale}px Montserrat, Outfit, sans-serif`;
  const batchW = ctx.measureText(batchText).width + 36 * scale;
  const badgeH = 46 * scale;

  // Batch Badge gradient
  const batchGrad = ctx.createLinearGradient(x, y, x + batchW, y);
  batchGrad.addColorStop(0, data.themeColor);
  batchGrad.addColorStop(1, data.secondaryColor || data.themeColor);
  
  ctx.fillStyle = batchGrad;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10 * scale;
  ctx.shadowOffsetY = 4 * scale;
  roundRect(ctx, x, y, batchW, badgeH, 8 * scale);
  ctx.fill();

  // Batch Text
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(batchText, x + 18 * scale, y + badgeH / 2);

  // Subject Tag Pill next to Batch
  if (data.subject) {
    const subjX = x + batchW + 14 * scale;
    const subjText = data.subject.toUpperCase();
    ctx.font = `800 ${18 * scale}px Montserrat, Outfit, sans-serif`;
    const subjW = ctx.measureText(subjText).width + 30 * scale;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5 * scale;
    roundRect(ctx, subjX, y, subjW, badgeH, 8 * scale);
    ctx.fill();
    ctx.stroke();

    // Subject Dot
    ctx.fillStyle = data.themeColor;
    ctx.beginPath();
    ctx.arc(subjX + 16 * scale, y + badgeH / 2, 5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Subject text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(subjText, subjX + 28 * scale, y + badgeH / 2);
  }

  ctx.restore();
  return y + badgeH + 28 * scale;
}

function drawLectureBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  data: ThumbnailData,
  scale: number
): number {
  const lecNo = data.lectureNo || '01';
  const label = data.lectureLabel || (lecNo.toLowerCase().includes('shot') ? 'SPECIAL' : 'LECTURE');

  ctx.save();

  // Distinctive high-impact Lecture Box
  const isOneShot = lecNo.toLowerCase().includes('shot') || lecNo.toLowerCase().includes('marathon');
  
  if (isOneShot) {
    // Huge ONE-SHOT Stamp
    const stampText = '⚡ 1-SHOT REVISION';
    ctx.font = `900 ${36 * scale}px 'Bebas Neue', Montserrat, sans-serif`;
    const stampW = ctx.measureText(stampText).width + 48 * scale;
    const stampH = 64 * scale;

    const fireGrad = ctx.createLinearGradient(x, y, x + stampW, y + stampH);
    fireGrad.addColorStop(0, '#ef4444');
    fireGrad.addColorStop(0.5, '#f59e0b');
    fireGrad.addColorStop(1, '#ef4444');

    ctx.fillStyle = fireGrad;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 24 * scale;
    roundRect(ctx, x, y, stampW, stampH, 12 * scale);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stampText, x + stampW / 2, y + stampH / 2);

    ctx.restore();
    return y + stampH + 26 * scale;
  }

  // Standard Lecture Box: Label on Top, Giant Number on Bottom (or pill layout)
  const fullText = `${label} ${lecNo}`.toUpperCase();
  ctx.font = `900 ${38 * scale}px 'Bebas Neue', Montserrat, sans-serif`;
  const fullW = ctx.measureText(fullText).width + 44 * scale;
  const fullH = 62 * scale;

  // Glowing 3D card background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.strokeStyle = data.themeColor;
  ctx.lineWidth = 3 * scale;
  ctx.shadowColor = data.themeColor;
  ctx.shadowBlur = 20 * scale;

  roundRect(ctx, x, y, fullW, fullH, 12 * scale);
  ctx.fill();
  ctx.stroke();

  // Text with subtle gradient
  ctx.shadowBlur = 0;
  ctx.fillStyle = data.themeColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Draw lightning icon / dot
  ctx.fillText(`⚡ ${label} `, x + 16 * scale, y + fullH / 2);
  const prefixW = ctx.measureText(`⚡ ${label} `).width;

  ctx.fillStyle = '#ffffff';
  ctx.fillText(lecNo, x + 16 * scale + prefixW, y + fullH / 2);

  ctx.restore();
  return y + fullH + 26 * scale;
}

function drawChapterTitle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxWidth: number,
  data: ThumbnailData,
  scale: number
): number {
  const title = (data.chapterTitle || 'CHAPTER TITLE').toUpperCase();
  const fontFamily = data.fontFamily || 'Montserrat';

  ctx.save();

  // Dynamic Font Size depending on title length
  let fontSize = 72 * scale;
  if (title.length > 35) fontSize = 52 * scale;
  else if (title.length > 20) fontSize = 62 * scale;

  ctx.font = `900 ${fontSize}px '${fontFamily}', Montserrat, sans-serif`;
  const lineHeight = fontSize * 1.08;

  // Wrap text
  const words = title.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Render each line with heavy 3D shadow and crisp stroke
  let lineY = y + fontSize * 0.8;

  lines.forEach((line, index) => {
    // 1. Heavy Black 3D Extruded Shadow (for maximum YouTube legibility)
    ctx.fillStyle = '#000000';
    for (let offset = 8 * scale; offset >= 2 * scale; offset -= 2 * scale) {
      ctx.fillText(line, x + offset, lineY + offset);
    }

    // 2. Thick Outer Stroke
    ctx.strokeStyle = '#050811';
    ctx.lineWidth = 10 * scale;
    ctx.lineJoin = 'round';
    ctx.strokeText(line, x, lineY);

    // 3. Highlight Colors (Alternating white and yellow/accent gradient)
    if (index === 0 && lines.length > 1) {
      ctx.fillStyle = '#ffffff';
    } else {
      // Accent gradient for punchy finish
      const textGrad = ctx.createLinearGradient(x, lineY - fontSize, x + maxWidth * 0.8, lineY);
      textGrad.addColorStop(0, '#ffffff');
      textGrad.addColorStop(0.5, data.themeColor);
      textGrad.addColorStop(1, '#ffffff');
      ctx.fillStyle = textGrad;
    }

    ctx.fillText(line, x, lineY);
    lineY += lineHeight;
  });

  ctx.restore();
  return lineY + 16 * scale;
}

function drawSubtopicsBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxWidth: number,
  data: ThumbnailData,
  scale: number
) {
  const topics = data.subtopics.slice(0, 3);
  if (topics.length === 0) return;

  ctx.save();

  const itemHeight = 44 * scale;
  const boxHeight = topics.length * itemHeight + 20 * scale;
  const boxWidth = Math.min(maxWidth, 820 * scale);

  // Frosted Card
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5 * scale;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 12 * scale;

  roundRect(ctx, x, y, boxWidth, boxHeight, 14 * scale);
  ctx.fill();
  ctx.stroke();

  // Left Accent strip
  ctx.fillStyle = data.themeColor;
  roundRect(ctx, x, y, 6 * scale, boxHeight, 3 * scale);
  ctx.fill();

  // Render Subtopics with icons
  topics.forEach((topic, idx) => {
    const itemY = y + 18 * scale + idx * itemHeight + itemHeight * 0.35;

    // Bullet Icon (Checkmark / Arrow)
    ctx.fillStyle = data.themeColor;
    ctx.font = `900 ${20 * scale}px Montserrat, sans-serif`;
    ctx.fillText('▶', x + 24 * scale, itemY);

    // Topic text
    ctx.fillStyle = '#f1f5f9';
    ctx.font = `700 ${20 * scale}px Montserrat, Outfit, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const maxTextW = boxWidth - 70 * scale;
    let cleanTopic = topic.trim();
    if (ctx.measureText(cleanTopic).width > maxTextW) {
      while (ctx.measureText(cleanTopic + '...').width > maxTextW && cleanTopic.length > 5) {
        cleanTopic = cleanTopic.slice(0, -1);
      }
      cleanTopic += '...';
    }

    ctx.fillText(cleanTopic, x + 50 * scale, itemY);
  });

  ctx.restore();
}

function drawBadgesAndStickers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: ThumbnailData,
  scale: number
) {
  // 1. Custom Top Right / Left Badge (e.g. LIVE, 100% MARKS)
  const sticker = data.extraSticker || (data.badgeText ? data.badgeText : 'LIVE');
  if (!sticker || sticker === 'NONE') return;

  ctx.save();

  // Place sticker in top right or top middle
  const badgeX = width - 260 * scale;
  const badgeY = 40 * scale;
  const badgeW = 210 * scale;
  const badgeH = 54 * scale;

  // Glowing Pill
  ctx.shadowColor = sticker === 'LIVE' ? '#ef4444' : '#f59e0b';
  ctx.shadowBlur = 20 * scale;

  ctx.fillStyle = sticker === 'LIVE' ? '#dc2626' : '#d97706';
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 27 * scale);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * scale;
  ctx.stroke();

  // Text
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${22 * scale}px Montserrat, Outfit, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const label = sticker === 'LIVE' ? '🔴 LIVE NOW' : `⭐ ${sticker}`;
  ctx.fillText(label, badgeX + badgeW / 2, badgeY + badgeH / 2);

  ctx.restore();
}

function drawSafeZoneGuide(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number
) {
  ctx.save();

  // YouTube timestamp overlay simulated in bottom right
  const pillW = 160 * scale;
  const pillH = 55 * scale;
  const pillX = width - pillW - 24 * scale;
  const pillY = height - pillH - 24 * scale;

  // Red border warning zone
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
  ctx.lineWidth = 3 * scale;
  ctx.setLineDash([8 * scale, 6 * scale]);
  ctx.strokeRect(pillX - 10 * scale, pillY - 10 * scale, pillW + 20 * scale, pillH + 20 * scale);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
  ctx.setLineDash([]);
  roundRect(ctx, pillX, pillY, pillW, pillH, 8 * scale);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${22 * scale}px Montserrat, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('1:24:15', pillX + pillW / 2, pillY + pillH / 2);

  // Label
  ctx.fillStyle = '#f87171';
  ctx.font = `700 ${14 * scale}px Montserrat, sans-serif`;
  ctx.fillText('YT TIME SAFE ZONE', pillX + pillW / 2, pillY - 18 * scale);

  ctx.restore();
}

// Utility: Round rectangle path
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function downloadCanvasImage(canvas: HTMLCanvasElement, filename: string, format: 'png' | 'jpeg' = 'png') {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mimeType, 0.95);
  const link = document.createElement('a');
  link.download = filename.endsWith(`.${format}`) ? filename : `${filename}.${format}`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  try {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return false;
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
