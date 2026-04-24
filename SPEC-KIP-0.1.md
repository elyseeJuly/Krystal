# SPEC-KIP-0.1 — Krystallized Intent Protocol

> **Specification for the Krystallized Intent Protocol (KIP): An Open Standard for Encapsulating AI Capabilities into Visually-Encoded, Self-Contained Executable Files.**

---

| Field            | Value                                                      |
| :--------------- | :--------------------------------------------------------- |
| **Title**        | Krystallized Intent Protocol (KIP)                         |
| **Version**      | 0.1 (Initial Draft)                                        |
| **Status**       | 🟡 Draft                                                   |
| **Author**       | Emberois                                                   |
| **Created**      | 2026-04-24                                                 |
| **License**      | CC BY-SA 4.0 (Creative Commons Attribution-ShareAlike 4.0) |
| **Repository**   | https://github.com/elyseeJuly/Krystal                     |

---

## Abstract

The **Krystallized Intent Protocol (KIP)** is an open standard that defines how to package AI prompts, logic, and operational instructions into visually-encoded image files (`.krys` — Krystal Files). These files are designed to be simultaneously human-aesthetically pleasing and machine-readable by any multimodal AI model, enabling a new paradigm of AI capability distribution: **visual-first, model-agnostic, offline-capable, and tamper-resistant**.

KIP aims to democratize AI capability sharing by turning complex AI workflows into portable, self-contained visual artifacts that can be shared across social media, messaging apps, and peer-to-peer networks — surviving compression, transcoding, and platform lock-in.

---

## 1. Terminology (术语定义)

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

### 1.1 Core Architecture — The Trinity (三位一体)

KIP is organized into three architectural layers:

| Layer | Name | Chinese | Description |
| :---- | :--- | :------ | :---------- |
| **Skeleton** | KIP Protocol | 骨架层 | The underlying protocol standard defining data encoding and file structure. |
| **Soul & Experience** | Crystal Studio | 灵魂与体验层 | The end-user-facing application and aesthetic design language. |
| **Toolchain** | Xtal Ecosystem | 工具链层 | The compiler, validator, and developer-facing infrastructure. |

### 1.2 Entity Definitions

| Term | Chinese | Definition |
| :--- | :------ | :--------- |
| **Krystal** | 晶体载体 | A concrete file entity that carries the KIP protocol payload. The physical manifestation of an AI capability. |
| **Crystal Studio** | 晶体工坊 | The no-code frontend application for end-users to create, browse, and execute Krystals. |
| **Sigil** | 秘符 | The aesthetic design language combining classical gemstone geometry, covert inlay, and cyberpunk neon band-gap aesthetics. |
| **Xtal** | 交叉晶格 | The underlying lattice structure and technical language for developer tooling. |
| **Xtal-Compiler** | 晶格编译器 | The engine that compiles natural language instructions into `.krys` file JSON payloads. |
| **Xtal-Validator** | 晶格校验器 | The security audit engine for tamper detection and integrity verification. |

### 1.3 Component Vocabulary

| Term | Chinese | Definition |
| :--- | :------ | :--------- |
| **Facet** | 切面 | A parameter input port or sub-functional module of a Krystal (e.g., Input Facet, Output Facet). |
| **Inclusion** | 包裹体 | A pointer/identifier referencing external private knowledge bases, database indices, or API endpoints. |
| **Refract** | 折射 | The process of a multimodal model reading a Krystal and executing its embedded instructions. Replaces "run/invoke". |
| **Dispersion** | 色散 | The process of decomposing a parsed Krystal's capabilities into multiple interactive Facets rendered in the frontend UI. |
| **Crystallize** | 结晶 | The process of packaging natural language/prompts and rendering them into a `.krys` file. |
| **Recrystallize** | 重结晶 | Iterative version updates, feature additions, or parameter optimizations to an existing Krystal. |
| **Cleavage** | 解理 | Terminating Krystal execution, unloading the workflow, and restoring the system to a clean initial state. |
| **Lattice Defect** | 晶格缺陷 | An error state: execution anomaly, code error, or API crash. |
| **Lattice Mismatch** | 晶格失配 | A critical security alert triggered when the visual track and steganographic track hash values diverge. |
| **Cluster Assembly** | 晶簇组装 | Composing multiple independent Krystals into a complex multi-agent collaborative workflow. |
| **Sigil Forging** | 秘符铸造 | The rendering process that transforms underlying logic code into high-aesthetic visual imagery. |

