/**
 * KIP (Krystallized Intent Protocol) v0.1 — Core Type Definitions
 * Author: Emberois | License: CC BY-SA 4.0
 */

// ─────────────────────────────────────────────
// § 1  Band Gap — Security Levels
// ─────────────────────────────────────────────

export type BandGapLevel = 'safe' | 'caution' | 'restricted' | 'tool' | 'multimodal';

export const BAND_GAP_COLORS: Record<BandGapLevel, string> = {
  safe:       '#0BDA51', // 孔雀石绿 — Malachite Green
  caution:    '#FFBF00', // 琥珀金   — Amber Gold
  restricted: '#E30022', // 辰砂红   — Cinnabar Red
  tool:       '#2979FF', // 标准蓝   — Standard Blue
  multimodal: '#B388FF', // 幻影紫   — Phantom Purple
};

export const QUADRANT_LOCK_COLOR = '#FF00FF'; // 品红 — Magenta anchor

// ─────────────────────────────────────────────
// § 2  Facets — Six-Facet Data Structures
// ─────────────────────────────────────────────

export interface CrownFacet {
  name: string;
  version: string;
  wakeWord: string; // e.g. "Initialize KIP Protocol"
}

export interface InputFacet {
  format: string;
  schema: Record<string, unknown>;
  description?: string;
}

export interface LogicFacet {
  systemPrompt: string;
  chain: string[];
}

export interface OutputFacet {
  format: string;
  toneTemplate: string;
}

export interface InclusionFacet {
  endpoints: string[];
  knowledgeRefs: string[];
}

export interface CorrectionFacet {
  fallbackPrompt: string;
  redundancyCode: string;
}

export interface KipFacets {
  crown:      CrownFacet;
  input:      InputFacet;
  logic:      LogicFacet;
  output:     OutputFacet;
  inclusion:  InclusionFacet;
  correction: CorrectionFacet;
}

// ─────────────────────────────────────────────
// § 3  Fingerprint — SHA-256 Integrity
// ─────────────────────────────────────────────

export interface KipFingerprint {
  algorithm: 'SHA-256';
  hash: string;       // hex string
  covers: Array<'visual_pixels' | 'json_payload' | 'band_gap_color'>;
}

// ─────────────────────────────────────────────
// § 4  Crystal Tier
// ─────────────────────────────────────────────

export type CrystalTier = 1 | 2 | 3;

// ─────────────────────────────────────────────
// § 5  KipPayload — Full JSON Schema
// ─────────────────────────────────────────────

export interface KipPayload {
  kipVersion:    string;        // "0.1"
  crystalId:     string;        // UUID v4
  crystalName:   string;
  crystalVersion: string;       // semver
  crystalTier:   CrystalTier;
  author:        string;
  createdAt:     string;        // ISO 8601
  bandGapLevel:  BandGapLevel;
  facets:        KipFacets;
  fingerprint:   KipFingerprint;
}

// ─────────────────────────────────────────────
// § 6  Crystal Runtime State Machine
// ─────────────────────────────────────────────

export type CrystalState =
  | 'IDLE'
  | 'MOUNTING'
  | 'VALIDATING'
  | 'DISPERSING'
  | 'REFRACTING'
  | 'COMPLETE'
  | 'DEFECT'
  | 'MISMATCH'
  | 'CLEAVAGE';

export type CrystalEvent =
  | 'CR_CRYSTALLIZE'
  | 'CR_RECRYSTALLIZE'
  | 'CR_REFRACT'
  | 'CR_DISPERSE'
  | 'CR_CLEAVAGE'
  | 'CR_DEFECT'
  | 'CR_MISMATCH'
  | 'CR_CLUSTER'
  | 'PARSE_SUCCESS'
  | 'VALIDATION_PASS'
  | 'REFRACT_COMPLETE'
  | 'CLEAN_COMPLETE';

export interface CrystalRuntimeState {
  state:       CrystalState;
  payload:     KipPayload | null;
  imageBlob:   Blob | null;
  errorMessage: string | null;
  isOffline:   boolean;
}

// ─────────────────────────────────────────────
// § 7  Validator Result
// ─────────────────────────────────────────────

export interface ValidationResult {
  valid:       boolean;
  bandGapOk:   boolean;
  fingerprintOk: boolean;
  blacklisted: boolean;
  reason?:     string;
}
