/**
 * Observatory — 观测站
 * Phase 4: Crystal Studio App
 *
 * Load any .krys file, decode it, validate integrity,
 * then refract through a connected AI model.
 *
 * KIP Level 2 Full Conformance:
 *   - Dark Track + Light Track OCR fallback
 *   - Offline Tier 3 degradation
 *   - AI model adapter (OpenAI / Gemini / Web-LLM / Custom)
 *   - Recrystallize workflow
 *
 * Author: Emberois | SPEC-KIP-0.1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type KipPayload, BAND_GAP_COLORS, type BandGapLevel } from '../core';
import { BAND_GAP_LABELS, type AIModelConfig, type AIModelProvider, type RefractResult, type LightTrackResult } from '../hooks/useCrystalRuntime';

interface ObservatoryProps {
  runtimeState: {
    state: string;
    payload: KipPayload | null;
    imageBlob: Blob | null;
    errorMessage: string | null;
    isOffline: boolean;
  };
  onLoad: (file: File) => Promise<void>;
  onRefract: (userInput?: string) => Promise<void>;
  onCleavage: () => void;
  tryLightTrack: (ocrText: string) => LightTrackResult | null;
  lightTrackResult: LightTrackResult | null;
  refractResult: RefractResult | null;
  isRefracting: boolean;
  onRecrystallize: (payload: KipPayload) => void;
  modelConfig: AIModelConfig;
  setModelConfig: (config: AIModelConfig) => void;
}

const STATE_COLORS: Record<string, string> = {
  IDLE:       'var(--text-muted)',
  MOUNTING:   'var(--kip-tool)',
  VALIDATING: 'var(--kip-caution)',
  DISPERSING: 'var(--kip-multimodal)',
  REFRACTING: 'var(--kip-safe)',
  COMPLETE:   'var(--kip-safe)',
  DEFECT:     'var(--kip-restricted)',
  MISMATCH:   'var(--kip-restricted)',
  CLEAVAGE:   'var(--text-muted)',
};

const STATE_LABELS: Record<string, string> = {
  IDLE:       'IDLE — 初始',
  MOUNTING:   '挂载中 MOUNTING',
  VALIDATING: '晶格校验 VALIDATING',
  DISPERSING: '色散中 DISPERSING',
  REFRACTING: '折射中 REFRACTING',
  COMPLETE:   '完成 COMPLETE',
  DEFECT:     '晶格缺陷 DEFECT',
  MISMATCH:   '🚨 晶格失配 MISMATCH',
  CLEAVAGE:   '解理 CLEAVAGE',
};

const PROVIDER_LABELS: Record<AIModelProvider, string> = {
  openai:  'OpenAI',
  gemini:  'Gemini',
  webllm:  'Web-LLM',
  custom:  'Custom',
};

export const Observatory: React.FC<ObservatoryProps> = ({
  runtimeState,
  onLoad,
  onRefract,
  onCleavage,
  tryLightTrack,
  lightTrackResult,
  refractResult,
  isRefracting,
  onRecrystallize,
  modelConfig,
  setModelConfig,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [openFacets, setOpenFacets] = useState<Record<string, boolean>>({});
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [showModelConfig, setShowModelConfig] = useState(false);

  const { payload, state, isOffline } = runtimeState;

  const handleFile = useCallback(async (file: File) => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    setUserInput('');
    setOcrText('');
    await onLoad(file);
  }, [onLoad, imagePreviewUrl]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const toggleFacet = (key: string) =>
    setOpenFacets(p => ({ ...p, [key]: !p[key] }));

  // ── Light Track OCR fallback ──────────────────
  const handleOcrSubmit = () => {
    tryLightTrack(ocrText);
  };

  // ── Refract with user input ───────────────────
  const handleRefract = async () => {
    await onRefract(userInput || undefined);
  };

  const accentColor = payload ? BAND_GAP_COLORS[payload.bandGapLevel as BandGapLevel] : 'var(--kip-safe)';

  const facetEntries = payload ? [
    { key: 'crown',      label: '[CROWN] 晶核身份',   content: JSON.stringify(payload.facets.crown, null, 2) },
    { key: 'input',      label: '[INPUT] 输入切面',   content: JSON.stringify(payload.facets.input, null, 2) },
    { key: 'logic',      label: '[LOGIC] 核心逻辑 ★', content: payload.facets.logic.systemPrompt },
    { key: 'output',     label: '[OUTPUT] 输出切面',  content: JSON.stringify(payload.facets.output, null, 2) },
    { key: 'inclusion',  label: '[INCLUSION] 包裹体', content: JSON.stringify(payload.facets.inclusion, null, 2) },
    { key: 'correction', label: '[CORRECTION] 容错层', content: payload.facets.correction.fallbackPrompt || '(empty)' },
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="observatory"
    >
      {/* Header */}
      <div className="observatory-header">
        <h1>观测站 <span style={{ color: 'var(--kip-multimodal)' }}>Observatory</span></h1>
        <p className="text-secondary" style={{ fontFamily: 'var(--font-code)', fontSize: '0.82rem' }}>
          加载 .krys 晶体文件，校验完整性，折射执行 AI 能力
        </p>
      </div>

      {/* Offline indicator */}
      {isOffline && (
        <div className="kip-panel" style={{ borderColor: 'var(--kip-caution)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>🟡</span>
          <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.8rem', color: 'var(--kip-caution)' }}>
            当前处于离线状态 — 仅 Tier 1 & 2 晶体可完整折射
          </span>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`drop-zone${dragOver ? ' drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input type="file" accept=".krys,image/png" onChange={handleInputChange} />
        {imagePreviewUrl
          ? <img src={imagePreviewUrl} alt="krystal" style={{ maxHeight: 160, maxWidth: '80%', borderRadius: 8, objectFit: 'contain' }} />
          : <span className="drop-zone-icon">💎</span>
        }
        <h3>拖入 .krys 文件或点击上传</h3>
        <p>支持 .krys / .png · 自动识别 KIP 暗轨数据</p>
      </div>

      {/* Light Track OCR fallback — shown when dark track fails */}
      {state === 'DEFECT' && runtimeState.errorMessage?.includes('Light Track') && (
        <motion.div
          className="kip-panel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ borderColor: 'var(--kip-caution)' }}
        >
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', marginBottom: 8, color: 'var(--kip-caution)' }}>
            ◆ 明轨降级 Light Track Fallback
          </h4>
          <p style={{ fontFamily: 'var(--font-code)', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            暗轨数据不可读（可能已被压缩）。请将图片通过 OCR 提取文本后粘贴到下方，系统将尝试从文本锚点恢复晶体数据。
          </p>
          <div className="kip-field" style={{ marginBottom: 8 }}>
            <label className="kip-label">OCR 提取文本</label>
            <textarea
              className="kip-textarea"
              rows={5}
              placeholder="粘贴从图片中 OCR 提取的文本…&#10;系统将搜索 [CROWN] [INPUT] [LOGIC] [OUTPUT] [INCLUSION] [CORRECTION] 锚点"
              value={ocrText}
              onChange={e => setOcrText(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleOcrSubmit} type="button" style={{ fontSize: '0.78rem' }}>
            ▷ 解析明轨 Parse Light Track
          </button>

          {lightTrackResult && Object.keys(lightTrackResult).length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ marginTop: 12, background: 'var(--bg-deep)', borderRadius: 'var(--r-sm)', padding: 12, fontFamily: 'var(--font-code)', fontSize: '0.75rem', color: 'var(--text-secondary)', maxHeight: 200, overflowY: 'auto' }}
            >
              <div style={{ color: 'var(--kip-safe)', marginBottom: 6 }}>明轨解析结果 (≥70% 核心逻辑恢复):</div>
              {Object.entries(lightTrackResult).map(([key, val]) => {
                const text = val ?? '';
                return (
                <div key={key} style={{ marginBottom: 4 }}>
                  <span style={{ color: accentColor }}>[{key.toUpperCase()}]</span> {text.slice(0, 120)}{text.length > 120 ? '…' : ''}
                </div>
              )})}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* State strip */}
      <div className="state-strip">
        <span>Crystal Runtime</span>
        <span className="state-pill" style={{ borderColor: STATE_COLORS[state], color: STATE_COLORS[state] }}>
          {STATE_LABELS[state] ?? state}
        </span>
        {(state === 'MOUNTING' || state === 'VALIDATING' || state === 'REFRACTING') && (
          <span className="anim-pulse" style={{ color: accentColor }}>⬡</span>
        )}
      </div>

      {/* Crystal Info */}
      <AnimatePresence>
        {payload && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Meta grid */}
            <div className="crystal-info-grid">
              <div className="crystal-info-item">
                <label>晶体名称</label>
                <span className="value" style={{ fontFamily: 'var(--font-display)', color: accentColor }}>
                  {payload.crystalName}
                </span>
              </div>
              <div className="crystal-info-item">
                <label>版本</label>
                <span className="value">{payload.crystalVersion}</span>
              </div>
              <div className="crystal-info-item">
                <label>作者</label>
                <span className="value">{payload.author || '—'}</span>
              </div>
              <div className="crystal-info-item">
                <label>晶级 Tier</label>
                <span className="value">Tier {payload.crystalTier}</span>
              </div>
              <div className="crystal-info-item">
                <label>带隙等级 Band Gap</label>
                <span className="value">
                  <span className="kip-badge" style={{ borderColor: accentColor, color: accentColor }}>
                    {BAND_GAP_LABELS[payload.bandGapLevel as BandGapLevel]}
                  </span>
                </span>
              </div>
              <div className="crystal-info-item">
                <label>KIP 版本</label>
                <span className="value">v{payload.kipVersion}</span>
              </div>
            </div>

            {/* Facet accordion — 色散 (Dispersion) */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', marginBottom: 8, color: 'var(--kip-multimodal)' }}>
                ◆ 色散 Dispersion — 六晶面展开
              </h3>
              <div className="facet-accordion">
                {facetEntries.map(({ key, label, content }) => (
                  <div className="facet-accordion-item" key={key}>
                    <button
                      className="facet-accordion-trigger"
                      onClick={() => toggleFacet(key)}
                      type="button"
                    >
                      <span style={{ color: accentColor }}>{label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{openFacets[key] ? '▲' : '▼'}</span>
                    </button>
                    <AnimatePresence>
                      {openFacets[key] && (
                        <motion.div
                          className="facet-accordion-content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          {content}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Model Config */}
            <div>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setShowModelConfig(!showModelConfig)}
                style={{ fontSize: '0.72rem', padding: '6px 14px' }}
              >
                {showModelConfig ? '▲' : '▼'} AI 模型配置 Model Config
              </button>
              <AnimatePresence>
                {showModelConfig && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div className="kip-field">
                          <label className="kip-label">Provider</label>
                          <select
                            className="kip-select"
                            value={modelConfig.provider}
                            onChange={e => setModelConfig({ ...modelConfig, provider: e.target.value as AIModelProvider })}
                          >
                            {(['openai', 'gemini', 'webllm', 'custom'] as AIModelProvider[]).map(p => (
                              <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
                            ))}
                          </select>
                        </div>
                        <div className="kip-field">
                          <label className="kip-label">Model Name</label>
                          <input
                            className="kip-input"
                            placeholder="gpt-4o / gemini-2.0-flash"
                            value={modelConfig.modelName ?? ''}
                            onChange={e => setModelConfig({ ...modelConfig, modelName: e.target.value })}
                          />
                        </div>
                      </div>
                      {(modelConfig.provider === 'openai' || modelConfig.provider === 'gemini') && (
                        <div className="kip-field">
                          <label className="kip-label">API Key</label>
                          <input
                            className="kip-input"
                            type="password"
                            placeholder="sk-..."
                            value={modelConfig.apiKey ?? ''}
                            onChange={e => setModelConfig({ ...modelConfig, apiKey: e.target.value })}
                          />
                        </div>
                      )}
                      <div className="kip-field">
                        <label className="kip-label">Base URL (optional)</label>
                        <input
                          className="kip-input"
                          placeholder="https://api.openai.com/v1"
                          value={modelConfig.baseUrl ?? ''}
                          onChange={e => setModelConfig({ ...modelConfig, baseUrl: e.target.value })}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User input for refraction */}
            <div className="kip-field">
              <label className="kip-label">折射输入 Refraction Input</label>
              <textarea
                className="kip-textarea"
                rows={3}
                placeholder="输入要传递给晶体的数据…"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
              />
            </div>

            {/* Refract actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="refract-area">
                <button
                  className="btn btn-primary"
                  onClick={handleRefract}
                  disabled={isRefracting || !['DISPERSING', 'COMPLETE'].includes(state)}
                  type="button"
                >
                  {isRefracting
                    ? <><span className="anim-spin">⟳</span> 折射中 Refracting…</>
                    : '▷ 折射 Refract — 执行晶体'}
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => onRecrystallize(payload!)}
                  style={{ fontSize: '0.78rem' }}
                >
                  ⟳ 重结晶 Recrystallize
                </button>
                <button className="btn btn-ghost" onClick={onCleavage} type="button">
                  ✕ 解理 Cleavage
                </button>
              </div>

              {/* Refract result */}
              <AnimatePresence>
                {refractResult && (
                  <motion.div
                    className="refract-result"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span>模型: {refractResult.model}</span>
                      <span>{new Date(refractResult.timestamp).toLocaleString()}</span>
                    </div>
                    {refractResult.output}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};