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
 * The output image is designed to be:
 *   1. Visually beautiful — vibrant gemstone aesthetic
 *   2. Human-readable — clearly shows crystal name, band gap, purpose
 *   3. AI-readable — large enough text for multimodal vision models to OCR
 *   4. Machine-decodable — payload embedded as PNG tEXt/kiPl chunks
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

const ANCHOR_SIZE = 2;
const BAND_GAP_WIDTH = 3; // bumped from 2px for visibility

// Padding within facet regions
const SIDE_H = CORE_SIZE / 2;           // 324px — half the core height
const TOP_H = CORE_OFFSET;              // ≈ 188px — top panel height
const BOT_H = CORE_OFFSET;              // ≈ 188px — bottom panel height

// Font sizes (readable by AI vision models on 1024px canvas)
const FONT_LABEL    = 'bold 13px "Share Tech Mono", monospace';
const FONT_TITLE    = 'bold 16px "Share Tech Mono", monospace';
const FONT_CONTENT  = '11px "Share Tech Mono", monospace';
const FONT_SMALL    =  '9px "Share Tech Mono", monospace';

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
// Helper: draw wrapped text with clipping
// ─────────────────────────────────────────────

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
  font: string,
  color: string,
  lineH: number,
  truncate?: string,
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.rect(x, y - lineH, maxW, maxH + 4);
  ctx.clip();

  const words = text.split(' ');
  let line = '';
  let ly = y;

  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxW && line) {
      if (ly + lineH > y + maxH) {
        if (truncate) {
          // Show truncation marker
          ctx.fillText((line.slice(0, -1) + '…') || '…', x, ly);
        }
        break;
      }
      ctx.fillText(line, x, ly);
      line = word;
      ly += lineH;
    } else {
      line = test;
    }
  }
  if (line && ly <= y + maxH) ctx.fillText(line, x, ly);

  ctx.restore();
}

// ─────────────────────────────────────────────
// Draw a facet panel with label, content, and filigree
// ─────────────────────────────────────────────

function drawFacetPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  content: string,
  accentColor: string,
) {
  ctx.save();

  // Panel background — dark but with subtle accent tint
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, `rgba(10,10,24,0.95)`);
  grad.addColorStop(0.5, `rgba(16,12,28,0.92)`);
  grad.addColorStop(1, `rgba(8,8,18,0.95)`);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Thin accent border on the interior edge
  ctx.strokeStyle = `${accentColor}33`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  // Label with glow
  ctx.font = FONT_LABEL;
  ctx.fillStyle = accentColor;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 8;
  ctx.fillText(label, x + 6, y + 16);
  ctx.shadowBlur = 0;

  // Subtle filigree lines (data stripe aesthetic)
  ctx.strokeStyle = `${accentColor}15`;
  ctx.lineWidth = 1;
  for (let i = 0; i < h; i += 6) {
    ctx.beginPath();
    ctx.moveTo(x, y + i);
    ctx.lineTo(x + w, y + i);
    ctx.stroke();
  }

  // Content text
  const contentX = x + 6;
  const contentY = y + 28;
  const maxW = w - 12;
  const maxH = h - 32;

  if (maxW > 20 && maxH > 12) {
    drawWrappedText(
      ctx, content || '—',
      contentX, contentY, maxW, maxH,
      FONT_CONTENT, `${accentColor}CC`,
      13, '…',
    );
  }

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
    { x: 0,       y: 0 },
    { x: S - A,   y: 0 },
    { x: 0,       y: S - A },
    { x: S - A,   y: S - A },
    // Core corners (facet intersections)
    { x: CO,      y: CO },
    { x: CO + CS, y: CO },
    { x: CO,      y: CO + CS },
    { x: CO + CS, y: CO + CS },
  ];

  positions.forEach(p => ctx.fillRect(p.x, p.y, A, A));
}

// ─────────────────────────────────────────────
// Band Gap Halo — security level indicator
// ─────────────────────────────────────────────

function drawBandGap(ctx: CanvasRenderingContext2D, color: string, label: string) {
  ctx.save();

  // Outer glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = color;
  ctx.lineWidth = BAND_GAP_WIDTH;

  // Core-sized rectangle (the Band Gap surrounds the Core)
  const x = CORE_OFFSET - 1;
  const y = CORE_OFFSET - 1;
  const s = CORE_SIZE + 2;
  ctx.strokeRect(x, y, s, s);

  // Second pass for intensity
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `${color}88`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 1, y - 1, s + 2, s + 2);

  // Band Gap label — top-right of core
  ctx.font = FONT_LABEL;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  const labelX = CORE_OFFSET + CORE_SIZE - 4;
  ctx.textAlign = 'right';
  ctx.fillText(label.toUpperCase(), labelX, CORE_OFFSET - 10);
  ctx.textAlign = 'left';
  ctx.shadowBlur = 0;

  ctx.restore();
}

