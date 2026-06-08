/**
 * SigilForge — Visual Rendering Engine
 * Phase 2: Sigil Forging
 *
 * Implements the "Three-Layer, Six-Facet" (三层六面) canvas rendering
 * per SPEC-KIP-0.1 §3. Produces a 1024×1024 Krystal image with:
 *
 *   Layer 1 — Core (晶核):     Center 40% area — human aesthetic / sigil image
 *   Layer 2 — Band Gap (带隙): 1-2px security color halo around Core
 *   Layer 3 — 6 Facets (六晶面): Border regions with Data Filigree + text anchors
 *
 * Author: Emberois | SPEC-KIP-0.1
 */

import { type KipPayload, BAND_GAP_COLORS, QUADRANT_LOCK_COLOR } from './types';

// ─────────────────────────────────────────────
// Canvas Constants
// ─────────────────────────────────────────────

export const CANVAS_SIZE = 1024;

// Core occupies 40% of the AREA → side = sqrt(0.4) ≈ 63.25% of canvas
const CORE_RATIO = Math.sqrt(0.40);
export const CORE_SIZE = Math.floor(CANVAS_SIZE * CORE_RATIO);   // ≈ 648px
export const CORE_OFFSET = Math.floor((CANVAS_SIZE - CORE_SIZE) / 2); // ≈ 188px

const ANCHOR_SIZE = 2; // Quadrant Lock Anchor — 2×2 pixel
const BAND_GAP_WIDTH = 2; // px

// ─────────────────────────────────────────────
// Google Font (loaded once)
// ─────────────────────────────────────────────

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap';
let fontLoaded = false;

async function ensureFont(): Promise<void> {
  if (fontLoaded) return;
  if (typeof document !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    document.head.appendChild(link);
    await document.fonts.ready;
    fontLoaded = true;
  }
}

// ─────────────────────────────────────────────
// Filigree / Data Stripes renderer (Data Filigree effect)
// ─────────────────────────────────────────────

function drawDataFiligree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  anchorLabel: string,
  accentColor: string,
) {
  ctx.save();

  // Background — very dark with subtle color tint
  ctx.fillStyle = `rgba(8,8,16,0.92)`;
  ctx.fillRect(x, y, w, h);

  // Stripe lines (Data Filigree aesthetic)
  ctx.strokeStyle = `${accentColor}22`; // very faint
  ctx.lineWidth = 1;
  for (let i = 0; i < h; i += 4) {
    ctx.beginPath();
    ctx.moveTo(x, y + i);
    ctx.lineTo(x + w, y + i);
    ctx.stroke();
  }

  // Anchor label — bold, glowing
  ctx.font = 'bold 10px "Share Tech Mono", monospace';
  ctx.fillStyle = accentColor;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 6;
  ctx.fillText(anchorLabel, x + 6, y + 14);
  ctx.shadowBlur = 0;

  // Content text — wrap tightly in the facet region
  ctx.font = '8px "Share Tech Mono", monospace';
  ctx.fillStyle = `${accentColor}CC`;
  const maxWidth = w - 12;
  const lineH = 10;
  const words = text.split(' ');
  let line = '';
  let ly = y + 26;

  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x + 6, ly);
      line = word;
      ly += lineH;
      if (ly > y + h - 8) break;
    } else {
      line = test;
    }
  }
  if (line && ly <= y + h - 8) ctx.fillText(line, x + 6, ly);

  ctx.restore();
}

// ─────────────────────────────────────────────
// Quadrant Lock Anchors
// ─────────────────────────────────────────────

function drawQuadrantAnchors(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = QUADRANT_LOCK_COLOR;
  const S = CANVAS_SIZE;
  const A = ANCHOR_SIZE;
  const CO = CORE_OFFSET;
  const CS = CORE_SIZE;

  const positions = [
    // Canvas corners
    { x: 0,           y: 0 },
    { x: S - A,       y: 0 },
    { x: 0,           y: S - A },
    { x: S - A,       y: S - A },
    // Core corners (facet intersections)
    { x: CO,          y: CO },
    { x: CO + CS,     y: CO },
    { x: CO,          y: CO + CS },
    { x: CO + CS,     y: CO + CS },
  ];

  positions.forEach(p => ctx.fillRect(p.x, p.y, A, A));
}

