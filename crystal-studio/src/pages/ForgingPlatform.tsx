/**
 * ForgingPlatform — 铸造台
 * Phase 4: Crystal Studio App
 *
 * Where creators build new Krystal files from scratch.
 * Supports Quick Import: paste text/upload document → auto-parse → one-click Crystallize
 *
 * KIP Level 2 Full Conformance
 * Author: Emberois | SPEC-KIP-0.1
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type KipPayload,
  type BandGapLevel,
  BAND_GAP_COLORS,
  type CrystalTier,
  SigilForge,
} from '../core';
import { BAND_GAP_LABELS } from '../hooks/useCrystalRuntime';

interface ForgingPlatformProps {
  onCrystallize: (payload: KipPayload, sigilBlob?: Blob | null) => Promise<void>;
  isForging: boolean;
  recrystallizePayload?: KipPayload | null;
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

// ─────────────────────────────────────────────
// Auto-Parser: text → KipPayload fields
// ─────────────────────────────────────────────

const FORMAT_KEYWORDS: Array<{ pattern: RegExp; format: string }> = [
  { pattern: /\bjson\b/i,             format: 'JSON' },
  { pattern: /\bmarkdown\b|\bmd\b/i,   format: 'Markdown' },
  { pattern: /\byaml\b/i,              format: 'YAML' },
  { pattern: /\bcsv\b/i,               format: 'CSV' },
  { pattern: /\bhtml?\b/i,             format: 'HTML' },
  { pattern: /\bxml\b/i,               format: 'XML' },
  { pattern: /\bsql\b/i,               format: 'SQL' },
  { pattern: /\bpython\b|\bpy\b/i,     format: 'Python Code' },
  { pattern: /\bjavascript\b|\bjs\b/i, format: 'JavaScript/TypeScript Code' },
  { pattern: /\bapi\b|\brest\b|\bgraphql\b/i, format: 'API Response' },
  { pattern: /\bprompt\b|指令|你是一个|你是一名|你是一位/i, format: 'Plaintext — Instruction' },
];

const TIER_KEYWORDS: Array<{ pattern: RegExp; tier: CrystalTier }> = [
  { pattern: /\bapi[\s_-]?key(?=[\s_=:]|$)|https?:\/\/|api\.|网络|online|联网/i, tier: 3 },
  { pattern: /文件系统|fs\.|本地|local|离线|offline/i,                               tier: 2 },
];

const WAKE_WORD_PREFIXES = [
  'Initialize', 'Activate', 'Engage', 'Deploy', 'Crystallize', 'Summon',
];

function detectFormat(text: string): string {
  for (const { pattern, format } of FORMAT_KEYWORDS) {
    if (pattern.test(text)) return format;
  }
  return 'Plaintext';
}

function detectTier(text: string): CrystalTier {
  for (const { pattern, tier } of TIER_KEYWORDS) {
    if (pattern.test(text)) return tier;
  }
  return 1;
}

function detectBandGap(text: string): BandGapLevel {
  if (/高危|危险|删除|destroy|delete|rm\s+-rf|高危权限/i.test(text)) return 'restricted';
  if (/\bapi[\s_-]?key(?=[\s_=:]|$)|密码|password|token|secret|https?:\/\/|外部|external/i.test(text)) return 'caution';
  if (/图片|图像|image|audio|视频|video|multimodal|多模态/i.test(text)) return 'multimodal';
  if (/(?:^|[\s_])tool(?=[\s_]|$)|工具|函数|function|command/i.test(text)) return 'tool';
  return 'safe';
}

function detectEndpoints(text: string): string[] {
  const urls: string[] = [];
  const urlRegex = /https?:\/\/[^\s"'\]\)，,。；;]+/g;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    urls.push(match[0]);
  }
  return [...new Set(urls)];
}

function extractName(text: string, fileName?: string): string {
  // Use file name without extension
  if (fileName) {
    const name = fileName.replace(/\.(txt|md|json|yaml|yml|csv|html|xml|py|js|ts)$/i, '');
    if (name.length > 0 && name.length <= 60) return name;
  }
  // Use first non-empty line
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length > 0) {
    const first = lines[0].replace(/^[#\-\*>\s]+/, '').trim().slice(0, 60);
    if (first.length > 0) return first;
  }
  return `Krystal-${Date.now().toString(36)}`;
}

function extractFirstLine(text: string): string {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  return lines.length > 0 ? lines[0].trim().slice(0, 80) : '';
}

function parseTextToPayload(inputText: string, fileName?: string): KipPayload {
  const name = extractName(inputText, fileName);
  const bandGapLevel = detectBandGap(inputText);
  const crystalTier = detectTier(inputText);
  const format = detectFormat(inputText);
  const endpoints = detectEndpoints(inputText);
  const firstLine = extractFirstLine(inputText);

  // Generate wake word from name
  const prefix = WAKE_WORD_PREFIXES[Math.floor(Math.random() * WAKE_WORD_PREFIXES.length)];
  const wakeWord = `${prefix} ${name.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, ' ').trim().split(/\s+/).slice(0, 3).join(' ')}`;

  // Build system prompt from content
  const systemPrompt = inputText.length > 4000
    ? inputText.slice(0, 4000) + '\n\n[注: 内容已截断至前 4000 字符]'
    : inputText;

  return {
    ...DEFAULT_PAYLOAD,
    crystalId: generateUUID(),
    crystalName: name,
    crystalTier,
    author: '',
    bandGapLevel,
    facets: {
      crown: { name, version: '1.0.0', wakeWord },
      input: { format, schema: {}, description: firstLine ? `用户输入: ${firstLine}` : '用户提供的输入内容' },
      logic: { systemPrompt, chain: [] },
      output: { format, toneTemplate: `基于系统指令以${format}格式输出。保持专业、清晰、简洁。` },
      inclusion: { endpoints, knowledgeRefs: [] },
      correction: { fallbackPrompt: `[离线降级] ${name} — 当前处于离线状态，使用简化逻辑执行。`, redundancyCode: '' },
    },
  };
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export const ForgingPlatform: React.FC<ForgingPlatformProps> = ({ onCrystallize, isForging, recrystallizePayload }) => {
  const [payload, setPayload] = useState<KipPayload>(() =>
    recrystallizePayload
      ? { ...recrystallizePayload, crystalId: generateUUID() }
      : { ...DEFAULT_PAYLOAD, crystalId: generateUUID() }
  );
  const [sigilBlob, setSigilBlob] = useState<Blob | null>(null);
  const [sigilPreviewUrl, setSigilPreviewUrl] = useState<string | null>(null);
  const [previewCanvasEl, setPreviewCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const isRecrystallize = !!recrystallizePayload;

  // Quick import state
  const [quickMode, setQuickMode] = useState(true);
  const [importText, setImportText] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── Live canvas preview ─────────────────────────────
  const updatePreview = useCallback(async () => {
    const forge = new SigilForge();
    await forge.forge({ payload, sigilImageBlob: sigilBlob });
    const canvas = forge.getCanvas();

    if (canvasWrapRef.current) {
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

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const finalPayload: KipPayload = {
      ...payload,
      createdAt: new Date().toISOString(),
    };
    await onCrystallize(finalPayload, sigilBlob);
  };

  // ── Quick Import: file upload ───────────────────────
  const handleFileImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setImportText(text);
      setImportFileName(file.name);

      const parsed = parseTextToPayload(text, file.name);
      setPayload(parsed);
      setImportSuccess(true);
      setQuickMode(false);
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const handleImportFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.[0]) return;
    handleFileImport(files[0]);
  };

  // ── Quick Import: text ──────────────────────────────
  const handleImportText = () => {
    if (!importText.trim()) return;
    const parsed = parseTextToPayload(importText, importFileName || undefined);
    setPayload(parsed);
    setImportSuccess(true);
    setQuickMode(false);
  };

  // ── Drag & drop file onto import area ───────────────
  const [dragOver, setDragOver] = useState(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      /\.(txt|md|json|yaml|yml|csv|html|xml|py|js|ts)$/i.test(f.name)
    );
    if (files.length > 0) handleFileImport(files[0]);
  };

  // ── Reset ───────────────────────────────────────────
  const handleReset = () => {
    setQuickMode(true);
    setImportText('');
    setImportFileName('');
    setImportSuccess(false);
    setShowAdvanced(false);
    setPayload({ ...DEFAULT_PAYLOAD, crystalId: generateUUID() });
    setSigilBlob(null);
    setSigilPreviewUrl(null);
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
          <h1 className="forge-title">
            {isRecrystallize ? '重结晶 ' : '铸造台 '}
            <span style={{ color: accentColor }}>
              {isRecrystallize ? 'Recrystallize' : 'Forging Platform'}
            </span>
          </h1>
          <p className="forge-subtitle">
            {isRecrystallize
              ? '基于已有晶体进行版本迭代，更新切面参数后重新结晶'
              : quickMode
                ? '粘贴文本或上传文档 → 一键自动生成晶体结构'
                : '已解析完成，可切换高级模式微调各切面参数'}
          </p>
        </div>

        {/* ════════════════════════════════════════════════
            QUICK IMPORT PANEL
            ════════════════════════════════════════════════ */}
        {(quickMode || isRecrystallize) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="facet-section"
            style={{
              borderColor: 'var(--kip-tool)',
              boxShadow: '0 0 20px rgba(41,121,255,0.08)',
            }}
          >
            <div className="facet-section-header">
              <span className="facet-badge" style={{ borderColor: 'var(--kip-tool)', color: 'var(--kip-tool)' }}>
                ⚡ QUICK
              </span>
              <span className="facet-title">快速导入 Quick Import</span>
              {!quickMode && (
                <button type="button" className="btn btn-ghost" onClick={handleReset} style={{ fontSize: '0.65rem', padding: '2px 10px' }}>
                  重新导入
                </button>
              )}
            </div>
            <div className="facet-body">
              {quickMode && (
                <>
                  {/* Text area */}
                  <div className="kip-field">
                    <label className="kip-label">
                      粘贴内容或需求描述
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.7rem', marginLeft: 8 }}>
                        支持: 需求文档 / 提示词 / 功能描述 / 代码说明 等
                      </span>
                    </label>
                    <textarea
                      className="kip-textarea"
                      rows={10}
                      placeholder={`将你的文档、需求或提示词粘贴在这里…\n\n例如:\n你是一个代码审查专家，专门审查 TypeScript 项目。\n每次审查时，你需要检查：\n1. 类型安全\n2. 边界条件\n3. 性能问题\n4. 代码风格\n\n输出格式为 Markdown 报告。`}
                      value={importText}
                      onChange={e => setImportText(e.target.value)}
                      style={{ fontSize: '0.82rem', lineHeight: 1.6 }}
                    />
                  </div>

                  {/* File upload */}
                  <div
                    className={`drop-zone${dragOver ? ' drag-over' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    style={{ minHeight: 80, marginTop: 8, marginBottom: 12 }}
                  >
                    <input
                      type="file"
                      accept=".txt,.md,.json,.yaml,.yml,.csv,.html,.xml,.py,.js,.ts"
                      onChange={handleImportFileInput}
                    />
                    <span className="drop-zone-icon">📄</span>
                    <h4>或上传文档文件</h4>
                    <p style={{ fontSize: '0.7rem' }}>支持 .txt / .md / .json / .csv / 代码文件等</p>
                  </div>

                  {/* Auto-parse preview */}
                  {importText.trim() && (
                    <div
                      className="kip-panel"
                      style={{
                        borderColor: 'var(--kip-tool)',
                        background: 'rgba(41,121,255,0.04)',
                        marginBottom: 12,
                        fontSize: '0.75rem',
                      }}
                    >
                      <div style={{ fontFamily: 'var(--font-code)', color: 'var(--text-secondary)' }}>
                        <div style={{ color: 'var(--kip-tool)', marginBottom: 4 }}>自动解析预览:</div>
                        <div>名称: <strong>{extractName(importText, importFileName)}</strong></div>
                        <div>带隙: <strong style={{ color: BAND_GAP_COLORS[detectBandGap(importText)] }}>{detectBandGap(importText).toUpperCase()}</strong></div>
                        <div>晶级: Tier {detectTier(importText)} · 格式: {detectFormat(importText)}</div>
                        {detectEndpoints(importText).length > 0 && (
                          <div>检测到 {detectEndpoints(importText).length} 个外部端点</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick import button */}
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!importText.trim()}
                    onClick={handleImportText}
                    style={{ width: '100%', fontSize: '0.9rem', padding: '12px' }}
                  >
                    ⚡ 一键生成晶体结构
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            IMPORT SUCCESS — Summary + Advanced toggle
            ════════════════════════════════════════════════ */}
        {importSuccess && !quickMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="kip-panel"
            style={{
              borderColor: 'var(--kip-safe)',
              background: 'rgba(11,218,81,0.04)',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.2rem' }}>✅</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                  晶体已生成 — {payload.crystalName}
                </div>
                <div style={{ fontFamily: 'var(--font-code)', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {payload.facets.logic.systemPrompt.length} 字符 · Tier {payload.crystalTier} · {payload.bandGapLevel.toUpperCase()}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{ fontSize: '0.72rem' }}
              >
                {showAdvanced ? '▲ 收起高级设置' : '▼ 高级设置 Advanced'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleReset} style={{ fontSize: '0.72rem' }}>
                重新导入
              </button>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            ADVANCED FORM (collapsible, auto-filled)
            ════════════════════════════════════════════════ */}
        <AnimatePresence>
          {(showAdvanced) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
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

              {/* Inclusion Facet */}
              <div className="facet-section">
                <div className="facet-section-header">
                  <span className="facet-badge">[INCLUSION]</span>
                  <span className="facet-title">包裹体 External Dependencies</span>
                </div>
                <div className="facet-body">
                  <div className="kip-field">
                    <label className="kip-label">外部 API 端点 Endpoints (每行一个)</label>
                    <textarea
                      className="kip-textarea"
                      rows={3}
                      placeholder="https://api.example.com/v1/analyze"
                      value={payload.facets.inclusion.endpoints.join('\n')}
                      onChange={e => setField(['facets', 'inclusion', 'endpoints'], e.target.value.split('\n').filter(Boolean))}
                    />
                  </div>
                  <div className="kip-field">
                    <label className="kip-label">知识库引用 Knowledge Refs (每行一个)</label>
                    <textarea
                      className="kip-textarea"
                      rows={3}
                      placeholder="kb://crystal-design-patterns"
                      value={payload.facets.inclusion.knowledgeRefs.join('\n')}
                      onChange={e => setField(['facets', 'inclusion', 'knowledgeRefs'], e.target.value.split('\n').filter(Boolean))}
                    />
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
                  <div className="kip-field">
                    <label className="kip-label">冗余纠错代码 Redundancy Code</label>
                    <textarea
                      className="kip-textarea"
                      rows={3}
                      placeholder="在暗轨数据损坏时的备用恢复逻辑..."
                      value={payload.facets.correction.redundancyCode}
                      onChange={e => setField(['facets', 'correction', 'redundancyCode'], e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Crystallize button ── */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isForging || (quickMode && !importText.trim())}
          style={{ fontSize: '0.9rem', padding: '14px 32px' }}
        >
          {isForging
            ? <><span className="anim-spin">⟳</span> 结晶中 Crystallizing…</>
            : <>{importSuccess ? '💎 确认结晶' : quickMode ? '💎 先完成导入再结晶' : '💎 结晶 Crystallize — 生成 .krys 文件'}</>
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
                <span>{quickMode ? '导入内容后预览将自动更新' : '填写表单后预览将自动更新'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};