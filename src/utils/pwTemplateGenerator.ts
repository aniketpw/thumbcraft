import { SubjectType } from '../types/thumbnail';

// Exact PW Logo in circular badge (Matching Thumbnail.png)
export function drawPwLogo(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  // Outer circle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = radius * 0.11;
  ctx.stroke();

  // Inner thin ring
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = radius * 0.035;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.89, 0, Math.PI * 2);
  ctx.stroke();

  // PW Monogram in authentic Serif
  ctx.fillStyle = '#000000';
  ctx.font = `900 ${radius * 0.85}px 'Times New Roman', 'Georgia', serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.fillText('P', x - radius * 0.22, y - radius * 0.14);
  ctx.fillText('W', x + radius * 0.18, y + radius * 0.16);

  ctx.restore();
}

// Draw Subject Icon (Flask for Chemistry, Atom for Physics, etc.)
export function drawSubjectIcon(
  ctx: CanvasRenderingContext2D,
  subject: SubjectType,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#000000';
  ctx.lineWidth = size * 0.085;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (subject) {
    case 'Chemistry': {
      // Chemistry Conical Beaker / Erlenmeyer Flask
      const w = size;
      const h = size;
      ctx.beginPath();
      // Flask mouth / neck
      ctx.moveTo(x + w * 0.38, y);
      ctx.lineTo(x + w * 0.62, y);
      ctx.moveTo(x + w * 0.42, y);
      ctx.lineTo(x + w * 0.42, y + h * 0.28);
      // Flask cone body
      ctx.lineTo(x + w * 0.08, y + h * 0.88);
      ctx.quadraticCurveTo(x + w * 0.08, y + h, x + w * 0.22, y + h);
      ctx.lineTo(x + w * 0.78, y + h);
      ctx.quadraticCurveTo(x + w * 0.92, y + h, x + w * 0.92, y + h * 0.88);
      ctx.lineTo(x + w * 0.58, y + h * 0.28);
      ctx.lineTo(x + w * 0.58, y);
      ctx.stroke();

      // Liquid inside flask
      ctx.beginPath();
      ctx.moveTo(x + w * 0.22, y + h * 0.66);
      ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.62, x + w * 0.78, y + h * 0.66);
      ctx.lineTo(x + w * 0.86, y + h * 0.92);
      ctx.lineTo(x + w * 0.14, y + h * 0.92);
      ctx.closePath();
      ctx.fill();

      // Bubbles
      ctx.beginPath();
      ctx.arc(x + w * 0.38, y + h * 0.5, size * 0.065, 0, Math.PI * 2);
      ctx.arc(x + w * 0.62, y + h * 0.4, size * 0.05, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'Physics': {
      // Atom with orbits & nucleus
      const r = size * 0.45;
      const cx = x + size / 2;
      const cy = y + size / 2;

      // Nucleus
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.13, 0, Math.PI * 2);
      ctx.fill();

      // Ellipse Orbit 1
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.38, Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();

      // Ellipse Orbit 2
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.38, -Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'Mathematics': {
      // Exact PW Triangle Set-Square Ruler + Diagonal Pencil Icon (media_1788266754241.png)
      const cx = x + size * 0.50;
      const cy = y + size * 0.50;

      ctx.save();
      ctx.lineWidth = Math.max(2, size * 0.08);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Triangle Set-Square Ruler in the background
      const tX = x + size * 0.30;
      const tY = y + size * 0.12;
      const tW = size * 0.58;
      const tH = size * 0.74;

      // Outer Right-Angle Triangle
      ctx.beginPath();
      ctx.moveTo(tX, tY);
      ctx.lineTo(tX, tY + tH);
      ctx.lineTo(tX + tW, tY + tH);
      ctx.closePath();
      ctx.stroke();

      // Inner Cutout Triangle
      const inOffX = size * 0.13;
      const inOffY = size * 0.16;
      ctx.beginPath();
      ctx.moveTo(tX + inOffX, tY + inOffY * 1.7);
      ctx.lineTo(tX + inOffX, tY + tH - inOffY * 0.8);
      ctx.lineTo(tX + tW - inOffX * 1.8, tY + tH - inOffY * 0.8);
      ctx.closePath();
      ctx.stroke();

      // Ruler measurement tick marks on hypotenuse
      ctx.beginPath();
      ctx.moveTo(tX + tW * 0.35, tY + tH * 0.45);
      ctx.lineTo(tX + tW * 0.41, tY + tH * 0.40);
      ctx.moveTo(tX + tW * 0.55, tY + tH * 0.65);
      ctx.lineTo(tX + tW * 0.61, tY + tH * 0.60);
      ctx.stroke();

      // 2. Diagonal Pencil in foreground (tilted ~40 deg)
      ctx.translate(cx - size * 0.05, cy + size * 0.04);
      ctx.rotate(-Math.PI / 4.4); // ~40 degrees

      const pLen = size * 0.88;
      const pW = size * 0.22;

      // Pencil Body
      ctx.strokeRect(-pLen * 0.42, -pW / 2, pLen * 0.58, pW);

      // Pencil Inner Spine Line
      ctx.beginPath();
      ctx.moveTo(-pLen * 0.42, 0);
      ctx.lineTo(pLen * 0.16, 0);
      ctx.stroke();

      // Pencil Sharpened Tip (Triangle)
      ctx.beginPath();
      ctx.moveTo(pLen * 0.16, -pW / 2);
      ctx.lineTo(pLen * 0.44, 0);
      ctx.lineTo(pLen * 0.16, pW / 2);
      ctx.closePath();
      ctx.stroke();

      // Pencil Lead Point (Solid Filled)
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(pLen * 0.32, -pW * 0.22);
      ctx.lineTo(pLen * 0.44, 0);
      ctx.lineTo(pLen * 0.32, pW * 0.22);
      ctx.closePath();
      ctx.fill();

      // Back Eraser rounded cap
      ctx.beginPath();
      ctx.arc(-pLen * 0.42, 0, pW / 2, Math.PI / 2, Math.PI * 1.5);
      ctx.stroke();

      ctx.restore();
      break;
    }

    case 'Botany': {
      // Exact PW 3-Leaf Sprout with Roots Icon for BOTANY (media_1788267354396.png)
      const cx = x + size * 0.48;
      const cy = y + size * 0.46;

      ctx.save();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Soil Mound & Roots at base
      const soilY = y + size * 0.86;
      const soilW = size * 0.56;
      const soilX = cx - soilW / 2;

      ctx.lineWidth = Math.max(1.5, size * 0.05);
      ctx.beginPath();
      ctx.moveTo(soilX, soilY);
      ctx.quadraticCurveTo(cx, soilY - size * 0.035, soilX + soilW, soilY);
      ctx.quadraticCurveTo(cx, soilY + size * 0.035, soilX, soilY);
      ctx.fill();

      // Root filaments below soil
      ctx.beginPath();
      ctx.moveTo(cx, soilY);
      ctx.lineTo(cx, soilY + size * 0.08);
      ctx.moveTo(cx - size * 0.10, soilY);
      ctx.lineTo(cx - size * 0.15, soilY + size * 0.06);
      ctx.moveTo(cx + size * 0.10, soilY);
      ctx.lineTo(cx + size * 0.15, soilY + size * 0.06);
      ctx.stroke();

      // 2. Main Vertical Stem (Trunk)
      const stemTopY = cy - size * 0.02;
      ctx.lineWidth = Math.max(2, size * 0.08);
      ctx.beginPath();
      ctx.moveTo(cx, soilY);
      ctx.lineTo(cx, stemTopY);
      ctx.stroke();

      // Left & Right branch stems
      ctx.lineWidth = Math.max(1.5, size * 0.055);
      ctx.beginPath();
      ctx.moveTo(cx, stemTopY + size * 0.06);
      ctx.quadraticCurveTo(cx - size * 0.08, stemTopY - size * 0.02, cx - size * 0.14, stemTopY - size * 0.08);
      ctx.moveTo(cx, stemTopY + size * 0.06);
      ctx.quadraticCurveTo(cx + size * 0.08, stemTopY - size * 0.02, cx + size * 0.14, stemTopY - size * 0.08);
      ctx.stroke();

      // Helper function to draw a solid filled leaf with inner vein line
      const drawLeaf = (leafBaseX: number, leafBaseY: number, angleRad: number, leafLen: number, leafWidth: number) => {
        ctx.save();
        ctx.translate(leafBaseX, leafBaseY);
        ctx.rotate(angleRad);

        // Solid filled leaf shape
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-leafWidth, -leafLen * 0.5, 0, -leafLen);
        ctx.quadraticCurveTo(leafWidth, -leafLen * 0.5, 0, 0);
        ctx.closePath();
        ctx.fill();

        // Inner subtle vein line
        ctx.strokeStyle = '#26cbe4';
        ctx.lineWidth = Math.max(1.2, size * 0.035);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(0, -leafLen * 0.5, 0, -leafLen * 0.85);
        ctx.stroke();

        ctx.restore();
      };

      // 3. Three Leaves:
      // Center Leaf (Vertical)
      drawLeaf(cx, stemTopY, 0, size * 0.42, size * 0.14);

      // Left Leaf (~ -42 deg)
      drawLeaf(cx - size * 0.14, stemTopY - size * 0.08, -Math.PI / 4, size * 0.36, size * 0.13);

      // Right Leaf (~ +42 deg)
      drawLeaf(cx + size * 0.14, stemTopY - size * 0.08, Math.PI / 4, size * 0.36, size * 0.13);

      ctx.restore();
      break;
    }

    case 'Zoology': {
      // Exact Microscope Icon for ZOOLOGY (media_1788267264024.png)
      ctx.save();
      ctx.lineWidth = Math.max(2, size * 0.085);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Base Stand (Flat horizontal bar at bottom)
      const baseY = y + size * 0.88;
      const baseW = size * 0.68;
      const baseX = x + size * 0.08;

      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(baseX + baseW, baseY);
      ctx.stroke();

      // Short vertical pillar from base
      const postX = baseX + baseW * 0.38;
      ctx.beginPath();
      ctx.moveTo(postX, baseY);
      ctx.lineTo(postX, baseY - size * 0.16);
      ctx.stroke();

      // 2. Specimen Stage (Horizontal Platform)
      const stageY = baseY - size * 0.16;
      ctx.beginPath();
      ctx.moveTo(postX - size * 0.18, stageY);
      ctx.lineTo(postX + size * 0.40, stageY);
      ctx.stroke();

      // 3. Curved C-Arm on the left
      const armR = size * 0.28;
      const armCX = postX - size * 0.06;
      const armCY = stageY - armR * 0.62;

      ctx.beginPath();
      ctx.arc(armCX, armCY, armR, Math.PI * 0.35, Math.PI * 1.55, false);
      ctx.stroke();

      // 4. Angled Microscope Body Tube (Tilted ~35 deg towards right-down)
      const tubeCX = postX + size * 0.14;
      const tubeCY = y + size * 0.32;

      ctx.save();
      ctx.translate(tubeCX, tubeCY);
      ctx.rotate(Math.PI / 5.2); // ~35 deg tilt

      const tW = size * 0.18;
      const tH = size * 0.46;

      // Eyepiece Body
      ctx.strokeRect(-tW / 2, -tH / 2, tW, tH);

      // Top Eyepiece Rim
      ctx.beginPath();
      ctx.moveTo(-tW * 0.75, -tH / 2);
      ctx.lineTo(tW * 0.75, -tH / 2);
      ctx.stroke();

      // Objective Nosepiece at bottom
      ctx.beginPath();
      ctx.moveTo(-tW * 0.4, tH / 2);
      ctx.lineTo(-tW * 0.2, tH / 2 + size * 0.12);
      ctx.lineTo(tW * 0.2, tH / 2 + size * 0.12);
      ctx.lineTo(tW * 0.4, tH / 2);
      ctx.closePath();
      ctx.stroke();

      // Coarse Adjustment Knob on the side
      ctx.beginPath();
      ctx.arc(-tW / 2 - size * 0.08, 0, size * 0.075, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      ctx.restore();
      break;
    }

    case 'SST':
    case 'English': {
      // Simple text only (No icon requested by user)
      break;
    }

    default: {
      ctx.strokeRect(x + size * 0.1, y + size * 0.2, size * 0.8, size * 0.65);
      ctx.beginPath();
      ctx.moveTo(x + size * 0.5, y + size * 0.2);
      ctx.lineTo(x + size * 0.5, y + size * 0.85);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

// Generate the Exact Torn Paper Cyan PW Blank Template (Thumbnail.png) on Canvas
export function renderExactPwTornTemplate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number
) {
  // 1. Right side pure white base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 2. Left side Cyan Gradient (Exact matching the Thumbnail.png colors)
  const cyanGrad = ctx.createLinearGradient(0, 0, width * 0.62, height);
  cyanGrad.addColorStop(0, '#26cbe4');
  cyanGrad.addColorStop(0.45, '#1ebcd0');
  cyanGrad.addColorStop(1, '#13a6bc');

  ctx.save();

  // Create Exact Torn Paper Edge Path matching user template:
  // Starts around x = 0.68 at top, gently wobbles down to x = 0.51 at bottom
  const ripPoints: Array<[number, number]> = [
    [0.682, 0.00],
    [0.679, 0.03],
    [0.668, 0.06],
    [0.678, 0.10],
    [0.662, 0.14],
    [0.672, 0.19],
    [0.648, 0.24],
    [0.655, 0.29],
    [0.638, 0.35],
    [0.646, 0.41],
    [0.625, 0.47],
    [0.632, 0.53],
    [0.608, 0.60],
    [0.618, 0.66],
    [0.588, 0.73],
    [0.596, 0.79],
    [0.565, 0.86],
    [0.574, 0.92],
    [0.548, 0.97],
    [0.542, 1.00]
  ];

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(ripPoints[0][0] * width, ripPoints[0][1] * height);

  for (let i = 1; i < ripPoints.length; i++) {
    const prev = ripPoints[i - 1];
    const curr = ripPoints[i];
    const midX = ((prev[0] + curr[0]) / 2) * width;
    const midY = ((prev[1] + curr[1]) / 2) * height;
    ctx.quadraticCurveTo(
      midX + (Math.sin(i * 2.2) * 5 * scale),
      midY,
      curr[0] * width,
      curr[1] * height
    );
  }

  ctx.lineTo(0, height);
  ctx.closePath();

  // Fill Cyan base
  ctx.fillStyle = cyanGrad;
  ctx.fill();

  // 3. Diamond Argyle Pattern inside Cyan Area
  ctx.clip();

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.085)';
  const diamondSize = 104 * scale;

  for (let x = -diamondSize * 1.5; x < width * 0.75; x += diamondSize) {
    for (let y = -diamondSize * 1.5; y < height + diamondSize * 1.5; y += diamondSize) {
      const offsetX = (Math.floor(y / diamondSize) % 2 === 0) ? 0 : diamondSize / 2;
      ctx.beginPath();
      ctx.moveTo(x + offsetX + diamondSize / 2, y);
      ctx.lineTo(x + offsetX + diamondSize, y + diamondSize / 2);
      ctx.lineTo(x + offsetX + diamondSize / 2, y + diamondSize);
      ctx.lineTo(x + offsetX, y + diamondSize / 2);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.restore();

  // 4. White Torn Paper Edge with Realistic layered Drop Shadow
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 14 * scale;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
  ctx.shadowBlur = 18 * scale;
  ctx.shadowOffsetX = 8 * scale;
  ctx.shadowOffsetY = 3 * scale;

  ctx.beginPath();
  ctx.moveTo(ripPoints[0][0] * width, ripPoints[0][1] * height);
  for (let i = 1; i < ripPoints.length; i++) {
    const prev = ripPoints[i - 1];
    const curr = ripPoints[i];
    const midX = ((prev[0] + curr[0]) / 2) * width;
    const midY = ((prev[1] + curr[1]) / 2) * height;
    ctx.quadraticCurveTo(
      midX + (Math.sin(i * 2.2) * 5 * scale),
      midY,
      curr[0] * width,
      curr[1] * height
    );
  }
  ctx.stroke();

  // Inner subtle paper fiber edge
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.98)';
  ctx.lineWidth = 6 * scale;
  ctx.stroke();
  ctx.restore();

  // 5. PW Logo in Top Right (Exact 1:1 match with original emblem)
  const logoRadius = Math.round(height * 0.115);
  const logoX = width - (width * 0.045);
  const logoY = height * 0.145;
  drawPwLogo(ctx, logoX, logoY, logoRadius);

  // 6. Draw White Pill Card in Lower Left for Batch Code
  drawLowerWhitePill(ctx, width, height, scale);
}

function drawLowerWhitePill(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number
) {
  ctx.save();
  const pillX = width * 0.018;
  const pillY = height * 0.575;
  const pillW = width * 0.58;
  const pillH = height * 0.185;
  const pillRadius = pillH * 0.35;

  // White Card Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 14 * scale;
  ctx.shadowOffsetY = 5 * scale;

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, pillX, pillY, pillW, pillH, pillRadius);
  ctx.fill();

  ctx.restore();
}

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

