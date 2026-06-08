/**
 * KrystalEncoder — Dark Track Write Engine
 * Phase 1: Skeleton (Xtal-Compiler)
 *
 * Injects KipPayload into a PNG file as a private 'kiPl' chunk,
 * placed immediately before IDAT, ensuring maximum compatibility
 * with PNG readers that don't understand private chunks.
 *
 * Author: Emberois | SPEC-KIP-0.1
 */

import type { KipPayload } from './types';

// ─────────────────────────────────────────────
// CRC-32 for PNG chunk integrity
// ─────────────────────────────────────────────

function makeCRCTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const CRC_TABLE = makeCRCTable();

function crc32(data: Uint8Array, start = 0, end = data.length): number {
  let crc = 0xffffffff;
  for (let i = start; i < end; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ─────────────────────────────────────────────
// Chunk builder
// ─────────────────────────────────────────────

function buildChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);

  // Length (4 bytes, big-endian)
  view.setUint32(0, data.length, false);

  // Type (4 bytes)
  chunk.set(typeBytes, 4);

  // Data
  chunk.set(data, 8);

  // CRC over type + data
  const crc = crc32(chunk, 4, 8 + data.length);
  view.setUint32(8 + data.length, crc, false);

  return chunk;
}

// ─────────────────────────────────────────────
// KrystalEncoder
// ─────────────────────────────────────────────

export class KrystalEncoder {
  /**
   * Injects a KipPayload into an existing PNG image as a 'kiPl' private chunk.
   * Returns the modified PNG as a Blob.
   *
   * Insertion point: immediately before the IDAT chunk (searched by chunk type).
   * This is more robust than assuming the IHDR chunk position (8+25).
   */
  async encode(imageFile: File | Blob, payload: KipPayload): Promise<Blob> {
    const buffer = new Uint8Array(await imageFile.arrayBuffer());
    const json = JSON.stringify(payload);
    const payloadBytes = new TextEncoder().encode(json);

    // Build the kiPl chunk
    const kipChunk = buildChunk('kiPl', payloadBytes);

    // Also embed as a human-readable tEXt chunk for OCR fallback
    const keyword = new TextEncoder().encode('KIP');
    const nullByte = new Uint8Array([0]);
    const tEXtData = new Uint8Array([...keyword, ...nullByte, ...payloadBytes]);
    const textChunk = buildChunk('tEXt', tEXtData);

    // Search for the IDAT chunk (first occurrence), which is where we inject
    const idatType = new TextEncoder().encode('IDAT');
    let idatIndex = -1;
    for (let i = 8; i < buffer.length - 4; i++) {
      if (buffer[i] === idatType[0] && buffer[i + 1] === idatType[1] &&
          buffer[i + 2] === idatType[2] && buffer[i + 3] === idatType[3]) {
        idatIndex = i;
        break;
      }
    }

    // If no IDAT found, fall back to inserting before IEND
    if (idatIndex === -1) {
      const iendType = new TextEncoder().encode('IEND');
      for (let i = 8; i < buffer.length - 4; i++) {
        if (buffer[i] === iendType[0] && buffer[i + 1] === iendType[1] &&
            buffer[i + 2] === iendType[2] && buffer[i + 3] === iendType[3]) {
          idatIndex = i;
          break;
        }
      }
    }

    // Last resort: after IHDR (8 + 4 + 4 + 13 + 4 = 33)
    if (idatIndex === -1) idatIndex = 8 + 25;

    // IDAT chunk position: the 4 bytes before the type are the length
    const insertionPoint = idatIndex - 4;
    const before = buffer.slice(0, insertionPoint);
    const after = buffer.slice(insertionPoint);

    // Rebuild the PNG: before + kiPl + tEXt + after (starting at IDAT)
    const extended = new Uint8Array(
      before.length + kipChunk.length + textChunk.length + after.length
    );
    let offset = 0;
    extended.set(before, offset);       offset += before.length;
    extended.set(kipChunk, offset);     offset += kipChunk.length;
    extended.set(textChunk, offset);    offset += textChunk.length;
    extended.set(after, offset);

    return new Blob([extended], { type: 'image/png' });
  }

  /**
   * Generate a download-ready .krys file blob.
   * A .krys file is structurally a PNG with embedded KIP chunks.
   */
  async forgeKrys(imageFile: File | Blob, payload: KipPayload): Promise<Blob> {
    return this.encode(imageFile, payload);
  }
}
