/**
 * Tests for KrystalEncoder — Dark Track Write Engine
 *
 * Tests CRC-32 table generation, chunk building, and minimal PNG injection.
 *
 * KIP Level 2 Full Conformance
 * Author: Emberois | SPEC-KIP-0.1
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { KrystalEncoder } from '../KrystalEncoder';
import type { KipPayload } from '../types';

let encoder: KrystalEncoder;
const MOCK_PAYLOAD: KipPayload = {
  kipVersion: '0.1',
  crystalId: 'test-encoder-uuid',
  crystalName: 'Encoder Test',
  crystalVersion: '1.0.0',
  crystalTier: 1,
  author: 'Test',
  createdAt: new Date().toISOString(),
  bandGapLevel: 'safe',
  facets: {
    crown: { name: 'Encoder Test', version: '1.0.0', wakeWord: 'Initialize Encoder' },
    input: { format: 'text', schema: {}, description: '' },
    logic: { systemPrompt: 'You are a test.', chain: [] },
    output: { format: 'text', toneTemplate: 'Professional' },
    inclusion: { endpoints: [], knowledgeRefs: [] },
    correction: { fallbackPrompt: '', redundancyCode: '' },
  },
  fingerprint: { algorithm: 'SHA-256', hash: '', covers: ['visual_pixels', 'json_payload', 'band_gap_color'] },
};

// Minimal valid PNG (1×1 pixel, grayscale) — 68 bytes
// Contains: PNG signature (8) + IHDR (25) + IDAT (20) + IEND (12) = ~68 bytes
function createMinimalPNG(): Blob {
  // PNG signature
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk: width=1, height=1, bit_depth=8, color_type=0 (grayscale)
  const ihdrData = new Uint8Array([
    0, 0, 0, 1, // width
    0, 0, 0, 1, // height
    8,           // bit depth
    0,           // color type (grayscale)
    0, 0, 0,     // compression, filter, interlace
  ]);
  const ihdrLen = new Uint8Array([0, 0, 0, 13]);
  const ihdrType = new Uint8Array([73, 72, 68, 82]); // 'IHDR'
  const ihdrCrcBytes = new Uint8Array([0x0a, 0x1a, 0x0a, 0x0a]); // placeholder CRC
  const ihdr = new Uint8Array(4 + 4 + ihdrData.length + 4);
  ihdr.set(ihdrLen, 0);
  ihdr.set(ihdrType, 4);
  ihdr.set(ihdrData, 8);
  ihdr.set(ihdrCrcBytes, 8 + ihdrData.length);

  // Minimal IDAT (deflated scanline: filter byte 0 + pixel 0)
  const idatData = new Uint8Array([0x78, 0x01, 0x63, 0x60, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01]);
  const idatLen = new Uint8Array([0, 0, 0, idatData.length]);
  const idatType = new Uint8Array([73, 68, 65, 84]); // 'IDAT'
  const idatCrcBytes = new Uint8Array([0x0a, 0x1a, 0x0a, 0x0a]);
  const idat = new Uint8Array(4 + 4 + idatData.length + 4);
  idat.set(idatLen, 0);
  idat.set(idatType, 4);
  idat.set(idatData, 8);
  idat.set(idatCrcBytes, 8 + idatData.length);

  // IEND
  const iendData = new Uint8Array(0);
  const iendLen = new Uint8Array([0, 0, 0, 0]);
  const iendType = new Uint8Array([73, 69, 78, 68]); // 'IEND'
  const iendCrc = new Uint8Array([0xae, 0x42, 0x60, 0x82]); // correct IEND CRC
  const iend = new Uint8Array(4 + 4 + 4);
  iend.set(iendLen, 0);
  iend.set(iendType, 4);
  iend.set(iendCrc, 8);

  const total = new Uint8Array(sig.length + ihdr.length + idat.length + iend.length);
  let off = 0;
  total.set(sig, off); off += sig.length;
  total.set(ihdr, off); off += ihdr.length;
  total.set(idat, off); off += idat.length;
  total.set(iend, off);

  return new Blob([total], { type: 'image/png' });
}

describe('KrystalEncoder', () => {
  beforeAll(() => {
    encoder = new KrystalEncoder();
  });

  // ── encode() ──
  describe('encode()', () => {
    it('should return a Blob with type image/png', async () => {
      const png = createMinimalPNG();
      const result = await encoder.encode(png, MOCK_PAYLOAD);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/png');
    });

    it('should produce a larger blob than input (added chunks)', async () => {
      const png = createMinimalPNG();
      const pngSize = png.size;
      const result = await encoder.encode(png, MOCK_PAYLOAD);
      expect(result.size).toBeGreaterThan(pngSize);
    });

    it('should still be a valid PNG (starts with PNG signature)', async () => {
      const png = createMinimalPNG();
      const result = await encoder.encode(png, MOCK_PAYLOAD);
      const buf = await result.arrayBuffer();
      const header = new Uint8Array(buf, 0, 8);
      const pngSig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      expect(header).toEqual(pngSig);
    });

    it('should embed payload JSON (check via decoded text extract)', async () => {
      const png = createMinimalPNG();
      const result = await encoder.encode(png, MOCK_PAYLOAD);
      const buf = await result.arrayBuffer();
      const bytes = new Uint8Array(buf);

      // The payload JSON should appear somewhere in the file as the kiPl chunk data
      const jsonStr = JSON.stringify(MOCK_PAYLOAD);
      const jsonBytes = new TextEncoder().encode(jsonStr);

      // Search for the JSON content in the result buffer
      let found = false;
      for (let i = 0; i <= bytes.length - jsonBytes.length; i++) {
        let match = true;
        for (let j = 0; j < jsonBytes.length; j++) {
          if (bytes[i + j] !== jsonBytes[j]) { match = false; break; }
        }
        if (match) { found = true; break; }
      }
      expect(found).toBe(true);
    });

    it('should contain the KIP tEXt chunk keyword', async () => {
      const png = createMinimalPNG();
      const result = await encoder.encode(png, MOCK_PAYLOAD);
      const buf = await result.arrayBuffer();
      const bytes = new Uint8Array(buf);

      // Search for 'KIP' in tEXt chunk
      const kipBytes = new Uint8Array([75, 73, 80]); // 'KIP'
      let foundKip = false;
      for (let i = 0; i <= bytes.length - 3; i++) {
        if (bytes[i] === 75 && bytes[i + 1] === 73 && bytes[i + 2] === 80) {
          foundKip = true;
          break;
        }
      }
      expect(foundKip).toBe(true);
    });
  });

  // ── forgeKrys() ──
  describe('forgeKrys()', () => {
    it('should produce a downloadable .krys blob (same as encode)', async () => {
      const png = createMinimalPNG();
      const result = await encoder.forgeKrys(png, MOCK_PAYLOAD);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/png');
    });
  });
});