---

## 2. File Format Specification (文件格式规范)

### 2.1 File Extension

KIP-compliant files MUST use the `.krys` extension (Krystal File).

### 2.2 Container Structure

A `.krys` file is a dual-layer container:

```
┌──────────────────────────────────────────┐
│           Visual Layer (PNG/WebP)        │  ← Human-visible image
│  ┌────────────────────────────────────┐  │
│  │         Steganographic Layer       │  │  ← Machine-readable payload
│  │  ┌──────────────────────────────┐  │  │
│  │  │      full_payload.bin        │  │  │  ← JSON data blob
│  │  └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### 2.3 Payload Structure (JSON Schema)

The embedded JSON payload MUST contain the following top-level fields:

```json
{
  "kip_version": "0.1",
  "crystal_id": "<UUID v4>",
  "crystal_name": "<string>",
  "crystal_version": "<semver>",
  "crystal_tier": 1 | 2 | 3,
  "author": "<string>",
  "created_at": "<ISO 8601>",
  "band_gap_level": "safe" | "caution" | "restricted" | "tool" | "multimodal",
  "facets": {
    "crown":      { "name": "<string>", "version": "<string>", "wake_word": "<string>" },
    "input":      { "format": "<string>", "schema": {} },
    "logic":      { "system_prompt": "<string>", "chain": [] },
    "output":     { "format": "<string>", "tone_template": "<string>" },
    "inclusion":  { "endpoints": [], "knowledge_refs": [] },
    "correction": { "fallback_prompt": "<string>", "redundancy_code": "<string>" }
  },
  "fingerprint": {
    "algorithm": "SHA-256",
    "hash": "<hex string>",
    "covers": ["visual_pixels", "json_payload", "band_gap_color"]
  }
}
```

### 2.4 Crystal Tier Classification (晶级分类)

| Tier | Name | Offline Capable | External Dependencies |
| :--- | :--- | :-------------- | :-------------------- |
| **1** | Pure Crystal | ✅ MUST be 100% offline | None. Fully self-contained. |
| **2** | Enhanced Crystal | ✅ MUST be 100% offline | None. Self-contained with richer logic. |
| **3** | Connected Crystal | ⚠️ Degraded offline mode | MAY include Inclusions (external APIs/knowledge). MUST provide local fallback via Correction Facet. |

---

## 3. Visual Encoding Specification (视觉编码规范)

### 3.1 The Sigil Anatomy — Three-Layer, Six-Facet Layout

All rendered Krystal images MUST be composed of three absolute layers in Canvas/SVG:

#### Layer 1: The Core (晶核) — Human Aesthetic Layer

- **Position**: Dead center of the image.
- **Size**: MUST occupy exactly **40%** of the total canvas area.
- **Content**: Visual metaphor (Sigil) representing the AI capability — obsidian, circuit glow, gemstone geometry, etc.
- **Machine-readability**: NOT REQUIRED. This layer serves purely as emotional/aesthetic value for humans.

#### Layer 2: The Band Gap (带隙) — Status Indicator Layer

- **Position**: 1-2px luminous halo surrounding the Core boundary.
- **Color Specification** (MUST use sRGB absolute values for compression resistance):

| Status | Chinese | Color Name | Hex Code | Trigger |
| :----- | :------ | :--------- | :------- | :------ |
| 🟢 Safe | 安全 | Malachite Green | `#0BDA51` | Pure text / local execution |
| 🟡 Caution | 警告 | Amber Gold | `#FFBF00` | Contains external API / Inclusion |
| 🔴 Restricted | 高危 | Cinnabar Red | `#E30022` | High-risk permissions / malicious intercept |
| 🔵 Tool | 工具 | Standard Blue | `#2979FF` | Contains external tool invocations |
| 🟣 Multimodal | 多模态 | Phantom Purple | `#B388FF` | Creative / multimodal tasks |

