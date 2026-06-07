/**
 * Tests for CrystalRuntime — CR State Machine Reducer
 *
 * KIP Level 2 Full Conformance
 * Author: Emberois | SPEC-KIP-0.1
 */

import { describe, it, expect } from 'vitest';
import { crystalReducer, initialCrystalState, type CrystalAction } from '../CrystalRuntime';
import type { KipPayload } from '../types';

const MOCK_PAYLOAD: KipPayload = {
  kipVersion: '0.1',
  crystalId: 'test-uuid',
  crystalName: 'Test Crystal',
  crystalVersion: '1.0.0',
  crystalTier: 1,
  author: 'Test',
  createdAt: new Date().toISOString(),
  bandGapLevel: 'safe',
  facets: {
    crown: { name: 'Test', version: '1.0.0', wakeWord: 'Initialize' },
    input: { format: 'text', schema: {}, description: 'test' },
    logic: { systemPrompt: 'You are a test assistant.', chain: [] },
    output: { format: 'text', toneTemplate: 'Professional' },
    inclusion: { endpoints: [], knowledgeRefs: [] },
    correction: { fallbackPrompt: '', redundancyCode: '' },
  },
  fingerprint: { algorithm: 'SHA-256', hash: 'abc123', covers: ['visual_pixels', 'json_payload', 'band_gap_color'] },
};

function act(action: CrystalAction) {
  return crystalReducer(initialCrystalState, action);
}

function stateAfter(...actions: CrystalAction[]) {
  return actions.reduce((s, a) => crystalReducer(s, a), initialCrystalState);
}

const MOCK_BLOB = new Blob(['fake-png'], { type: 'image/png' });

