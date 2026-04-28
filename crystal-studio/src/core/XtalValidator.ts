/**
 * XtalValidator — Crystal Fingerprint & Security Gate
 * Phase 1: Skeleton
 *
 * Implements:
 *   - SHA-256 fingerprint verification (visual pixels + JSON payload + band gap color)
 *   - Band Gap permission level gating (safe / caution / restricted)
 *   - Malicious crystal blacklist check (stub — extensible)
 *
 * Author: Emberois | SPEC-KIP-0.1 §4.3 + §6
 */

import {
  KipPayload,
  BandGapLevel,
  BAND_GAP_COLORS,
  ValidationResult,
} from './types';

// ─────────────────────────────────────────────
// Malicious Crystal Blacklist (extensible stub)
// ─────────────────────────────────────────────

const BLACKLIST_IDS: Set<string> = new Set([
  // Add known malicious crystal UUIDs here
]);

// ─────────────────────────────────────────────
// SHA-256 via Web Crypto API (works offline)
// ─────────────────────────────────────────────

async function sha256Hex(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─────────────────────────────────────────────
// Pixel extraction helper
// ─────────────────────────────────────────────

async function extractPixelData(imageBlob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(new Uint8Array(imageData.data.buffer));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for pixel extraction'));
    };

    img.src = url;
  });
}

// ─────────────────────────────────────────────
// XtalValidator
// ─────────────────────────────────────────────

export class XtalValidator {
  /**
   * Full validation pipeline per SPEC-KIP-0.1 §4.3 + §6.
   *
   * Formula: SHA-256(visual_pixel_data + json_payload + band_gap_color_value)
   */
  async validate(imageBlob: Blob, payload: KipPayload): Promise<ValidationResult> {
    // ── 1. Blacklist check ──
    if (BLACKLIST_IDS.has(payload.crystalId)) {
      return {
        valid: false,
        bandGapOk: false,
        fingerprintOk: false,
        blacklisted: true,
        reason: `Crystal ID ${payload.crystalId} is blacklisted (Core Audit).`,
      };
    }

    // ── 2. Band Gap permission level ──
    const bandGapOk = this.validateBandGap(payload.bandGapLevel);

    // ── 3. Fingerprint check ──
    const fingerprintOk = await this.verifyFingerprint(imageBlob, payload);

    const valid = bandGapOk && fingerprintOk;
    return {
      valid,
      bandGapOk,
      fingerprintOk,
      blacklisted: false,
      reason: valid ? undefined : this.buildReason(bandGapOk, fingerprintOk),
    };
  }

  /**
   * Validates the band gap security level is within known enum values.
   * Actual UI-level gating (modals / blocks) is handled by the Crystal Runtime.
   */
  validateBandGap(level: BandGapLevel): boolean {
    return level in BAND_GAP_COLORS;
  }

  /**
   * Recomputes SHA-256 over pixel data + JSON payload + band gap color.
   * Returns false on mismatch — triggers CR_MISMATCH (Lattice Mismatch).
   */
  async verifyFingerprint(imageBlob: Blob, payload: KipPayload): Promise<boolean> {
    if (!payload.fingerprint?.hash) {
      // No fingerprint embedded — treat as unverified but not explicitly invalid
      // (allows Tier 1 crystals without fingerprints during development)
      console.warn('[XtalValidator] No fingerprint in payload — skipping verification');
      return true;
    }

    const pixelData = await extractPixelData(imageBlob);
    const jsonBytes = new TextEncoder().encode(JSON.stringify(payload));
    const bandGapBytes = new TextEncoder().encode(BAND_GAP_COLORS[payload.bandGapLevel] ?? '');

    const combined = new Uint8Array(pixelData.length + jsonBytes.length + bandGapBytes.length);
    let offset = 0;
    combined.set(pixelData,   offset); offset += pixelData.length;
    combined.set(jsonBytes,   offset); offset += jsonBytes.length;
    combined.set(bandGapBytes, offset);

    const computedHash = await sha256Hex(combined);
    const match = computedHash === payload.fingerprint.hash;

    if (!match) {
      console.error(
        '[XtalValidator] ⚠️ LATTICE MISMATCH\n',
        'Expected :', payload.fingerprint.hash, '\n',
        'Computed :', computedHash,
      );
    }

    return match;
  }

  /**
   * Compute a fresh fingerprint hash for a given image + payload.
   * Used by KrystalEncoder when forging new crystals.
   */
  async computeFingerprint(imageBlob: Blob, payload: KipPayload): Promise<string> {
    const pixelData = await extractPixelData(imageBlob);
    const jsonBytes = new TextEncoder().encode(JSON.stringify(payload));
    const bandGapBytes = new TextEncoder().encode(BAND_GAP_COLORS[payload.bandGapLevel] ?? '');

    const combined = new Uint8Array(pixelData.length + jsonBytes.length + bandGapBytes.length);
    let offset = 0;
    combined.set(pixelData,   offset); offset += pixelData.length;
    combined.set(jsonBytes,   offset); offset += jsonBytes.length;
    combined.set(bandGapBytes, offset);

    return sha256Hex(combined);
  }

  private buildReason(bandGapOk: boolean, fingerprintOk: boolean): string {
    const reasons: string[] = [];
    if (!bandGapOk) reasons.push('Invalid Band Gap security level');
    if (!fingerprintOk) reasons.push('SHA-256 Lattice Mismatch — payload may be tampered');
    return reasons.join('; ');
  }
}