#### Layer 3: The 6 Facets (六晶面) — Model Execution Layer

- **Position**: 6 border/edge regions distributed around the image periphery.
- **Visual Style**: MUST use "Data Filigree (数据金丝工艺)" — high-density encoding disguised as vintage wire-drawing ornamental patterns or arcane circle borders.

### 3.2 Six-Facet Directional Mapping

Facets MUST follow this clockwise layout and information density allocation:

```
          ┌──────────────────────────┐
          │   👑 Crown Facet (10%)   │
          │  Name · Version · Wake   │
     ┌────┼──────────────────────────┼────┐
     │ ↖️ │                          │ ↗️ │
     │Cor-│                          │Inp-│
     │rec-│                          │ ut │
     │tion│      ┌──────────┐       │    │
     │10% │      │  CORE    │       │15% │
     │    │      │  (40%)   │       │    │
     │    │      └──────────┘       │    │
     │ ↙️ │                          │ ↘️ │
     │Inc-│                          │Log-│
     │lus-│                          │ ic │
     │ion │                          │    │
     │10% │                          │40% │
     └────┼──────────────────────────┼────┘
          │   👢 Output Facet (15%)  │
          │  Format · Tone Template  │
          └──────────────────────────┘
```

| Position | Facet | Info % | Content |
| :------- | :---- | :----- | :------ |
| 👑 Top | Crown | 10% | Crystal name, version, wake word (e.g., `"Initialize KIP Protocol"`) |
| ↗️ Upper-Right | Input | 15% | Input format definition and user instruction schema |
| ↘️ Lower-Right | Logic | 40% | Core System Prompt. MUST use high-density long-stripe filigree encoding (micro Data Matrix variant) |
| 👢 Bottom | Output | 15% | Output format conventions and tone templates |
| ↙️ Lower-Left | Inclusion | 10% | External knowledge indices, micro QR codes, or hash pointers |
| ↖️ Upper-Left | Correction | 10% | Error-correction redundancy code and anti-hallucination mechanisms |

### 3.3 Canvas Constraints

- **Resolution**: MUST be `1024×1024` or `1536×1536` pixels (square aspect ratio) to ensure hexagonal symmetry.
- **Quadrant Lock Anchors**: At every Facet intersection (the four corners and connection crossings), a **2×2 pixel fixed reference color block** MUST be embedded using Magenta (`#FF00FF`). These anchors serve as crystallographic axis references for cross-platform AI visual alignment.

---

## 4. Data Parsing Protocol (数据解析协议)

### 4.1 Dual-Track Parsing — Priority Logic

To survive social media image compression (WeChat, Weibo, Twitter, etc.), parsers MUST implement a dual-track fallback:

| Priority | Track | Chinese | Method | Target Fidelity |
| :------- | :---- | :------ | :----- | :-------------- |
| **1 (Highest)** | Dark Track | 暗轨 | LSB steganography, EXIF/PNG chunk extraction, or Zip-like container unpacking (`full_payload.bin`) | 100% lossless JSON |
| **2 (Fallback)** | Light Track | 明轨 | Multimodal AI visual reading of edge text, semantic glyphs, and low-density filigree encoding | ≥70% core logic recovery |

### 4.2 Explicit Text Anchors

Because multimodal models do NOT reliably scan images in strict clockwise order (they use probabilistic attention), visual Facet rendering MUST NOT rely solely on spatial position. The following text anchors MUST be embedded in their respective Facet regions:

| Anchor Keyword | Target Facet |
| :------------- | :----------- |
| `[CROWN]` | Crown Facet |
| `[INPUT]` | Input Facet |
| `[LOGIC]` | Logic Facet |
| `[OUTPUT]` | Output Facet |
| `[INCLUSION]` | Inclusion Facet |
| `[CORRECTION]` | Correction Facet |

**Fallback extraction**: When visual parsing is degraded, parsers SHOULD globally search for these uppercase text anchors and extract trailing content, enabling dual-drive parsing via "spatial structure + text anchors".

### 4.3 Crystal Fingerprint Verification

**Formula**: `SHA-256(visual_pixel_data + json_payload + band_gap_color_value)`

- The computed hash MUST be stored in the Correction Facet payload.
- On parsing, the Xtal-Validator MUST recompute this hash and compare it against the embedded value.
- **On mismatch** (e.g., an attacker Photoshopping a red Band Gap to green): the parser MUST immediately raise a **Lattice Mismatch (晶格失配)** critical alert and MUST NOT proceed with Refraction.

---

## 5. Runtime Lifecycle (运行时生命周期)

### 5.1 Crystal Runtime (CR) State Machine

The frontend application is fundamentally a **Crystal Runtime (CR)**. It MUST implement the following state transitions:

```
                    ┌─────────────┐
                    │   IDLE      │
                    │  (初始态)    │
                    └──────┬──────┘
                           │ Load .krys / Crystal Link
                           ▼
                    ┌─────────────┐
                    │  MOUNTING   │
                    │  (挂载中)    │
                    └──────┬──────┘
                           │ File parsed
                           ▼
                    ┌─────────────┐
                    │  VALIDATING │  ← Xtal-Validator
                    │ (晶格校验)   │    Fingerprint + Band Gap + Blacklist
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
               PASS │             │ FAIL
                    ▼             ▼
             ┌───────────┐  ┌──────────────┐
             │ DISPERSING │  │LATTICE DEFECT│
             │  (色散中)   │  │ (晶格缺陷)    │
             └─────┬─────┘  └──────────────┘
                   │ Facets rendered
                   ▼
             ┌───────────┐
             │ REFRACTING │  ← Model executing
             │  (折射中)   │
             └─────┬─────┘
                   │
            ┌──────┴──────┐
       OK   │             │ ERROR
            ▼             ▼
      ┌──────────┐  ┌──────────────┐
      │ COMPLETE │  │LATTICE DEFECT│
      │ (完成)    │  │ (晶格缺陷)    │
      └─────┬────┘  └──────────────┘
            │ User terminates
            ▼
      ┌──────────┐
      │ CLEAVAGE │  ← Clean state restoration
      │  (解理)   │
      └──────────┘
```

### 5.2 Action Vocabulary — Event Dispatch Reference

| Action | Chinese | Event Constant | Description |
| :----- | :------ | :------------- | :---------- |
| Crystallize | 结晶 | `CR_CRYSTALLIZE` | Package prompt → `.krys` |
| Recrystallize | 重结晶 | `CR_RECRYSTALLIZE` | Version iteration on existing Krystal |
| Refract | 折射 | `CR_REFRACT` | Model begins execution |
| Dispersion | 色散 | `CR_DISPERSE` | Parsed capabilities → UI Facets |
| Cleavage | 解理 | `CR_CLEAVAGE` | Terminate + clean state |
| Lattice Defect | 晶格缺陷 | `CR_DEFECT` | Runtime error |
| Lattice Mismatch | 晶格失配 | `CR_MISMATCH` | Security alert — hash divergence |
| Cluster Assembly | 晶簇组装 | `CR_CLUSTER` | Multi-Krystal workflow composition |

---

## 6. Security Model (安全模型)

### 6.1 Band Gap Permission Gating

The Band Gap is not merely a visual element — it is a **machine-readable permission trigger**. The Crystal Runtime MUST enforce the following UI-level gating:

| Level | Color | Frontend Behavior |
| :---- | :---- | :---------------- |
| 🟢 Safe | `#0BDA51` | Silent Refraction. No user prompt required. |
| 🟡 Caution | `#FFBF00` | MUST display modal: "This Crystal requests external network access. Proceed?" |
| 🔴 Restricted | `#E30022` | MUST block before Refraction. MUST display mandatory confirmation: `"⚠️ This Crystal requests high-risk permissions. Confirm to proceed? [Y/N]"` |

### 6.2 Offline-First Principle & Tier Degradation

To resist platform lock-in ("Embrace, Extend, Extinguish" strategies):

- **Tier 1 & 2 Krystals**: MUST be 100% self-contained. MUST execute fully offline when connected to any local multimodal model.
- **Tier 3 Krystals**: MAY call external APIs. But when offline is detected, the parser MUST read the Correction Facet's fallback code and provide a degraded-but-functional local execution path. **White-screen or crash is NEVER acceptable.**

### 6.3 Core Audit — Malicious Crystal Interception

The Xtal-Validator SHOULD maintain a malicious Crystal blacklist. Krystals containing scam logic, jailbreak attempts, or privacy-stealing payloads MUST be rejected at the Validation stage (i.e., Dispersion is refused) and a maximum-severity security alert MUST be raised to the user.

---

## 7. Conformance Levels (合规性级别)

### 7.1 KIP Level 1 — Minimal Conformance

An implementation achieves Level 1 if it:
- ✅ Can parse `.krys` file JSON payloads (Dark Track)
- ✅ Validates Crystal Fingerprint (SHA-256)
- ✅ Enforces Band Gap permission gating
- ✅ Implements the CR state machine (Mounting → Validating → Refracting → Cleavage)

### 7.2 KIP Level 2 — Full Conformance

An implementation achieves Level 2 if it additionally:
- ✅ Can render compliant Krystal images (Crystallize / Sigil Forging)
- ✅ Implements Dual-Track Parsing (Dark + Light Track fallback)
- ✅ Embeds and reads Text Anchors for visual fallback
- ✅ Supports Cluster Assembly (multi-Krystal workflows)
- ✅ Implements Offline Tier Degradation for Tier 3 Krystals

---

## Appendix A: Color Value Quick Reference

| Name | Chinese | Hex | sRGB | Usage |
| :--- | :------ | :-- | :--- | :---- |
| Malachite Green | 孔雀石绿 | `#0BDA51` | `rgb(11, 218, 81)` | Band Gap — Safe |
| Amber Gold | 琥珀金 | `#FFBF00` | `rgb(255, 191, 0)` | Band Gap — Caution |
| Cinnabar Red | 辰砂红 | `#E30022` | `rgb(227, 0, 34)` | Band Gap — Restricted |
| Standard Blue | 标准蓝 | `#2979FF` | `rgb(41, 121, 255)` | Band Gap — Tool |
| Phantom Purple | 幻影紫 | `#B388FF` | `rgb(179, 136, 255)` | Band Gap — Multimodal |
| Magenta | 品红 | `#FF00FF` | `rgb(255, 0, 255)` | Quadrant Lock Anchor |

## Appendix B: Text Anchor Keywords

```
[CROWN]  [INPUT]  [LOGIC]  [OUTPUT]  [INCLUSION]  [CORRECTION]
```

## Appendix C: Prohibited Terminology

The following traditional software terms MUST NOT be used in any KIP-compliant implementation. Use the KIP equivalent instead:

| ❌ Prohibited | ✅ KIP Equivalent |
| :------------ | :---------------- |
| App / Application | Crystal / Krystal |
| Install | Crystallize |
| Run / Execute / Invoke | Refract |
| Uninstall / Remove | Cleavage |
| Error / Bug / Exception | Lattice Defect |
| Container | Krystal Carrier |
| Plugin / Extension | Facet |
| Pipeline / Workflow | Cluster Assembly |
| Update / Upgrade | Recrystallize |

---

*SPEC-KIP-0.1 — Authored by Emberois — 2026-04-24*
*This specification is released under the Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0).*