describe('CrystalRuntime Reducer', () => {
  // ── Initial State ──
  describe('initial state', () => {
    it('should start in IDLE state with null payload', () => {
      expect(initialCrystalState.state).toBe('IDLE');
      expect(initialCrystalState.payload).toBeNull();
      expect(initialCrystalState.imageBlob).toBeNull();
      expect(initialCrystalState.errorMessage).toBeNull();
      expect(initialCrystalState.isOffline).toBe(false);
    });
  });

  // ── Happy path: IDLE → MOUNTING → VALIDATING → DISPERSING → REFRACTING → COMPLETE → CLEAVAGE → IDLE ──
  describe('happy path state transitions', () => {
    it('CR_CRYSTALLIZE: IDLE → MOUNTING', () => {
      const s = act({ type: 'CR_CRYSTALLIZE' });
      expect(s.state).toBe('MOUNTING');
      expect(s.errorMessage).toBeNull();
    });

    it('PARSE_SUCCESS: MOUNTING → VALIDATING (sets payload)', () => {
      const s = stateAfter(
        { type: 'CR_CRYSTALLIZE' },
        { type: 'PARSE_SUCCESS', payload: MOCK_PAYLOAD, imageBlob: MOCK_BLOB },
      );
      expect(s.state).toBe('VALIDATING');
      expect(s.payload?.crystalName).toBe('Test Crystal');
      expect(s.imageBlob).toBe(MOCK_BLOB);
      expect(s.errorMessage).toBeNull();
    });

    it('VALIDATION_PASS: VALIDATING → DISPERSING', () => {
      const s = stateAfter(
        { type: 'CR_CRYSTALLIZE' },
        { type: 'PARSE_SUCCESS', payload: MOCK_PAYLOAD, imageBlob: MOCK_BLOB },
        { type: 'VALIDATION_PASS' },
      );
      expect(s.state).toBe('DISPERSING');
    });

    it('CR_REFRACT: DISPERSING → REFRACTING', () => {
      const s = stateAfter(
        { type: 'CR_CRYSTALLIZE' },
        { type: 'PARSE_SUCCESS', payload: MOCK_PAYLOAD, imageBlob: MOCK_BLOB },
        { type: 'VALIDATION_PASS' },
        { type: 'CR_REFRACT' },
      );
      expect(s.state).toBe('REFRACTING');
    });

    it('REFRACT_COMPLETE: REFRACTING → COMPLETE', () => {
      const s = stateAfter(
        { type: 'CR_CRYSTALLIZE' },
        { type: 'PARSE_SUCCESS', payload: MOCK_PAYLOAD, imageBlob: MOCK_BLOB },
        { type: 'VALIDATION_PASS' },
        { type: 'CR_REFRACT' },
        { type: 'REFRACT_COMPLETE' },
      );
      expect(s.state).toBe('COMPLETE');
      expect(s.payload).toBeTruthy();
    });

    it('CR_CLEAVAGE from COMPLETE: COMPLETE → CLEAVAGE', () => {
      const s = stateAfter(
        { type: 'CR_CRYSTALLIZE' },
        { type: 'PARSE_SUCCESS', payload: MOCK_PAYLOAD, imageBlob: MOCK_BLOB },
        { type: 'VALIDATION_PASS' },
        { type: 'CR_REFRACT' },
        { type: 'REFRACT_COMPLETE' },
        { type: 'CR_CLEAVAGE' },
      );
      expect(s.state).toBe('CLEAVAGE');
    });

    it('CLEAN_COMPLETE: CLEAVAGE → IDLE (resets to initial)', () => {
      const s = stateAfter(
        { type: 'CR_CRYSTALLIZE' },
        { type: 'PARSE_SUCCESS', payload: MOCK_PAYLOAD, imageBlob: MOCK_BLOB },
        { type: 'VALIDATION_PASS' },
        { type: 'CR_REFRACT' },
        { type: 'REFRACT_COMPLETE' },
        { type: 'CR_CLEAVAGE' },
        { type: 'CLEAN_COMPLETE' },
      );
      expect(s.state).toBe('IDLE');
      expect(s.payload).toBeNull();
      expect(s.imageBlob).toBeNull();
    });
  });

  // ── Error paths ──
  describe('error state transitions', () => {
    it('CR_DEFECT from MOUNTING: MOUNTING → DEFECT (with errorMessage)', () => {
      const s = stateAfter(
        { type: 'CR_CRYSTALLIZE' },
        { type: 'CR_DEFECT', errorMessage: 'Failed to parse file' },
      );
      expect(s.state).toBe('DEFECT');
      expect(s.errorMessage).toBe('Failed to parse file');
    });

    it('CR_MISMATCH from MOUNTING: MOUNTING → MISMATCH', () => {
      const s = stateAfter(
        { type: 'CR_CRYSTALLIZE' },
        { type: 'CR_MISMATCH', errorMessage: 'Hash mismatch' },
      );
      expect(s.state).toBe('MISMATCH');
      expect(s.errorMessage).toBe('Hash mismatch');
    });

    it('CR_DEFECT from VALIDATING: VALIDATING → DEFECT', () => {
      const s = stateAfter(
        { type: 'CR_CRYSTALLIZE' },
        { type: 'PARSE_SUCCESS', payload: MOCK_PAYLOAD, imageBlob: MOCK_BLOB },
        { type: 'CR_DEFECT', errorMessage: 'Validation failed' },
      );
      expect(s.state).toBe('DEFECT');
    });

    it('DEFECT → CLEAVAGE → CLEAN_COMPLETE → IDLE', () => {
      const s = stateAfter(
        { type: 'CR_CRYSTALLIZE' },
        { type: 'CR_DEFECT', errorMessage: 'err' },
        { type: 'CR_CLEAVAGE' },
        { type: 'CLEAN_COMPLETE' },
      );
      expect(s.state).toBe('IDLE');
    });

    it('MISMATCH → CLEAVAGE → CLEAN_COMPLETE → IDLE', () => {
      const s = stateAfter(
        { type: 'CR_CRYSTALLIZE' },
        { type: 'CR_MISMATCH', errorMessage: 'mismatch' },
        { type: 'CR_CLEAVAGE' },
        { type: 'CLEAN_COMPLETE' },
      );
      expect(s.state).toBe('IDLE');
    });

    it('CR_DEFECT during REFRACTING: REFRACTING → DEFECT', () => {
      const s = stateAfter(
        { type: 'CR_CRYSTALLIZE' },
        { type: 'PARSE_SUCCESS', payload: MOCK_PAYLOAD, imageBlob: MOCK_BLOB },
        { type: 'VALIDATION_PASS' },
        { type: 'CR_REFRACT' },
        { type: 'CR_DEFECT', errorMessage: 'API error' },
      );
      expect(s.state).toBe('DEFECT');
      expect(s.errorMessage).toBe('API error');
    });
  });

  // ── Recrystallize ──
  describe('recrystallize', () => {
    it('CR_RECRYSTALLIZE from COMPLETE: COMPLETE → MOUNTING', () => {
      const s = stateAfter(
        { type: 'CR_CRYSTALLIZE' },
        { type: 'PARSE_SUCCESS', payload: MOCK_PAYLOAD, imageBlob: MOCK_BLOB },
        { type: 'VALIDATION_PASS' },
        { type: 'CR_REFRACT' },
        { type: 'REFRACT_COMPLETE' },
        { type: 'CR_RECRYSTALLIZE' },
      );
      expect(s.state).toBe('MOUNTING');
    });
  });

  // ── Offline ──
  describe('offline state', () => {
    it('CR_DETECT_OFFLINE: sets isOffline to true', () => {
      const s = act({ type: 'CR_DETECT_OFFLINE', isOffline: true });
      expect(s.isOffline).toBe(true);
      expect(s.state).toBe('IDLE'); // unchanged
    });

    it('CR_DETECT_OFFLINE: sets isOffline to false', () => {
      const s = stateAfter(
        { type: 'CR_DETECT_OFFLINE', isOffline: true },
        { type: 'CR_DETECT_OFFLINE', isOffline: false },
      );
      expect(s.isOffline).toBe(false);
    });
  });

  // ── Illegal transitions (should be no-ops) ──
  describe('illegal transitions (should stay in same state)', () => {
    it('CR_REFRACT from IDLE should remain IDLE', () => {
      const s = act({ type: 'CR_REFRACT' });
      expect(s.state).toBe('IDLE');
    });

    it('VALIDATION_PASS from MOUNTING should remain MOUNTING', () => {
      const s = stateAfter(
        { type: 'CR_CRYSTALLIZE' },
        { type: 'VALIDATION_PASS' },
      );
      expect(s.state).toBe('MOUNTING');
    });

    it('CR_CLEAVAGE from IDLE should remain IDLE', () => {
      const s = act({ type: 'CR_CLEAVAGE' });
      expect(s.state).toBe('IDLE');
    });

    it('unknown event should return same state', () => {
      const s = crystalReducer(initialCrystalState, { type: 'UNKNOWN_EVENT' as any });
      expect(s.state).toBe('IDLE');
    });
  });
});