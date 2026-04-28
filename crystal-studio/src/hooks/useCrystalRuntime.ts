/**
 * useCrystalRuntime — Master Runtime Hook
 * Wraps the Crystal Runtime state machine and exposes
 * all lifecycle actions to React components.
 *
 * Author: Emberois | SPEC-KIP-0.1
 */

import { useReducer, useCallback, useEffect } from 'react';
import {
  crystalReducer,
  initialCrystalState,
  CrystalAction,
} from '../core/CrystalRuntime';
import {
  KrystalDecoder,
  KrystalEncoder,
  XtalValidator,
  SigilForge,
  KipPayload,
  BandGapLevel,
  CrystalRuntimeState,
} from '../core';

export interface UseCrystalRuntimeReturn {
  runtimeState: CrystalRuntimeState;
  dispatch: React.Dispatch<CrystalAction>;
  // High-level actions
  loadKrys: (file: File) => Promise<void>;
  crystallize: (payload: KipPayload, sigilBlob?: Blob | null) => Promise<void>;
  refract: () => void;
  cleavage: () => void;
}

export function useCrystalRuntime(): UseCrystalRuntimeReturn {
  const [runtimeState, dispatch] = useReducer(crystalReducer, initialCrystalState);

  // ── Detect offline status ─────────────────────
  useEffect(() => {
    const update = () =>
      dispatch({ type: 'CR_DETECT_OFFLINE', isOffline: !navigator.onLine } as CrystalAction);
    window.addEventListener('online',  update);
    window.addEventListener('offline', update);
    update();
    return () => {
      window.removeEventListener('online',  update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // ── Load existing .krys file ──────────────────
  const loadKrys = useCallback(async (file: File) => {
    dispatch({ type: 'CR_CRYSTALLIZE' });

    try {
      const decoder = new KrystalDecoder();
      const payload = await decoder.decode(file);

      if (!payload) {
        dispatch({
          type: 'CR_DEFECT',
          errorMessage: '[KrystalDecoder] Dark track unreadable — no valid KIP payload found. Light track fallback required.',
        });
        return;
      }

      dispatch({ type: 'PARSE_SUCCESS', payload, imageBlob: file });

      // ── Validate ──────────────────────────────
      const validator = new XtalValidator();
      const result = await validator.validate(file, payload);

      if (!result.valid) {
        if (!result.fingerprintOk) {
          dispatch({
            type: 'CR_MISMATCH',
            errorMessage: `⚠️ 晶格失配 (Lattice Mismatch) — ${result.reason}`,
          });
        } else {
          dispatch({ type: 'CR_DEFECT', errorMessage: result.reason ?? 'Validation failed' });
        }
        return;
      }

      dispatch({ type: 'VALIDATION_PASS' });
    } catch (e) {
      dispatch({ type: 'CR_DEFECT', errorMessage: String(e) });
    }
  }, []);

  // ── Crystallize (forge new .krys) ─────────────
  const crystallize = useCallback(async (payload: KipPayload, sigilBlob?: Blob | null) => {
    dispatch({ type: 'CR_CRYSTALLIZE' });

    try {
      const forge = new SigilForge();
      const renderedPng = await forge.forge({ payload, sigilImageBlob: sigilBlob });

      // Compute + inject fingerprint
      const validator = new XtalValidator();
      const hash = await validator.computeFingerprint(renderedPng, payload);
      const signedPayload: KipPayload = {
        ...payload,
        fingerprint: { algorithm: 'SHA-256', hash, covers: ['visual_pixels', 'json_payload', 'band_gap_color'] },
      };

      const encoder = new KrystalEncoder();
      const krysBlob = await encoder.forgeKrys(renderedPng, signedPayload);

      // Auto-download
      const url = URL.createObjectURL(krysBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${payload.crystalName.replace(/\s+/g, '_')}_v${payload.crystalVersion}.krys`;
      a.click();
      URL.revokeObjectURL(url);

      dispatch({ type: 'PARSE_SUCCESS', payload: signedPayload, imageBlob: krysBlob });
      dispatch({ type: 'VALIDATION_PASS' });
    } catch (e) {
      dispatch({ type: 'CR_DEFECT', errorMessage: String(e) });
    }
  }, []);

  // ── Refract ───────────────────────────────────
  const refract = useCallback(() => {
    dispatch({ type: 'CR_REFRACT' });
    // Actual model call handled in Observatory component
  }, []);

  // ── Cleavage (clean terminate) ────────────────
  const cleavage = useCallback(() => {
    dispatch({ type: 'CR_CLEAVAGE' });
    setTimeout(() => dispatch({ type: 'CLEAN_COMPLETE' }), 600);
  }, []);

  return { runtimeState, dispatch, loadKrys, crystallize, refract, cleavage };
}

// ─────────────────────────────────────────────
// Band Gap security level label helpers
// ─────────────────────────────────────────────

export const BAND_GAP_LABELS: Record<BandGapLevel, string> = {
  safe:       '🟢 安全 (Safe)',
  caution:    '🟡 警告 (Caution)',
  restricted: '🔴 高危 (Restricted)',
  tool:       '🔵 工具 (Tool)',
  multimodal: '🟣 多模态 (Multimodal)',
};