// ─────────────────────────────────────────────
// Core (晶核) — draw sigil image or gemstone
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
    const facets = 8;

    // Deep crystalline background
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    bgGrad.addColorStop(0,   '#1a1a3a');
    bgGrad.addColorStop(0.3, '#12122a');
    bgGrad.addColorStop(0.7, '#0a0a1a');
    bgGrad.addColorStop(1,   '#050510');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(CORE_OFFSET, CORE_OFFSET, CORE_SIZE, CORE_SIZE);

    // 8-fold gemstone faces with higher contrast
    for (let i = 0; i < facets; i++) {
      const a0 = (i / facets) * Math.PI * 2;
      const a1 = ((i + 0.5) / facets) * Math.PI * 2;
      const a2 = ((i + 1) / facets) * Math.PI * 2;

      // First triangle (inner half)
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r);
      ctx.lineTo(cx + Math.cos(a1) * r * 0.9, cy + Math.sin(a1) * r * 0.9);
      ctx.closePath();
      const b1 = 0.35 + (i % 2) * 0.35;
      ctx.fillStyle = `${accent}${Math.floor(b1 * 55).toString(16).padStart(2, '0')}`;
      ctx.fill();

      // Second triangle (outer half)
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a1) * r * 0.9, cy + Math.sin(a1) * r * 0.9);
      ctx.lineTo(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
      ctx.closePath();
      const b2 = 0.25 + ((i + 1) % 2) * 0.25;
      ctx.fillStyle = `${accent}${Math.floor(b2 * 50).toString(16).padStart(2, '0')}`;
      ctx.fill();
    }

    // Star shimmer highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI + Math.PI / 8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r * 0.6, cy + Math.sin(angle) * r * 0.6);
      ctx.stroke();
    }

    // Center bright spot
    const spotGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.3);
    spotGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
    spotGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Outer edge glow
    ctx.strokeStyle = `${accent}55`;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(CORE_OFFSET + 1, CORE_OFFSET + 1, CORE_SIZE - 2, CORE_SIZE - 2);
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
   *
   * The image is designed to:
   *   - Be a beautiful, self-contained visual artifact
   *   - Display all key crystal info as readable text
   *   - Be OCR-able by multimodal AI vision models
   *   - Serve as the container for embedded payload chunks
   */
  async forge(options: ForgeOptions): Promise<Blob> {
    await ensureFont();
    const { payload, sigilImageBlob } = options;

    const accentColor = BAND_GAP_COLORS[payload.bandGapLevel] ?? '#0BDA51';
    const ctx = this.ctx;
    const S = CANVAS_SIZE;
    const CO = CORE_OFFSET;
    const CS = CORE_SIZE;

    // ── 1. Background ──────────────────────────
    // Dark gradient with subtle blue undertone
    const bgGrad = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    bgGrad.addColorStop(0, '#15152a');
    bgGrad.addColorStop(0.6, '#0d0d1c');
    bgGrad.addColorStop(1, '#06060e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, S, S);

    // ── 2. Six Facets ──────────────────────────

    // Top: Crown Facet (188px high, same width as Core)
    // Crystal name + version rendered as header-style text in center
    ctx.save();
    ctx.fillStyle = `${accentColor}22`;
    ctx.fillRect(CO, 0, CS, TOP_H);
    // Name header with glow
    ctx.font = FONT_TITLE;
    ctx.textAlign = 'center';
    ctx.fillStyle = accentColor;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 12;
    ctx.fillText(`${payload.crystalName}`, S / 2, TOP_H / 2 + 4);
    ctx.shadowBlur = 0;
    ctx.font = FONT_CONTENT;
    ctx.fillStyle = `${accentColor}AA`;
    ctx.fillText(`v${payload.crystalVersion} · ${payload.facets.crown.wakeWord || '—'} · Tier ${payload.crystalTier}`, S / 2, TOP_H / 2 + 22);
    ctx.textAlign = 'left';
    ctx.restore();

    // Upper-left: Correction Facet
    drawFacetPanel(ctx, 0, 0, CO, SIDE_H, '[CORRECTION]',
      payload.facets.correction.fallbackPrompt.slice(0, 200), accentColor);

    // Upper-right: Input Facet
    drawFacetPanel(ctx, CO + CS, 0, S - CO - CS, SIDE_H, '[INPUT]',
      payload.facets.input.format + (payload.facets.input.description ? ': ' + payload.facets.input.description : ''),
      accentColor);

    // Lower-left: Inclusion Facet
    drawFacetPanel(ctx, 0, SIDE_H, CO, SIDE_H, '[INCLUSION]',
      (payload.facets.inclusion.endpoints.length > 0
        ? payload.facets.inclusion.endpoints.join('\n')
        : '—'),
      accentColor);

    // Lower-right: Logic Facet (40% density — longest content)
    drawFacetPanel(ctx, CO + CS, SIDE_H, S - CO - CS, SIDE_H, '[LOGIC]',
      payload.facets.logic.systemPrompt.slice(0, 400), accentColor);

    // Bottom: Output Facet
    drawFacetPanel(ctx, CO, CO + CS, CS, BOT_H, '[OUTPUT]',
      `Format: ${payload.facets.output.format}` +
        (payload.facets.output.toneTemplate ? ` | ${payload.facets.output.toneTemplate}` : ''),
      accentColor);

    // ── 3. Quadrant Lock Anchors ───────────────
    drawQuadrantAnchors(ctx);

    // ── 4. Core (晶核) ─────────────────────────
    let sigilImg: HTMLImageElement | null = null;
    if (sigilImageBlob) {
      sigilImg = await this.loadImage(sigilImageBlob);
    }
    await drawCore(ctx, sigilImg, accentColor);

    // ── 5. Band Gap halo ───────────────────────
    drawBandGap(ctx, accentColor, payload.bandGapLevel);

    // ── Footer: Fingerprint line ──────────────
    ctx.save();
    ctx.font = FONT_SMALL;
    ctx.fillStyle = `${accentColor}66`;
    ctx.textAlign = 'center';
    const fp = payload.fingerprint.hash;
    ctx.fillText(
      `KIP v${payload.kipVersion} · ${payload.bandGapLevel.toUpperCase()} · SHA-256 ${fp ? fp.slice(0, 16) + '…' : 'pending'}`,
      S / 2, S - 6,
    );
    ctx.textAlign = 'left';
    ctx.restore();

    // ── Export to PNG Blob ─────────────────────
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