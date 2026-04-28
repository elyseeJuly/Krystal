/**
 * Observatory — 观测站
 * Phase 4: Crystal Studio App
 *
 * Load any .krys file, decode it, validate integrity,
 * then refract through a connected AI model.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KipPayload, BAND_GAP_COLORS, BandGapLevel } from '../core';
import { BAND_GAP_LABELS } from '../hooks/useCrystalRuntime';

interface ObservatoryProps {
  runtimeState: {
    state: string;
    payload: KipPayload | null;
    imageBlob: Blob | null;
    errorMessage: string | null;
    isOffline: boolean;
  };
  onLoad: (file: File) => Promise<void>;
  onRefract: () => void;
  onCleavage: () => void;
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

export const Observatory: React.FC<ObservatoryProps> = ({
  runtimeState,
  onLoad,
  onRefract,
  onCleavage,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [openFacets, setOpenFacets] = useState<Record<string, boolean>>({});
  const [refractResult, setRefractResult] = useState<string>('');
  const [isRefracting, setIsRefracting] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const { payload, state, isOffline } = runtimeState;

  const handleFile = useCallback(async (file: File) => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    setRefractResult('');
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

  // Simulate refraction (actual model call would go here)
  const handleRefract = async () => {
    if (!payload) return;
    onRefract();
    setIsRefracting(true);
    // Simulate AI response
    await new Promise(r => setTimeout(r, 1800));
    setRefractResult(
      `[折射结果 — Refraction Output]\n\n` +
      `晶体: ${payload.crystalName} v${payload.crystalVersion}\n` +
      `作者: ${payload.author}\n` +
      `系统提示词已注入模型。\n\n` +
      `--- System Prompt Preview ---\n` +
      `${payload.facets.logic.systemPrompt.slice(0, 300)}${payload.facets.logic.systemPrompt.length > 300 ? '…' : ''}`
    );
    setIsRefracting(false);
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

      {/* State strip */}
      <div className="state-strip">
        <span>Crystal Runtime</span>
        <span className="state-pill" style={{ borderColor: STATE_COLORS[state], color: STATE_COLORS[state] }}>
          {STATE_LABELS[state] ?? state}
        </span>
        {(state === 'MOUNTING' || state === 'VALIDATING') && (
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
                <button className="btn btn-ghost" onClick={onCleavage} type="button">
                  ✕ 解理 Cleavage
                </button>
              </div>

              {refractResult && (
                <motion.div
                  className="refract-result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {refractResult}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
