/**
 * useCrystalRuntime — Master Runtime Hook
 * Wraps the Crystal Runtime state machine and exposes
 * all lifecycle actions to React components.
 *
 * Supports KIP Level 2 Full Conformance:
 *   - Dark Track + Light Track dual-track parsing
 *   - Offline Tier 3 degradation via Correction Facet
 *   - Recrystallize (edit existing .krys)
 *   - AI model refraction (OpenAI / Gemini / Web-LLM adapter)
 *
 * Author: Emberois | SPEC-KIP-0.1
 */

import { useReducer, useCallback, useEffect, useState } from 'react';
import {
  crystalReducer,
  initialCrystalState,
  type CrystalAction,
} from '../core/CrystalRuntime';
import {
  KrystalDecoder,
  KrystalEncoder,
  XtalValidator,
  SigilForge,
  parseLightTrack,
  type KipPayload,
  type BandGapLevel,
  type CrystalRuntimeState,
  type LightTrackResult,
} from '../core';

export type { LightTrackResult } from '../core';

export type AIModelProvider = 'openai' | 'gemini' | 'webllm' | 'custom';

export interface AIModelConfig {
  provider: AIModelProvider;
  apiKey?: string;
  baseUrl?: string;
  modelName?: string;
}

export interface RefractResult {
  output: string;
  model: string;
  timestamp: string;
}

// ─────────────────────────────────────────────
// Hook return type
// ─────────────────────────────────────────────

export interface UseCrystalRuntimeReturn {
  runtimeState: CrystalRuntimeState;
  dispatch: React.Dispatch<CrystalAction>;
  loadKrys: (file: File) => Promise<void>;
  crystallize: (payload: KipPayload, sigilBlob?: Blob | null) => Promise<void>;
  refract: (userInput?: string) => Promise<RefractResult | null>;
  cleavage: () => void;
  tryLightTrack: (ocrText: string) => LightTrackResult | null;
  lightTrackResult: LightTrackResult | null;
  recrystallizePayload: KipPayload | null;
  refractResult: RefractResult | null;
  isRefracting: boolean;
  modelConfig: AIModelConfig;
  setModelConfig: (config: AIModelConfig) => void;
}

