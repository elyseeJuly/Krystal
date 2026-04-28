/**
 * ForgingPlatform — 铸造台
 * Phase 4: Crystal Studio App
 *
 * Where creators build new Krystal files from scratch.
 * Workflow: fill facets → choose Band Gap → upload sigil image → Crystallize → download .krys
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KipPayload,
  BandGapLevel,
  BAND_GAP_COLORS,
  CrystalTier,
  SigilForge,
} from '../core';
import { BAND_GAP_LABELS } from '../hooks/useCrystalRuntime';

interface ForgingPlatformProps {
  onCrystallize: (payload: KipPayload, sigilBlob?: Blob | null) => Promise<void>;
  isForging: boolean;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const DEFAULT_PAYLOAD: KipPayload = {
  kipVersion:    '0.1',
  crystalId:     generateUUID(),
  crystalName:   '',
  crystalVersion: '1.0.0',
  crystalTier:   1,
  author:        '',
  createdAt:     new Date().toISOString(),
  bandGapLevel:  'safe',
  facets: {
    crown:      { name: '', version: '1.0.0', wakeWord: 'Initialize KIP Protocol' },
    input:      { format: '', schema: {}, description: '' },
    logic:      { systemPrompt: '', chain: [] },
    output:     { format: '', toneTemplate: '' },
    inclusion:  { endpoints: [], knowledgeRefs: [] },
    correction: { fallbackPrompt: '', redundancyCode: '' },
  },
  fingerprint: { algorithm: 'SHA-256', hash: '', covers: ['visual_pixels', 'json_payload', 'band_gap_color'] },
};

export const ForgingPlatform: React.FC<ForgingPlatformProps> = ({ onCrystallize, isForging }) => {
  const [payload, setPayload] = useState<KipPayload>({ ...DEFAULT_PAYLOAD, crystalId: generateUUID() });
  const [sigilBlob, setSigilBlob] = useState<Blob | null>(null);
  const [sigilPreviewUrl, setSigilPreviewUrl] = useState<string | null>(null);
  const [previewCanvasEl, setPreviewCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  // ── Live canvas preview ─────────────────────────────
  const updatePreview = useCallback(async () => {
    const forge = new SigilForge();
    await forge.forge({ payload, sigilImageBlob: sigilBlob });
    const canvas = forge.getCanvas();

    if (canvasWrapRef.current) {
      // Replace old canvas
      const existing = canvasWrapRef.current.querySelector('canvas');
      if (existing) canvasWrapRef.current.removeChild(existing);
      const clone = canvas.cloneNode(true) as HTMLCanvasElement;
      clone.style.width = '100%';
      clone.style.height = '100%';
      clone.style.objectFit = 'contain';
      canvasWrapRef.current.appendChild(clone);
      setPreviewCanvasEl(clone);
    }
  }, [payload, sigilBlob]);

  useEffect(() => {
    const t = setTimeout(updatePreview, 400);
    return () => clearTimeout(t);
  }, [updatePreview]);

  // ── Sigil image upload ──────────────────────────────
  const handleSigilUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSigilBlob(file);
    const url = URL.createObjectURL(file);
    setSigilPreviewUrl(url);
  };

  // ── Field helpers ───────────────────────────────────
  const setField = (path: string[], value: unknown) => {
    setPayload(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as KipPayload;
      let obj: Record<string, unknown> = next as unknown as Record<string, unknown>;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]] as Record<string, unknown>;
      }
      obj[path[path.length - 1]] = value;
      return next;
    });
  };

  const accentColor = BAND_GAP_COLORS[payload.bandGapLevel];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPayload: KipPayload = {
      ...payload,
      createdAt: new Date().toISOString(),
    };
    await onCrystallize(finalPayload, sigilBlob);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="forging-platform"
    >
      {/* ── Left: Form ── */}
      <form className="forging-form-area" onSubmit={handleSubmit}>
        <div>
          <h1 className="forge-title">铸造台 <span style={{ color: accentColor }}>Forging Platform</span></h1>
          <p className="forge-subtitle">将你的 AI 能力结晶为可执行的 .krys 视觉文件</p>
        </div>

        {/* Identity */}
        <div className="facet-section">
          <div className="facet-section-header">
            <span className="facet-badge">[CROWN]</span>
            <span className="facet-title">晶核身份 Crystal Identity</span>
          </div>
          <div className="facet-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="kip-field">
                <label className="kip-label">晶体名称 Crystal Name *</label>
                <input
                  className="kip-input"
                  required
                  placeholder="e.g. Code Reviewer"
                  value={payload.crystalName}
                  onChange={e => setField(['crystalName'], e.target.value)}
                />
              </div>
              <div className="kip-field">
                <label className="kip-label">版本 Version</label>
                <input
                  className="kip-input"
                  placeholder="1.0.0"
                  value={payload.crystalVersion}
                  onChange={e => setField(['crystalVersion'], e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="kip-field">
                <label className="kip-label">作者 Author</label>
                <input
                  className="kip-input"
                  placeholder="Emberois"
                  value={payload.author}
                  onChange={e => setField(['author'], e.target.value)}
                />
              </div>
              <div className="kip-field">
                <label className="kip-label">晶级 Crystal Tier</label>
                <select
                  className="kip-select"
                  value={payload.crystalTier}
                  onChange={e => setField(['crystalTier'], Number(e.target.value) as CrystalTier)}
                >
                  <option value={1}>1 — Pure Crystal (100% Offline)</option>
                  <option value={2}>2 — Enhanced Crystal (Offline)</option>
                  <option value={3}>3 — Connected Crystal (External APIs)</option>
                </select>
              </div>
            </div>
            <div className="kip-field">
              <label className="kip-label">唤醒词 Wake Word</label>
              <input
                className="kip-input"
                placeholder="Initialize KIP Protocol"
                value={payload.facets.crown.wakeWord}
                onChange={e => setField(['facets', 'crown', 'wakeWord'], e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Band Gap */}
        <div className="facet-section">
          <div className="facet-section-header">
            <span className="facet-badge" style={{ borderColor: accentColor, color: accentColor }}>BAND GAP</span>
            <span className="facet-title">带隙安全等级 Security Level</span>
          </div>
          <div className="facet-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
              {(['safe', 'caution', 'restricted', 'tool', 'multimodal'] as BandGapLevel[]).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setField(['bandGapLevel'], level)}
                  style={{
                    background: payload.bandGapLevel === level ? `${BAND_GAP_COLORS[level]}18` : 'transparent',
                    border: `1px solid ${payload.bandGapLevel === level ? BAND_GAP_COLORS[level] : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 6,
                    padding: '8px 10px',
                    color: BAND_GAP_COLORS[level],
                    fontFamily: 'var(--font-code)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: payload.bandGapLevel === level ? `0 0 12px ${BAND_GAP_COLORS[level]}55` : 'none',
                  }}
                >
                  {BAND_GAP_LABELS[level]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logic Facet */}
        <div className="facet-section">
          <div className="facet-section-header">
            <span className="facet-badge">[LOGIC]</span>
            <span className="facet-title">核心逻辑 System Prompt <span style={{ color: 'var(--kip-restricted)', fontSize: '0.68rem' }}>40%</span></span>
          </div>
          <div className="facet-body">
            <div className="kip-field">
              <label className="kip-label">System Prompt *</label>
              <textarea
                className="kip-textarea"
                required
                rows={8}
                placeholder="你是一个专业的代码审查员..."
                value={payload.facets.logic.systemPrompt}
                onChange={e => setField(['facets', 'logic', 'systemPrompt'], e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Input / Output Facets */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="facet-section">
            <div className="facet-section-header">
              <span className="facet-badge">[INPUT]</span>
              <span className="facet-title">输入切面</span>
            </div>
            <div className="facet-body">
              <div className="kip-field">
                <label className="kip-label">输入格式 Format</label>
                <input
                  className="kip-input"
                  placeholder="plaintext / JSON / markdown"
                  value={payload.facets.input.format}
                  onChange={e => setField(['facets', 'input', 'format'], e.target.value)}
                />
              </div>
              <div className="kip-field">
                <label className="kip-label">说明 Description</label>
                <textarea
                  className="kip-textarea"
                  rows={3}
                  placeholder="用户需要提供的内容..."
                  value={payload.facets.input.description as string ?? ''}
                  onChange={e => setField(['facets', 'input', 'description'], e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="facet-section">
            <div className="facet-section-header">
              <span className="facet-badge">[OUTPUT]</span>
              <span className="facet-title">输出切面</span>
            </div>
            <div className="facet-body">
              <div className="kip-field">
                <label className="kip-label">输出格式 Format</label>
                <input
                  className="kip-input"
                  placeholder="markdown / JSON / plaintext"
                  value={payload.facets.output.format}
                  onChange={e => setField(['facets', 'output', 'format'], e.target.value)}
                />
              </div>
              <div className="kip-field">
                <label className="kip-label">语气模板 Tone</label>
                <textarea
                  className="kip-textarea"
                  rows={3}
                  placeholder="专业、简洁、直接..."
                  value={payload.facets.output.toneTemplate}
                  onChange={e => setField(['facets', 'output', 'toneTemplate'], e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Correction Facet */}
        <div className="facet-section">
          <div className="facet-section-header">
            <span className="facet-badge">[CORRECTION]</span>
            <span className="facet-title">容错冗余 Fallback</span>
          </div>
          <div className="facet-body">
            <div className="kip-field">
              <label className="kip-label">离线降级提示词 Fallback Prompt</label>
              <textarea
                className="kip-textarea"
                rows={3}
                placeholder="在无网络环境下的简化执行提示词..."
                value={payload.facets.correction.fallbackPrompt}
                onChange={e => setField(['facets', 'correction', 'fallbackPrompt'], e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isForging}
          style={{ fontSize: '0.9rem', padding: '14px 32px' }}
        >
          {isForging
            ? <><span className="anim-spin">⟳</span> 结晶中 Crystallizing…</>
            : <>💎 结晶 Crystallize — 生成 .krys 文件</>
          }
        </button>
      </form>

      {/* ── Right: Preview + Sigil ── */}
      <div className="forging-preview-area">
        {/* Sigil upload */}
        <div className="kip-panel">
          <label className="kip-label" style={{ marginBottom: 8, display: 'block' }}>晶核图像 Core Sigil Image (可选)</label>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: `1px dashed var(--border-medium)`,
              borderRadius: 8,
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              aspectRatio: '1',
              background: 'var(--bg-deep)',
              overflow: 'hidden',
            }}
          >
            {sigilPreviewUrl
              ? <img src={sigilPreviewUrl} alt="sigil" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
              : <>
                  <span style={{ fontSize: '2rem', opacity: 0.3 }}>🖼</span>
                  <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>上传晶核图像</span>
                </>
            }
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSigilUpload} />
          </label>
        </div>

        {/* Canvas preview */}
        <div className="preview-card">
          <div className="preview-card-header">
            <span>实时预览 Live Preview</span>
            <span className="kip-badge" style={{ borderColor: accentColor, color: accentColor }}>
              {payload.bandGapLevel.toUpperCase()}
            </span>
          </div>
          <div className="preview-canvas-wrap" ref={canvasWrapRef} style={{ minHeight: 300 }}>
            {!previewCanvasEl && (
              <div className="preview-placeholder">
                <span className="gem-icon">💎</span>
                <span>填写表单后预览将自动更新</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
