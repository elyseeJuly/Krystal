/**
 * Tests for types.ts — KIP Type Definitions and Constants
 *
 * Validates that all type definitions, color values, and facet structures
 * conform to SPEC-KIP-0.1 §2.3 and Appendix A.
 *
 * KIP Level 2 Full Conformance
 * Author: Emberois | SPEC-KIP-0.1
 */

import { describe, it, expect } from 'vitest';
import {
  BAND_GAP_COLORS,
  QUADRANT_LOCK_COLOR,
} from '../types';

describe('BAND_GAP_COLORS', () => {
  const expected: Record<string, string> = {
    safe:       '#0BDA51',
    caution:    '#FFBF00',
    restricted: '#E30022',
    tool:       '#2979FF',
    multimodal: '#B388FF',
  };

  for (const level of (Object.keys(expected) as Array<keyof typeof BAND_GAP_COLORS>)) {
    it(`${level} should be ${expected[level]}`, () => {
      expect(BAND_GAP_COLORS[level]).toBe(expected[level]);
    });
  }

  it('should have exactly 5 band gap levels', () => {
    expect(Object.keys(BAND_GAP_COLORS).length).toBe(5);
  });

  it('should use sRGB hex format (uppercase, 6 digits)', () => {
    for (const hex of Object.values(BAND_GAP_COLORS)) {
      expect(hex).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});

describe('QUADRANT_LOCK_COLOR', () => {
  it('should be Magenta #FF00FF per SPEC Appendix A', () => {
    expect(QUADRANT_LOCK_COLOR).toBe('#FF00FF');
  });
});