// ─────────────────────────────────────────────
// Band Gap Halo
// ─────────────────────────────────────────────

function drawBandGap(ctx: CanvasRenderingContext2D, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = BAND_GAP_WIDTH;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.strokeRect(
    CORE_OFFSET - BAND_GAP_WIDTH / 2,
    CORE_OFFSET - BAND_GAP_WIDTH / 2,
    CORE_SIZE + BAND_GAP_WIDTH,
    CORE_SIZE + BAND_GAP_WIDTH,
  );
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─────────────────────────────────────────────
// Core (晶核) — draw sigil image or gradient
// ─────────────────────────────────────────────

async function drawCore(
  ctx: CanvasRenderingContext2D,
  sigilImage?: HTMLImageElement | null,
  accentColor?: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(CORE_OFFSET, CORE_OFFSET, CORE_SIZE, CORE_SIZE);
  ctx.clip();

  if (sigilImage) {
    // Center-crop the image into the core region
    const sr = sigilImage.naturalWidth / sigilImage.naturalHeight;
    let sw = sigilImage.naturalWidth;
    let sh = sigilImage.naturalHeight;
    let sx = 0;
    let sy = 0;

    if (sr > 1) { sw = sh; sx = (sigilImage.naturalWidth - sw) / 2; }
    else         { sh = sw; sy = (sigilImage.naturalHeight - sh) / 2; }

    ctx.drawImage(sigilImage, sx, sy, sw, sh, CORE_OFFSET, CORE_OFFSET, CORE_SIZE, CORE_SIZE);
  } else {
    // ── Default gemstone crystal ──
    // Per SPEC-KIP-0.1 §3.1: "a visually compelling gemstone"
    const accent = accentColor ?? '#0BDA51';
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    const r = CORE_SIZE / 2;
    const facets = 8; // 8-fold symmetry

    // Background: deep crystalline gradient
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0,   '#2a2a4a');
    grad.addColorStop(0.3, '#1a1a36');
    grad.addColorStop(0.6, '#0d0d1a');
    grad.addColorStop(1,   '#06060e');
    ctx.fillStyle = grad;
    ctx.fillRect(CORE_OFFSET, CORE_OFFSET, CORE_SIZE, CORE_SIZE);

    // Faceted gemstone faces (8 triangular wedges)
    for (let i = 0; i < facets; i++) {
      const angleA = (i / facets) * Math.PI * 2;
      const angleB = ((i + 0.5) / facets) * Math.PI * 2;
      const angleC = ((i + 1) / facets) * Math.PI * 2;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angleA) * r, cy + Math.sin(angleA) * r);
      ctx.lineTo(cx + Math.cos(angleB) * r * 0.95, cy + Math.sin(angleB) * r * 0.95);
      ctx.closePath();

      // Alternate lighting intensity per facet
      const brightness = 0.3 + (i % 2) * 0.25;
      ctx.fillStyle = `${accent}${Math.floor(brightness * 40).toString(16).padStart(2, '0')}`;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angleB) * r * 0.95, cy + Math.sin(angleB) * r * 0.95);
      ctx.lineTo(cx + Math.cos(angleC) * r, cy + Math.sin(angleC) * r);
      ctx.closePath();

      const brightness2 = 0.2 + ((i + 1) % 2) * 0.15;
      ctx.fillStyle = `${accent}${Math.floor(brightness2 * 30).toString(16).padStart(2, '0')}`;
      ctx.fill();
    }

    // Shimmer highlight (cross-shaped light reflection)
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI + Math.PI / 8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r * 0.7, cy + Math.sin(angle) * r * 0.7);
      ctx.stroke();
    }

    // Outer edge glow
    ctx.strokeStyle = `${accent}44`;
    ctx.lineWidth = 1;
    ctx.strokeRect(CORE_OFFSET + 1, CORE_OFFSET + 1, CORE_SIZE - 2, CORE_SIZE - 2);

    // Inner accent pulsing ring
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    ctx.strokeStyle = `${accent}22`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

