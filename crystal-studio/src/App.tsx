/**
 * App.tsx — Crystal Studio Root Shell
 * Wires state machine, routing, and global overlays.
 *
 * KIP Level 2 Full Conformance
 * Author: Emberois | SPEC-KIP-0.1
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCrystalRuntime } from './hooks/useCrystalRuntime';
import { ForgingPlatform } from './pages/ForgingPlatform';
import { Observatory } from './pages/Observatory';
import { ClusterWorkshop } from './pages/ClusterWorkshop';
import './index.css';
import './styles/App.css';

type Tab = 'forge' | 'observe' | 'cluster';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('forge');
  const {
    runtimeState,
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
  } = useCrystalRuntime();

  const isForging = runtimeState.state === 'MOUNTING' || runtimeState.state === 'VALIDATING';

  // ── Band Gap restricted — pre-refract modal ──────
  const [showCautionModal, setShowCautionModal] = useState(false);
  const [pendingRefract, setPendingRefract] = useState(false);

  const handleRefract = async (userInput?: string) => {
    const level = runtimeState.payload?.bandGapLevel;
    if (level === 'restricted') {
      setShowCautionModal(true);
      setPendingRefract(false);
      return;
    }
    if (level === 'caution') {
      setShowCautionModal(true);
      setPendingRefract(true);
      return;
    }
    await refract(userInput);
  };

  const confirmRefract = async () => {
    setShowCautionModal(false);
    if (pendingRefract) {
      await refract();
    }
  };

  // ── Recrystallize: load existing payload into forge ──
  const handleRecrystallize = () => {
    setActiveTab('forge');
  };

  return (
    <div className="app-shell">
      {/* ── Navigation ── */}
      <nav className="nav-bar">
        <div className="nav-logo">
          <span className="logo-gem">💎</span>
          <span>CRYSTAL STUDIO</span>
        </div>

        <div className="nav-tabs">
          <button
            className={`nav-tab${activeTab === 'forge' ? ' active' : ''}`}
            onClick={() => setActiveTab('forge')}
          >
            铸造台 FORGE
          </button>
          <button
            className={`nav-tab${activeTab === 'observe' ? ' active' : ''}`}
            onClick={() => setActiveTab('observe')}
          >
            观测站 OBSERVE
          </button>
          <button
            className={`nav-tab${activeTab === 'cluster' ? ' active' : ''}`}
            onClick={() => setActiveTab('cluster')}
          >
            晶簇 CLUSTER
          </button>
        </div>

        <div className="nav-status">
          <span className={`status-dot${runtimeState.isOffline ? ' offline' : ''}`} />
          {runtimeState.isOffline ? 'OFFLINE' : 'ONLINE'}
          &nbsp;·&nbsp;
          <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
            KIP v0.1
          </span>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeTab === 'forge' && (
            <motion.div key="forge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ForgingPlatform
                key={recrystallizePayload?.crystalId ?? 'new'}
                onCrystallize={crystallize}
                isForging={isForging}
                recrystallizePayload={recrystallizePayload}
              />
            </motion.div>
          )}
          {activeTab === 'observe' && (
            <motion.div key="observe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Observatory
                runtimeState={runtimeState}
                onLoad={loadKrys}
                onRefract={handleRefract}
                onCleavage={cleavage}
                tryLightTrack={tryLightTrack}
                lightTrackResult={lightTrackResult}
                refractResult={refractResult}
                isRefracting={isRefracting}
                onRecrystallize={handleRecrystallize}
                modelConfig={modelConfig}
                setModelConfig={setModelConfig}
              />
            </motion.div>
          )}
          {activeTab === 'cluster' && (
            <motion.div key="cluster" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ClusterWorkshop
                runtimeState={runtimeState}
                refractResult={refractResult}
                isRefracting={isRefracting}
                modelConfig={modelConfig}
                setModelConfig={setModelConfig}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Lattice Mismatch Overlay ── */}
      <AnimatePresence>
        {runtimeState.state === 'MISMATCH' && (
          <motion.div
            className="lattice-mismatch-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="lattice-mismatch-box"
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
            >
              <h2>⚠️ 晶格失配 Lattice Mismatch</h2>
              <p>
                此晶体的视觉数据与底层载荷 SHA-256 哈希不一致，可能已被篡改。<br />
                已中断折射执行。<br /><br />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {runtimeState.errorMessage}
                </span>
              </p>
              <button className="btn btn-danger" onClick={cleavage} style={{ width: '100%' }}>
                ✕ 解理晶体 Cleavage — 清除并返回
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Defect Toast ── */}
      <AnimatePresence>
        {runtimeState.state === 'DEFECT' && (
          <motion.div
            className="defect-toast"
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
          >
            <h4>晶格缺陷 Lattice Defect</h4>
            <p>{runtimeState.errorMessage}</p>
            <button
              className="btn btn-ghost"
              style={{ marginTop: 10, fontSize: '0.72rem', padding: '6px 14px' }}
              onClick={cleavage}
            >
              解理 / Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Band Gap Caution/Restricted Modal ── */}
      <AnimatePresence>
        {showCautionModal && (
          <motion.div
            className="caution-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="caution-modal"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              {runtimeState.payload?.bandGapLevel === 'restricted' ? (
                <>
                  <h3>🔴 高危权限拦截 Restricted</h3>
                  <p>
                    此晶体请求系统级高危权限，折射已被强制阻断。<br />
                    如需继续请解理此晶体后重新评估。
                  </p>
                  <div className="caution-modal-actions">
                    <button className="btn btn-danger" onClick={() => { setShowCautionModal(false); cleavage(); }}>
                      ✕ 解理 Cleavage
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3>🟡 外部网络请求 Caution</h3>
                  <p>
                    此晶体包含外部 API 包裹体 (Inclusion)，将发起网络请求。<br />
                    确认继续折射？
                  </p>
                  <div className="caution-modal-actions">
                    <button className="btn btn-ghost" onClick={() => setShowCautionModal(false)}>取消</button>
                    <button className="btn btn-primary" onClick={confirmRefract}>确认折射</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── State strip (bottom) ── */}
      <div className="state-strip">
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.1em' }}>
          CRYSTAL RUNTIME
        </span>
        <span>·</span>
        <span>{runtimeState.state}</span>
        {runtimeState.payload && (
          <>
            <span>·</span>
            <span style={{ color: 'var(--text-secondary)' }}>{runtimeState.payload.crystalName}</span>
            <span style={{ color: 'var(--text-muted)' }}>v{runtimeState.payload.crystalVersion}</span>
          </>
        )}
        <span style={{ flex: 1 }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
          Emberois · KIP v0.1 · CC BY-SA 4.0
        </span>
      </div>
    </div>
  );
}

export default App;