export function useCrystalRuntime(): UseCrystalRuntimeReturn {
  const [runtimeState, dispatch] = useReducer(crystalReducer, initialCrystalState);
  const [lightTrackResult, setLightTrackResult] = useState<LightTrackResult | null>(null);
  const [refractResult, setRefractResult] = useState<RefractResult | null>(null);
  const [isRefracting, setIsRefracting] = useState(false);
  const [recrystallizePayload, setRecrystallizePayload] = useState<KipPayload | null>(null);
  const [modelConfig, setModelConfig] = useState<AIModelConfig>({
    provider: 'openai',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-4o',
  });

  // ── Detect offline status ─────────────────────
  useEffect(() => {
    const update = () =>
      dispatch({ type: 'CR_DETECT_OFFLINE', isOffline: !navigator.onLine } as CrystalAction);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // ── Load existing .krys file ──────────────────
  const loadKrys = useCallback(async (file: File) => {
    dispatch({ type: 'CR_CRYSTALLIZE' });
    setLightTrackResult(null);
    setRefractResult(null);
    setRecrystallizePayload(null);

    try {
      const decoder = new KrystalDecoder();
      const payload = await decoder.decode(file);

      if (!payload) {
        dispatch({
          type: 'CR_DEFECT',
          errorMessage: '[KrystalDecoder] Dark track unreadable — no valid KIP payload found. You may attempt Light Track OCR fallback below.',
        });
        return;
      }

      dispatch({ type: 'PARSE_SUCCESS', payload, imageBlob: file });
      setRecrystallizePayload(payload);

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

  // ── Light Track fallback ──────────────────────
  const tryLightTrack = useCallback((ocrText: string): LightTrackResult | null => {
    const result = parseLightTrack(ocrText);
    if (Object.keys(result).length === 0) {
      setLightTrackResult(null);
      return null;
    }
    setLightTrackResult(result);
    return result;
  }, []);

  // ── Crystallize (forge new .krys) ─────────────
  const crystallize = useCallback(async (payload: KipPayload, sigilBlob?: Blob | null) => {
    dispatch({ type: 'CR_CRYSTALLIZE' });
    setLightTrackResult(null);
    setRefractResult(null);

    try {
      const forge = new SigilForge();
      const renderedPng = await forge.forge({ payload, sigilImageBlob: sigilBlob });

      const validator = new XtalValidator();
      const hash = await validator.computeFingerprint(renderedPng, payload);
      const signedPayload: KipPayload = {
        ...payload,
        fingerprint: { algorithm: 'SHA-256', hash, covers: ['visual_pixels', 'json_payload', 'band_gap_color'] },
      };

      const encoder = new KrystalEncoder();
      const krysBlob = await encoder.forgeKrys(renderedPng, signedPayload);

      const url = URL.createObjectURL(krysBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${payload.crystalName.replace(/\s+/g, '_')}_v${payload.crystalVersion}.krys`;
      a.click();
      URL.revokeObjectURL(url);

      dispatch({ type: 'PARSE_SUCCESS', payload: signedPayload, imageBlob: krysBlob });
      dispatch({ type: 'VALIDATION_PASS' });
      setRecrystallizePayload(signedPayload);
    } catch (e) {
      dispatch({ type: 'CR_DEFECT', errorMessage: String(e) });
    }
  }, []);

  // ── Refract — execute through AI model ────────
  const refract = useCallback(async (userInput?: string): Promise<RefractResult | null> => {
    const payload = runtimeState.payload;
    if (!payload) return null;

    dispatch({ type: 'CR_REFRACT' });
    setIsRefracting(true);

    try {
      // ── Offline Tier 3 degradation ──────────────
      if (!navigator.onLine && payload.crystalTier === 3) {
        const fallback = payload.facets.correction.fallbackPrompt;
        if (fallback) {
          const result: RefractResult = {
            output: `[离线降级模式 — Offline Tier 3 Degradation]\n\n晶体: ${payload.crystalName} v${payload.crystalVersion}\n` +
                    `晶级: Tier 3 (Connected Crystal)\n` +
                    `当前状态: 离线 — 已启用 Correction Facet 本地降级路径\n\n` +
                    `--- Fallback Prompt ---\n${fallback}\n\n` +
                    `提示: 此晶体包含外部 API 依赖 (Inclusion)，离线状态下仅能执行降级逻辑。`,
            model: 'offline-degradation',
            timestamp: new Date().toISOString(),
          };
          setRefractResult(result);
          dispatch({ type: 'REFRACT_COMPLETE' });
          setIsRefracting(false);
          return result;
        }
        throw new Error('Tier 3 Crystal offline with no Correction Facet fallback — cannot refract.');
      }

      const config = modelConfig;
      const systemPrompt = payload.facets.logic.systemPrompt;
      const inputText = userInput ?? 'Execute the crystal capability.';
      let output: string;

      switch (config.provider) {
        case 'openai': {
          if (!config.apiKey) throw new Error('OpenAI API key not configured.');
          const resp = await fetch(`${config.baseUrl ?? 'https://api.openai.com/v1'}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: config.modelName ?? 'gpt-4o',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: inputText },
              ],
              temperature: 0.7,
              max_tokens: 2048,
            }),
          });
          if (!resp.ok) throw new Error(`OpenAI API error: ${resp.status} ${resp.statusText}`);
          const data = await resp.json();
          output = data.choices?.[0]?.message?.content ?? JSON.stringify(data);
          break;
        }
        case 'gemini': {
          if (!config.apiKey) throw new Error('Gemini API key not configured.');
          const geminiUrl = `${config.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta'}/models/${config.modelName ?? 'gemini-2.0-flash'}:generateContent?key=${config.apiKey}`;
          const resp = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${inputText}` }] }],
            }),
          });
          if (!resp.ok) throw new Error(`Gemini API error: ${resp.status} ${resp.statusText}`);
          const data = await resp.json();
          output = data.candidates?.[0]?.content?.parts?.[0]?.text ?? JSON.stringify(data);
          break;
        }
        case 'webllm':
        case 'custom': {
          output = `[本地模型折射 — Local ${config.provider === 'webllm' ? 'Web-LLM' : 'Custom'} Model]\n\n` +
                   `晶体: ${payload.crystalName} v${payload.crystalVersion}\n` +
                   `模型: ${config.modelName ?? 'local'}\n` +
                   `--- System Prompt Preview ---\n${systemPrompt.slice(0, 500)}${systemPrompt.length > 500 ? '…' : ''}\n\n` +
                   `[注意] 本地模型折射需在浏览器中集成 Web-LLM 运行时。当前为模拟输出。`;
          break;
        }
        default:
          throw new Error(`Unknown AI provider: ${config.provider}`);
      }

      const result: RefractResult = {
        output,
        model: config.modelName ?? config.provider,
        timestamp: new Date().toISOString(),
      };
      setRefractResult(result);
      dispatch({ type: 'REFRACT_COMPLETE' });
      setIsRefracting(false);
      return result;
    } catch (e) {
      const errorMsg = `[折射异常 Lattice Defect] ${e instanceof Error ? e.message : String(e)}`;
      dispatch({ type: 'CR_DEFECT', errorMessage: errorMsg });
      setIsRefracting(false);
      return null;
    }
  }, [runtimeState.payload, modelConfig]);

  // ── Cleavage (clean terminate) ────────────────
  const cleavage = useCallback(() => {
    dispatch({ type: 'CR_CLEAVAGE' });
    setLightTrackResult(null);
    setRefractResult(null);
    setIsRefracting(false);
    setTimeout(() => dispatch({ type: 'CLEAN_COMPLETE' }), 600);
  }, []);

  return {
    runtimeState,
    dispatch,
    loadKrys,
    crystallize,
    refract,
    cleavage,
    tryLightTrack,
    lightTrackResult,
    recrystallizePayload,
    refractResult,
    isRefracting,
    modelConfig,
    setModelConfig,
  };
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