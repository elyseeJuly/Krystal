/**
 * KrystalDecoder — Dark Track Extraction Engine
 * Phase 1: Skeleton (Xtal-Compiler)
 *
 * Priority chain:
 *   1. PNG private chunk 'kiPl' (lossless, preferred)
 *   2. EXIF UserComment (social-media survival fallback)
 *   3. LSB steganography stub (future implementation hook)
 *
 * Author: Emberois | SPEC-KIP-0.1
 */

import { KipPayload } from './types';

// ─────────────────────────────────────────────
// PNG chunk parser helpers
// ─────────────────────────────────────────────

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

function isPNG(buffer: Uint8Array): boolean {
  return PNG_SIGNATURE.every((b, i) => buffer[i] === b);
}

interface PNGChunk {
  type: string;
  data: Uint8Array;
}

function parsePNGChunks(buffer: Uint8Array): PNGChunk[] {
  const chunks: PNGChunk[] = [];
  let offset = 8; // skip PNG signature

  while (offset < buffer.byteLength) {
    if (offset + 12 > buffer.byteLength) break;

    const view = new DataView(buffer.buffer, buffer.byteOffset + offset);
    const length = view.getUint32(0, false); // big-endian
    const type = String.fromCharCode(
      buffer[offset + 4],
      buffer[offset + 5],
      buffer[offset + 6],
      buffer[offset + 7],
    );
    const data = buffer.slice(offset + 8, offset + 8 + length);

    chunks.push({ type, data });
    offset += 12 + length; // length(4) + type(4) + data(length) + crc(4)

    if (type === 'IEND') break;
  }

  return chunks;
}

// ─────────────────────────────────────────────
// Main decoder
// ─────────────────────────────────────────────

export class KrystalDecoder {
  /**
   * Primary entry point.
   * Returns the parsed KipPayload or null if dark-track is unreadable
   * (caller should then delegate to light-track / manual parsing).
   */
  async decode(file: File | Blob): Promise<KipPayload | null> {
    const buffer = new Uint8Array(await file.arrayBuffer());

    // ── Priority 1: PNG Chunk 'kiPl' ──
    const fromChunk = this.extractFromPNGChunk(buffer);
    if (fromChunk) return fromChunk;

    // ── Priority 2: EXIF / tEXt chunk with key "KIP" ──
    const fromText = this.extractFromTextChunk(buffer);
    if (fromText) return fromText;

    // ── Priority 3: LSB stub (reserved for future implementation) ──
    // LSB extraction is susceptible to social-media compression.
    // Per SPEC-KIP-0.1 §3.1, PNG chunk is preferred.
    console.warn('[KrystalDecoder] Dark track not found — caller should invoke light track');
    return null;
  }

  // ── Private: PNG private chunk 'kiPl' ──────
  private extractFromPNGChunk(buffer: Uint8Array): KipPayload | null {
    if (!isPNG(buffer)) return null;

    const chunks = parsePNGChunks(buffer);
    const kipChunk = chunks.find(c => c.type === 'kiPl');
    if (!kipChunk) return null;

    try {
      const json = new TextDecoder('utf-8').decode(kipChunk.data);
      return JSON.parse(json) as KipPayload;
    } catch {
      console.error('[KrystalDecoder] Failed to parse kiPl chunk JSON');
      return null;
    }
  }

  // ── Private: tEXt / iTXt chunk with keyword "KIP" ──
  private extractFromTextChunk(buffer: Uint8Array): KipPayload | null {
    if (!isPNG(buffer)) return null;

    const chunks = parsePNGChunks(buffer);
    const textChunks = chunks.filter(c => c.type === 'tEXt' || c.type === 'iTXt');

    for (const chunk of textChunks) {
      // tEXt: keyword\0text
      const nullIdx = chunk.data.indexOf(0);
      if (nullIdx === -1) continue;

      const keyword = new TextDecoder().decode(chunk.data.slice(0, nullIdx));
      if (keyword !== 'KIP') continue;

      const text = new TextDecoder().decode(chunk.data.slice(nullIdx + 1));
      try {
        return JSON.parse(text) as KipPayload;
      } catch {
        continue;
      }
    }

    return null;
  }
}

// ─────────────────────────────────────────────
// Light Track — Text Anchor Parser
// (Used when image has been compressed / screenshot)
// ─────────────────────────────────────────────

export const ANCHOR_KEYWORDS = [
  '[CROWN]', '[INPUT]', '[LOGIC]', '[OUTPUT]', '[INCLUSION]', '[CORRECTION]',
] as const;

export type AnchorKeyword = typeof ANCHOR_KEYWORDS[number];

export type LightTrackResult = Partial<Record<string, string>>;

/**
 * Parse OCR-extracted text from a degraded (compressed) Krystal image.
 * Extracts content after each text anchor keyword.
 * Target: ≥70% core logic recovery per SPEC-KIP-0.1 §4.2
 */
export function parseLightTrack(ocrText: string): LightTrackResult {
  const result: LightTrackResult = {};

  for (const anchor of ANCHOR_KEYWORDS) {
    const key = anchor.replace(/[\[\]]/g, '').toLowerCase();
    const idx = ocrText.indexOf(anchor);
    if (idx === -1) continue;

    // Collect everything up to the next anchor or end of string
    const remaining = ocrText.slice(idx + anchor.length);
    const nextAnchorIdx = ANCHOR_KEYWORDS.reduce((min, a) => {
      if (a === anchor) return min;
      const pos = remaining.indexOf(a);
      return pos !== -1 && pos < min ? pos : min;
    }, remaining.length);

    result[key] = remaining.slice(0, nextAnchorIdx).trim();
  }

  return result;
}
