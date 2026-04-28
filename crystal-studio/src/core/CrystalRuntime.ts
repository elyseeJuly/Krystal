/**
 * Crystal Runtime — State Machine
 * Phase 3: Soul Injection
 *
 * Implements the full CR lifecycle per SPEC-KIP-0.1 §5:
 * IDLE → MOUNTING → VALIDATING → DISPERSING → REFRACTING → COMPLETE / CLEAVAGE
 *
 * Author: Emberois | SPEC-KIP-0.1
 */

import type { CrystalState, CrystalEvent, CrystalRuntimeState } from './types';

// ─────────────────────────────────────────────
// State Transition Table
// ─────────────────────────────────────────────

type Transition = Partial<Record<CrystalEvent, CrystalState>>;
const TRANSITIONS: Record<CrystalState, Transition> = {
  IDLE: {
    CR_CRYSTALLIZE: 'MOUNTING',
  },
  MOUNTING: {
    PARSE_SUCCESS: 'VALIDATING',
    CR_DEFECT:     'DEFECT',
    CR_MISMATCH:   'MISMATCH',
  },
  VALIDATING: {
    VALIDATION_PASS: 'DISPERSING',
    CR_MISMATCH:     'MISMATCH',
    CR_DEFECT:       'DEFECT',
  },
  DISPERSING: {
    CR_REFRACT: 'REFRACTING',
    CR_DEFECT:  'DEFECT',
  },
  REFRACTING: {
    REFRACT_COMPLETE: 'COMPLETE',
    CR_DEFECT:        'DEFECT',
    CR_MISMATCH:      'MISMATCH',
  },
  COMPLETE: {
    CR_CLEAVAGE:      'CLEAVAGE',
    CR_RECRYSTALLIZE: 'MOUNTING',
  },
  DEFECT: {
    CR_CLEAVAGE: 'CLEAVAGE',
  },
  MISMATCH: {
    CR_CLEAVAGE: 'CLEAVAGE',
  },
  CLEAVAGE: {
    CLEAN_COMPLETE: 'IDLE',
  },
};

// ─────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────

export type CrystalAction =
  | { type: CrystalEvent }
  | { type: 'CR_DEFECT';   errorMessage: string }
  | { type: 'CR_MISMATCH'; errorMessage: string }
  | { type: 'PARSE_SUCCESS'; payload: import('./types').KipPayload; imageBlob: Blob }
  | { type: 'CR_DETECT_OFFLINE'; isOffline: boolean };

export const initialCrystalState: CrystalRuntimeState = {
  state:        'IDLE',
  payload:      null,
  imageBlob:    null,
  errorMessage: null,
  isOffline:    false,
};

export function crystalReducer(
  state: CrystalRuntimeState,
  action: CrystalAction,
): CrystalRuntimeState {

  // Special side-effect actions not in the state machine
  if (action.type === 'CR_DETECT_OFFLINE') {
    return { ...state, isOffline: (action as { type: string; isOffline: boolean }).isOffline };
  }

  const nextStateId = (TRANSITIONS[state.state] as Transition)[action.type as CrystalEvent];

  if (!nextStateId) {
    console.warn(`[CrystalRuntime] Invalid transition: ${state.state} + ${action.type}`);
    return state;
  }

  const base: CrystalRuntimeState = { ...state, state: nextStateId };

  switch (action.type) {
    case 'PARSE_SUCCESS': {
      const a = action as Extract<CrystalAction, { type: 'PARSE_SUCCESS' }>;
      return { ...base, payload: a.payload, imageBlob: a.imageBlob, errorMessage: null };
    }
    case 'CR_DEFECT': {
      const a = action as Extract<CrystalAction, { type: 'CR_DEFECT' }>;
      return { ...base, errorMessage: a.errorMessage };
    }
    case 'CR_MISMATCH': {
      const a = action as Extract<CrystalAction, { type: 'CR_MISMATCH' }>;
      return { ...base, errorMessage: a.errorMessage };
    }
    case 'CLEAN_COMPLETE':
      return { ...initialCrystalState };
    default:
      return base;
  }
}