// ─────────────────────────────────────────────
// Main: SigilForge
// ─────────────────────────────────────────────

export interface ForgeOptions {
  payload: KipPayload;
  sigilImageBlob?: Blob | null; // Optional user-uploaded core image
}

export class SigilForge {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = CANVAS_SIZE;
    this.canvas.height = CANVAS_SIZE;
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Render a full Krystal image based on the given payload.
   * Returns a PNG Blob of the rendered image (before chunk injection).
   */
  async forge(options: ForgeOptions): Promise<Blob> {
    await ensureFont();
    const { payload, sigilImageBlob } = options;

    const accentColor = BAND_GAP_COLORS[payload.bandGapLevel];
    const ctx = this.ctx;
    const S = CANVAS_SIZE;
    const CO = CORE_OFFSET;
    const CS = CORE_SIZE;

    // ── Background ──────────────────────────────
    ctx.fillStyle = '#080810';
    ctx.fillRect(0, 0, S, S);

    // ── Six Facets (Data Filigree borders) ──────

    // Crown Facet (top)
    drawDataFiligree(ctx, CO, 0, CS, CO, payload.facets.crown.name, '[CROWN]', accentColor);

    // Input Facet (upper-right)
    drawDataFiligree(ctx, CO + CS, 0, S - CO - CS, S / 2, payload.facets.input.format, '[INPUT]', accentColor);

    // Logic Facet (lower-right) — 40% info density
    drawDataFiligree(ctx, CO + CS, S / 2, S - CO - CS, S / 2, payload.facets.logic.systemPrompt, '[LOGIC]', accentColor);

    // Output Facet (bottom)
    drawDataFiligree(ctx, CO, CO + CS, CS, S - CO - CS, payload.facets.output.toneTemplate, '[OUTPUT]', accentColor);

    // Inclusion Facet (lower-left)
    drawDataFiligree(ctx, 0, S / 2, CO, S / 2, payload.facets.inclusion.endpoints.join(', ') || '—', '[INCLUSION]', accentColor);

    // Correction Facet (upper-left)
    drawDataFiligree(ctx, 0, 0, CO, S / 2, payload.facets.correction.fallbackPrompt, '[CORRECTION]', accentColor);

    // ── Quadrant Lock Anchors (#FF00FF 2×2px) ───
    drawQuadrantAnchors(ctx);

    // ── Core (晶核) ─────────────────────────────
    let sigilImg: HTMLImageElement | null = null;
    if (sigilImageBlob) {
      sigilImg = await this.loadImage(sigilImageBlob);
    }
    await drawCore(ctx, sigilImg, accentColor);

    // ── Band Gap halo ────────────────────────────
    drawBandGap(ctx, accentColor);

    // ── Crown text overlay ───────────────────────
    ctx.save();
    ctx.font = 'bold 12px "Share Tech Mono", monospace';
    ctx.fillStyle = accentColor;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 8;
    ctx.textAlign = 'center';
    ctx.fillText(`${payload.crystalName} v${payload.crystalVersion}`, S / 2, CO / 2 + 5);
    ctx.font = '9px "Share Tech Mono", monospace';
    ctx.fillStyle = `${accentColor}99`;
    ctx.fillText(payload.facets.crown.wakeWord, S / 2, CO / 2 + 20);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
    ctx.restore();

    return new Promise<Blob>(resolve => {
      this.canvas.toBlob(blob => resolve(blob!), 'image/png', 1.0);
    });
  }

  private loadImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
      img.src = url;
    });
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
