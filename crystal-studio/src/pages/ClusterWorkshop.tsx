/**
 * ClusterWorkshop — 晶簇工坊
 * Phase 5: Cluster Assembly
 *
 * Allows users to compose multiple independent Krystals into a
 * multi-agent collaborative workflow (晶簇组装).
 * Per SPEC-KIP-0.1 §5.2 CR_CLUSTER event.
 *
 * KIP Level 2 Full Conformance
 * Author: Emberois | SPEC-KIP-0.1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { KipPayload } from '../core';
import { BAND_GAP_COLORS, type BandGapLevel } from '../core';
import { BAND_GAP_LABELS, type AIModelConfig, type AIModelProvider, type RefractResult } from '../hooks/useCrystalRuntime';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ClusterNode {
  id: string;
  payload: KipPayload;
  imageBlob: Blob | null;
  imageUrl: string | null;
}

interface ClusterEdge {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface ClusterAssembly {
  id: string;
  name: string;
  nodes: ClusterNode[];
  edges: ClusterEdge[];
  createdAt: string;
}

interface ClusterStepResult {
  nodeId: string;
  crystalName: string;
  output: string;
  status: 'pending' | 'running' | 'done' | 'error';
  error?: string;
}

interface ClusterWorkshopProps {
  runtimeState: {
    state: string;
    payload: KipPayload | null;
    imageBlob: Blob | null;
    errorMessage: string | null;
    isOffline: boolean;
  };
  refractResult: RefractResult | null;
  isRefracting: boolean;
  modelConfig: AIModelConfig;
  setModelConfig: (config: AIModelConfig) => void;
}

const PROVIDER_LABELS: Record<AIModelProvider, string> = {
  openai:  'OpenAI',
  gemini:  'Gemini',
  webllm:  'Web-LLM',
  custom:  'Custom',
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export const ClusterWorkshop: React.FC<ClusterWorkshopProps> = ({
  runtimeState,
  isRefracting: parentIsRefracting,
  modelConfig,
  setModelConfig,
}) => {
  const [nodes, setNodes] = useState<ClusterNode[]>([]);
  const [edges, setEdges] = useState<ClusterEdge[]>([]);
  const [clusterName, setClusterName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);

  // Edge creation state
  const [edgeFrom, setEdgeFrom] = useState<string | null>(null);
  const [edgeLabel, setEdgeLabel] = useState('折射传递');

  // Cluster execution
  const [isExecuting, setIsExecuting] = useState(false);
  const [stepResults, setStepResults] = useState<ClusterStepResult[]>([]);
  const [showModelConfig, setShowModelConfig] = useState(false);

  // ── File drop handler ──────────────────
  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.name.endsWith('.krys') || f.type === 'image/png'
    );
    for (const file of files) {
      const url = URL.createObjectURL(file);
      try {
        const buffer = new Uint8Array(await file.arrayBuffer());
        let payload: KipPayload | null = null;

        const text = new TextDecoder().decode(buffer);
        const kipMatch = text.match(/"kipVersion"\s*:\s*"([^"]+)"/);
        if (kipMatch) {
          try {
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
              payload = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as KipPayload;
            }
          } catch { /* ignore */ }
        }

        const node: ClusterNode = {
          id: `crystal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          payload: payload ?? {
            kipVersion: '0.1',
            crystalId: crypto.randomUUID(),
            crystalName: file.name.replace(/\.(krys|png)$/i, ''),
            crystalVersion: '1.0.0',
            crystalTier: 1,
            author: 'Unknown',
            createdAt: new Date().toISOString(),
            bandGapLevel: 'safe',
            facets: {
              crown:      { name: file.name, version: '1.0.0', wakeWord: '' },
              input:      { format: 'unknown', schema: {}, description: '' },
              logic:      { systemPrompt: '[Dark track unreadable]', chain: [] },
              output:     { format: 'unknown', toneTemplate: '' },
              inclusion:  { endpoints: [], knowledgeRefs: [] },
              correction: { fallbackPrompt: '', redundancyCode: '' },
            },
            fingerprint: { algorithm: 'SHA-256', hash: '', covers: ['visual_pixels', 'json_payload', 'band_gap_color'] },
          },
          imageBlob: file,
          imageUrl: url,
        };

        setNodes(prev => [...prev, node]);
      } catch {
        // Skip unreadable files
      }
    }
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const dt = { dataTransfer: { files }, preventDefault: () => {} } as unknown as React.DragEvent;
    await handleFileDrop(dt);
  }, [handleFileDrop]);

  // ── Node management ─────────────────────
  const removeNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id));
    if (selectedNode === id) setSelectedNode(null);
    if (edgeFrom === id) setEdgeFrom(null);
  }, [selectedNode, edgeFrom]);

  // ── Edge management ─────────────────────
  const startEdgeCreation = useCallback((nodeId: string) => {
    setEdgeFrom(nodeId);
    setSelectedNode(null);
  }, []);

  const completeEdge = useCallback((targetId: string) => {
    if (edgeFrom && edgeFrom !== targetId) {
      setEdges(prev => [...prev, {
        id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        from: edgeFrom,
        to: targetId,
        label: edgeLabel || '折射传递',
      }]);
    }
    setEdgeFrom(null);
    setEdgeLabel('折射传递');
  }, [edgeFrom, edgeLabel]);

  const removeEdge = useCallback((edgeId: string) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
    if (selectedEdge === edgeId) setSelectedEdge(null);
  }, [selectedEdge]);

  const cancelEdgeCreation = useCallback(() => {
    setEdgeFrom(null);
    setEdgeLabel('折射传递');
  }, []);

  // ── Cluster execution ──────────────────
  const getAssembly = useCallback((): ClusterAssembly => ({
    id: crypto.randomUUID(),
    name: clusterName || 'Unnamed Cluster',
    nodes,
    edges,
    createdAt: new Date().toISOString(),
  }), [clusterName, nodes, edges]);

  // ── Validate cluster config ─────────────
  const validateCluster = useCallback((): string | null => {
    if (nodes.length === 0) return '晶簇中没有任何晶体节点';
    if (nodes.length === 1) return '晶簇至少需要 2 个晶体节点才能形成工作流';
    if (edges.length === 0) return '请至少添加一条连线，定义晶体间的数据流向';
    // Check all nodes are reachable
    const reachable = new Set<string>();
    const fromNodes = new Set(edges.map(e => e.from));
    edges.forEach(e => { reachable.add(e.from); reachable.add(e.to); });
    if (reachable.size < nodes.length) {
      return '存在未连接的孤立晶体节点，请确保所有节点都有连线';
    }
    return null;
  }, [nodes, edges]);

  // ── Execute cluster ─────────────────────
  const handleExecuteCluster = useCallback(async () => {
    const validationError = validateCluster();
    if (validationError) {
      alert(`晶簇校验失败: ${validationError}`);
      return;
    }

    setIsExecuting(true);
    setStepResults(nodes.map(n => ({
      nodeId: n.id,
      crystalName: n.payload.crystalName,
      output: '',
      status: 'pending' as const,
    })));

    // Build execution order via topological sort
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();
    nodes.forEach(n => { inDegree.set(n.id, 0); adj.set(n.id, []); });
    edges.forEach(e => {
      adj.get(e.from)?.push(e.to);
      inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
    });

    const queue = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0).map(n => n.id);
    const order: string[] = [];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      order.push(cur);
      adj.get(cur)?.forEach(next => {
        const d = (inDegree.get(next) ?? 1) - 1;
        inDegree.set(next, d);
        if (d === 0) queue.push(next);
      });
    }

    // Execute each node in topological order
    const outputs = new Map<string, string>();
    for (const nodeId of order) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;

      setStepResults(prev => prev.map(r => r.nodeId === nodeId ? { ...r, status: 'running' as const } : r));

      try {
        // Build input from incoming edges
        const incomingEdges = edges.filter(e => e.to === nodeId);
        const incomingData = incomingEdges
          .map(e => outputs.get(e.from))
          .filter(Boolean)
          .join('\n\n');

        const systemPrompt = node.payload.facets.logic.systemPrompt;
        const inputText = incomingData || 'Execute the crystal capability.';

        let output: string;

        if (modelConfig.provider === 'openai' && modelConfig.apiKey) {
          const resp = await fetch(`${modelConfig.baseUrl ?? 'https://api.openai.com/v1'}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${modelConfig.apiKey}`,
            },
            body: JSON.stringify({
              model: modelConfig.modelName ?? 'gpt-4o',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: inputText },
              ],
              temperature: 0.7,
              max_tokens: 2048,
            }),
          });
          if (!resp.ok) throw new Error(`OpenAI API error: ${resp.status}`);
          const data = await resp.json();
          output = data.choices?.[0]?.message?.content ?? JSON.stringify(data);
        } else if (modelConfig.provider === 'gemini' && modelConfig.apiKey) {
          const geminiUrl = `${modelConfig.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta'}/models/${modelConfig.modelName ?? 'gemini-2.0-flash'}:generateContent?key=${modelConfig.apiKey}`;
          const resp = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${inputText}` }] }],
            }),
          });
          if (!resp.ok) throw new Error(`Gemini API error: ${resp.status}`);
          const data = await resp.json();
          output = data.candidates?.[0]?.content?.parts?.[0]?.text ?? JSON.stringify(data);
        } else {
          output = `[晶簇模拟折射 — Cluster Simulation]\n\n` +
                   `晶体: ${node.payload.crystalName} v${node.payload.crystalVersion}\n` +
                   `模型: ${modelConfig.modelName ?? modelConfig.provider}\n` +
                   `上游输入: ${incomingData ? incomingData.slice(0, 200) + '…' : '(无 — 此为起始节点)'}\n\n` +
                   `--- System Prompt 预览 ---\n${systemPrompt.slice(0, 400)}${systemPrompt.length > 400 ? '…' : ''}\n\n` +
                   `[提示] 配置 API Key 后可执行真实晶簇折射。`;
        }

        outputs.set(nodeId, output);
        setStepResults(prev => prev.map(r =>
          r.nodeId === nodeId ? { ...r, output, status: 'done' as const } : r
        ));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setStepResults(prev => prev.map(r =>
          r.nodeId === nodeId ? { ...r, output: '', status: 'error' as const, error: errorMsg } : r
        ));
      }
    }

    setIsExecuting(false);
  }, [nodes, edges, modelConfig, validateCluster]);

  const clearCluster = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setSelectedEdge(null);
    setEdgeFrom(null);
    setClusterName('');
    setStepResults([]);
    setIsExecuting(false);
  }, []);

  // ── Render ──────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="observatory"
    >
      <div className="observatory-header">
        <h1>晶簇工坊 <span style={{ color: 'var(--kip-tool)' }}>Cluster Workshop</span></h1>
        <p className="text-secondary" style={{ fontFamily: 'var(--font-code)', fontSize: '0.82rem' }}>
          组装多个独立晶体为复杂多 Agent 协同工作流
        </p>
      </div>

      {/* Offline indicator */}
      {runtimeState.isOffline && (
        <div className="kip-panel" style={{ borderColor: 'var(--kip-caution)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>🟡</span>
          <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.8rem', color: 'var(--kip-caution)' }}>
            当前处于离线状态 — 晶簇折射需要 API 连接
          </span>
        </div>
      )}

      {/* Cluster name */}
      <div className="facet-section">
        <div className="facet-body">
          <div className="kip-field">
            <label className="kip-label">晶簇名称 Cluster Name</label>
            <input
              className="kip-input"
              placeholder="My Multi-Agent Workflow"
              value={clusterName}
              onChange={e => setClusterName(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`drop-zone${dragOver ? ' drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
        style={{ minHeight: 120 }}
      >
        <input type="file" accept=".krys,image/png" multiple onChange={handleFileInput} />
        <span className="drop-zone-icon">💎💎</span>
        <h3>拖入多个 .krys 晶体文件</h3>
        <p>支持批量拖放 · 自动识别 KIP 暗轨数据</p>
      </div>

      {/* Nodes grid */}
      {nodes.length > 0 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', marginBottom: 8, color: 'var(--kip-tool)' }}>
            ◆ 晶体节点 Crystal Nodes ({nodes.length})
          </h3>

          {/* Edge creation hint */}
          {edgeFrom && (
            <div className="kip-panel" style={{
              borderColor: 'var(--kip-caution)',
              marginBottom: 12,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.78rem', color: 'var(--kip-caution)' }}>
                ▲ 连线模式: 从 <strong>{nodes.find(n => n.id === edgeFrom)?.payload.crystalName ?? '?'}</strong> 出发
                — 点击目标节点完成连线
              </span>
              <div className="kip-field" style={{ flex: '0 0 auto', minWidth: 140 }}>
                <input
                  className="kip-input"
                  style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                  placeholder="连线标签"
                  value={edgeLabel}
                  onChange={e => setEdgeLabel(e.target.value)}
                />
              </div>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={cancelEdgeCreation}
                style={{ fontSize: '0.68rem', padding: '4px 10px' }}
              >
                ✕ 取消
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            <AnimatePresence>
              {nodes.map(node => {
                const isSelected = selectedNode === node.id;
                const isEdgeSource = edgeFrom === node.id;
                const accentColor = BAND_GAP_COLORS[node.payload.bandGapLevel as BandGapLevel];
                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="facet-section"
                    style={{
                      borderColor: isSelected ? 'var(--kip-tool)' : isEdgeSource ? 'var(--kip-caution)' : undefined,
                      boxShadow: isSelected
                        ? '0 0 16px rgba(41,121,255,0.2)'
                        : isEdgeSource
                          ? '0 0 16px rgba(255,191,0,0.3)'
                          : undefined,
                      cursor: edgeFrom ? (edgeFrom !== node.id ? 'pointer' : 'default') : 'pointer',
                    }}
                    onClick={() => {
                      if (edgeFrom && edgeFrom !== node.id) {
                        completeEdge(node.id);
                      } else if (!edgeFrom) {
                        setSelectedNode(isSelected ? null : node.id);
                      }
                    }}
                  >
                    <div className="facet-section-header">
                      <span className="facet-badge" style={{ borderColor: accentColor, color: accentColor }}>
                        {node.payload.bandGapLevel.toUpperCase()}
                      </span>
                      <span className="facet-title" style={{ flex: 1 }}>
                        {node.payload.crystalName}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {!edgeFrom && (
                          <button
                            className="btn btn-ghost"
                            type="button"
                            onClick={e => { e.stopPropagation(); startEdgeCreation(node.id); }}
                            style={{ fontSize: '0.6rem', padding: '2px 6px' }}
                            title="从此节点创建连线"
                          >
                            →
                          </button>
                        )}
                        <button
                          className="btn btn-ghost"
                          type="button"
                          onClick={e => { e.stopPropagation(); removeNode(node.id); }}
                          style={{ fontSize: '0.65rem', padding: '2px 8px' }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="facet-body">
                      <div style={{ fontFamily: 'var(--font-code)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        <div>Tier {node.payload.crystalTier} · v{node.payload.crystalVersion}</div>
                        <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                          {node.payload.facets.logic.systemPrompt.slice(0, 80)}
                          {node.payload.facets.logic.systemPrompt.length > 80 ? '…' : ''}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Edge list */}
      {edges.length > 0 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', marginBottom: 8, color: 'var(--kip-safe)' }}>
            ◆ 晶簇连线 Cluster Edges ({edges.length})
          </h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {edges.map(edge => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              return (
                <div
                  key={edge.id}
                  className="kip-badge"
                  style={{
                    borderColor: 'var(--kip-safe)',
                    color: 'var(--kip-safe)',
                    cursor: 'pointer',
                    opacity: selectedEdge === edge.id ? 1 : 0.8,
                  }}
                  onClick={() => setSelectedEdge(selectedEdge === edge.id ? null : edge.id)}
                >
                  {fromNode?.payload.crystalName ?? '?'} → {toNode?.payload.crystalName ?? '?'}
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                    [{edge.label}]
                  </span>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); removeEdge(edge.id); }}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: 4, fontSize: '0.7rem' }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Model Config */}
      {nodes.length > 0 && (
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
      )}

      {/* Validation summary */}
      {nodes.length >= 2 && !isExecuting && stepResults.length === 0 && (
        <div className="kip-panel" style={{ borderColor: 'var(--kip-tool)' }}>
          <div style={{ fontFamily: 'var(--font-code)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <div style={{ color: 'var(--kip-tool)', marginBottom: 4 }}>晶簇拓扑摘要:</div>
            <div>节点: {nodes.length} · 连线: {edges.length}</div>
            <div style={{ marginTop: 4, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {edges.length === 0
                ? '⚠ 请添加连线以定义晶体间的数据流方向'
                : '执行时将按拓扑顺序依次折射每个晶体，上游输出作为下游输入'}
            </div>
          </div>
        </div>
      )}

      {/* Execution results */}
      {stepResults.length > 0 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', marginBottom: 8, color: 'var(--kip-multimodal)' }}>
            ◆ 晶簇折射结果 Cluster Results
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stepResults.map((result, idx) => (
              <motion.div
                key={result.nodeId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="facet-section"
                style={{ borderColor: result.status === 'error' ? 'var(--kip-restricted)' : result.status === 'done' ? 'var(--kip-safe)' : 'var(--kip-tool)' }}
              >
                <div className="facet-section-header">
                  <span className="facet-badge" style={{
                    borderColor: result.status === 'error' ? 'var(--kip-restricted)' : result.status === 'done' ? 'var(--kip-safe)' : 'var(--kip-tool)',
                    color: result.status === 'error' ? 'var(--kip-restricted)' : result.status === 'done' ? 'var(--kip-safe)' : 'var(--kip-tool)',
                  }}>
                    {result.status === 'running' ? '⟳' : result.status === 'done' ? '✓' : result.status === 'error' ? '✕' : '○'}
                    {' '}Step {idx + 1}
                  </span>
                  <span className="facet-title" style={{ flex: 1 }}>{result.crystalName}</span>
                  <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                <div className="facet-body">
                  {result.status === 'pending' && (
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '0.78rem' }}>
                      等待上游节点完成…
                    </span>
                  )}
                  {result.status === 'running' && (
                    <span style={{ color: 'var(--kip-tool)', fontFamily: 'var(--font-code)', fontSize: '0.78rem' }}>
                      <span className="anim-spin" style={{ display: 'inline-block' }}>⟳</span> 折射中…
                    </span>
                  )}
                  {result.status === 'done' && (
                    <div style={{ fontFamily: 'var(--font-code)', fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>
                      {result.output}
                    </div>
                  )}
                  {result.status === 'error' && (
                    <div style={{ fontFamily: 'var(--font-code)', fontSize: '0.78rem', color: 'var(--kip-restricted)' }}>
                      {result.error}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {nodes.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleExecuteCluster}
            disabled={isExecuting || parentIsRefracting}
          >
            {isExecuting
              ? <><span className="anim-spin">⟳</span> 折射晶簇中…</>
              : <>▷ 折射晶簇 Execute Cluster — {nodes.length} 晶体</>
            }
          </button>
          <button className="btn btn-ghost" type="button" onClick={clearCluster}>
            ✕ 清空晶簇 Clear
          </button>
        </div>
      )}
    </motion.div>
  );
};