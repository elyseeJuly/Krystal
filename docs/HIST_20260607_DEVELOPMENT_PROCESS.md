# 开发过程记录 — 铸造台一键导入功能

> **Development Process Log — Quick Import Feature for ForgingPlatform**
> Date: 2026-06-07 | Author: Emberois
> Previous: `HIST_20260428_CRYSTALSTUDIO_V0.1_WALKTHROUGH_FINAL.md`

---

## 目录

1. [会话概述](#1-会话概述)
2. [问题分析](#2-问题分析)
3. [设计方案](#3-设计方案)
4. [实现步骤](#4-实现步骤)
5. [关键决策记录](#5-关键决策记录)
6. [问题与解决](#6-问题与解决)
7. [变更清单](#7-变更清单)
8. [验证结果](#8-验证结果)
9. [Git 提交记录](#9-git-提交记录)

---

## 1. 会话概述

| 项目 | 内容 |
| :--- | :--- |
| **日期** | 2026-06-07 |
| **焦点** | 铸造台 (ForgingPlatform) — 快速导入 Quick Import |
| **用户反馈** | "目前太复杂了，我也不知道怎么使用" |
| **目标** | 粘贴文本/上传文档 → 一键自动解析填充 → 直接结晶 |
| **涉及文件** | `src/pages/ForgingPlatform.tsx`, `docs/SPEC_20260607_CRYSTAL_STUDIO_DEVELOPMENT.md` |
| **产出版本** | commit `1ef2ccf` |

### 1.1 前置状态

在本次会话之前，项目已完成以下所有开发阶段（参见 `HIST_20260428_CRYSTALSTUDIO_V0.1_TASKLOG_FINAL.md`）：

- Phase 0: 骨架层 — 核心引擎 (KrystalDecoder/Encoder/Validator/SigilForge/CrystalRuntime) ✅
- Phase 1-2: 秘符铸造 + 视觉引擎 ✅
- Phase 3: 灵魂注入 — useCrystalRuntime Hook ✅
- Phase 4: 晶体工坊 — 铸造台/观测站/晶簇工坊 ✅
- Phase 5: 晶簇组装 — ClusterWorkshop ✅
- 开发规范文档 5 份 (AUDIT/PLAN/SUMMARY/SPEC) ✅
- 全部同步至 GitHub ✅

### 1.2 用户反馈原文

> "加入一键导入文本或者文档，然后自动拆分成晶体化结构的功能，目前太复杂了，我也不知道怎么使用。开发规范依然如上。"

---

## 2. 问题分析

### 2.1 痛点诊断

铸造台 (ForgingPlatform) 在 Phase 4 实现时采用了「全功能表单」设计，要求用户手动填写全部 6 个 Facet：

| 切面 | 字段数 | 填写难度 |
| :--- | :---- | :------- |
| [CROWN] 晶核身份 | 4 个 (名称/版本/作者/唤醒词) | 🟡 中等 |
| [BAND GAP] 带隙 | 5 选 1 | 🟢 简单 |
| [LOGIC] 核心逻辑 | 1 个 (System Prompt) | 🟢 简单 |
| [INPUT] 输入切面 | 2 个 (格式/说明) | 🟡 中等 |
| [OUTPUT] 输出切面 | 2 个 (格式/语气) | 🟡 中等 |
| [INCLUSION] 包裹体 | 2 个 (端点/知识引用) | 🔴 困难 |
| [CORRECTION] 容错冗余 | 2 个 (降级提示/冗余代码) | 🔴 困难 |

**核心问题**: 对第一次使用 KIP 的用户来说，7 个区块、约 18 个输入字段的复杂度远超出了"试用"的心理门槛。

### 2.2 竞品类比

| 产品 | 新用户首次体验 |
| :--- | :------------- |
| ChatGPT | 一个文本框 |
| Midjourney | /imagine prompt |
| **Crystal Studio (改进前)** | **18 个字段 + 文件上传 + 预览** |

**结论**: 需要将首次体验简化为「一个文本框 → 一键生成 → 下载」。

---

## 3. 设计方案

### 3.1 设计原则

1. **渐进式披露 (Progressive Disclosure)**: 默认展示简单界面，高级功能折叠隐藏
2. **智能推断 (Intelligent Defaults)**: 从文本内容自动推断所有字段
3. **即时反馈 (Instant Feedback)**: 输入过程中实时显示解析预览
4. **不破坏现有功能**: 保留完整的高级表单供精细编辑

### 3.2 用户流程图

```
┌──────────────────────────────────────┐
│  打开铸造台                          │
│                                      │
│  默认显示「快速导入」面板              │
│  ┌──────────────────────────────────┐ │
│  │ 文本粘贴框 (大字)                 │ │
│  │ 或: 文件上传/拖入 (.txt/.md等)    │ │
│  │                                  │ │
│  │ [实时解析预览]                    │ │
│  │ 名称: xxx · 带隙: SAFE · Tier: 1 │ │
│  │                                  │ │
│  │ [⚡ 一键生成晶体结构]              │ │
│  └──────────────────────────────────┘ │
│                                      │
│  ┌ 导入成功 ──────────────────────┐  │
│  │ ✅ 晶体已生成 — MyCrystal      │  │
│  │    1024 字符 · Tier 1 · SAFE  │  │
│  │ [▼ 高级设置] [重新导入]        │  │
│  └────────────────────────────────┘  │
│                                      │
│  [💎 确认结晶] ← 主要行动按钮        │
└──────────────────────────────────────┘
```

### 3.3 自动解析逻辑设计

核心函数 `parseTextToPayload()` 包含 6 个独立的检测器：

| 检测器 | 算法 | 示例 |
| :----- | :--- | :--- |
| `extractName()` | 文件名 → 第一行(去markdown标记) → 时间戳fallback | "你是一个代码审查专家" → "你是一个代码审查专家" |
| `detectBandGap()` | 关键词正则匹配 (restricted > caution > multimodal > tool > safe) | "api_key=xxx" → caution |
| `detectTier()` | API endpoint 检测 → Tier 3, 文件系统 → Tier 2, 其他 → Tier 1 | "https://api.openai.com" → Tier 3 |
| `detectFormat()` | 11 种格式关键词匹配 | "输出 JSON 格式" → JSON |
| `detectEndpoints()` | URL 正则提取 | "https://api.example.com" → ["https://api.example.com"] |
| 唤醒词生成 | 随机前缀 + 名称缩写 | "Initialize Code Reviewer" |

---

## 4. 实现步骤

### 4.1 Step 1 — 审计当前代码

**操作**: 完整阅读 `ForgingPlatform.tsx` (448 行)

**发现**:
- 表单状态管理使用 `useState<kipPayload>` + `setField()` 通用路径设置函数
- Canvas 预览通过 `SigilForge` 类实现，400ms 防抖
- 重结晶流程有 `recrystallizePayload` prop 支持预填充
- 提交按钮的 `disabled` 只依赖 `isForging` (来自 useCrystalRuntime 的状态)

**结论**: 状态管理结构清晰，可以直接扩展。

### 4.2 Step 2 — 设计 Auto-Parser

**操作**: 在组件文件头部编写独立的解析工具函数（不依赖 React）

**关键代码**:

```typescript
// 格式检测器 — 关键词→格式映射表
const FORMAT_KEYWORDS: Array<{ pattern: RegExp; format: string }> = [
  { pattern: /\bjson\b/i,             format: 'JSON' },
  { pattern: /\bmarkdown\b|\bmd\b/i,   format: 'Markdown' },
  // ... 共 11 种格式
];

// 带隙推断 — 高危关键词优先
function detectBandGap(text: string): BandGapLevel {
  if (/\b高危|危险|删除|destroy|delete|rm\s+-rf|高危权限/i.test(text))
    return 'restricted';
  // ... 4 级优先级判断
  return 'safe'; // 默认安全
}

// 主解析函数 — 合成完整 KipPayload
function parseTextToPayload(inputText: string, fileName?: string): KipPayload {
  // 1. 提取名称
  // 2. 检测格式/带隙/Tier
  // 3. 提取 URL
  // 4. 生成唤醒词
  // 5. 构建 System Prompt (截断至 4000 字符)
  // 6. 组装完整 payload
}
```

### 4.3 Step 3 — 添加 Quick Import 状态

**操作**: 在组件内部新增 4 个状态变量

```typescript
const [quickMode, setQuickMode] = useState(true);
const [importText, setImportText] = useState('');
const [importFileName, setImportFileName] = useState('');
const [importSuccess, setImportSuccess] = useState(false);
const [showAdvanced, setShowAdvanced] = useState(false);
```

**设计考量**:
- `quickMode`: 控制是否显示「快速导入面板」还是「成功摘要」
- `showAdvanced`: 控制高级表单的折叠/展开
- 两个状态分离而非合并，确保动画切换平滑

### 4.4 Step 4 — 实现 Quick Import UI 面板

**操作**: 在表单顶部插入 Quick Import 面板，使用 Framer Motion 动画

**UI 层次**:
1. 标题区域: 动态 subtitle 提示用户当前模式
2. Quick Import 面板: 蓝色边框高亮 (`borderColor: 'var(--kip-tool)'`)
   - 文本输入框 (10 行高)
   - 文件拖放/上传区
   - 实时解析预览 (条件显示)
   - "⚡ 一键生成晶体结构" 按钮
3. 导入成功摘要: 绿色面板 + 晶体信息
4. 高级表单 (折叠): `AnimatePresence` 控制展开/收起
5. 结晶按钮: Quick Mode 下无导入内容时禁用

### 4.5 Step 5 — 处理文件导入

**操作**: 实现 `handleFileImport()` 和 `handleDrop()` 方法

```typescript
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
```

**支持的文件类型**: .txt, .md, .json, .yaml, .yml, .csv, .html, .xml, .py, .js, .ts

### 4.6 Step 6 — 修复类型问题

**操作**: 运行 TypeScript 编译检查

| 问题 | 位置 | 修复 |
| :--- | :--- | :--- |
| `match` 隐式 `any` 类型 | `detectEndpoints()` 中 `let match;` | 改为 `let match: RegExpExecArray \| null;` |
| `FormEvent` 已弃用 | `handleSubmit(e: React.FormEvent)` | 改为 `React.SyntheticEvent` |

### 4.7 Step 7 — 更新开发规范文档

**操作**: 在 `SPEC_20260607_CRYSTAL_STUDIO_DEVELOPMENT.md` 中：
- 数据流图增加 Quick Import 路径
- 铸造台说明更新为「快速导入 + 6 Facet 全表单」

---

## 5. 关键决策记录

| # | 决策 | 选项 | 选择理由 |
| :- | :--- | :--- | :------- |
| D1 | Auto-Parser 放在组件文件头部 vs 独立模块 | **组件文件头部** | 与 ForgingPlatform 强耦合，现阶段无复用需求，避免过度工程 |
| D2 | Quick Mode 用状态变量 vs 独立的子组件 | **状态变量** | 避免 prop drilling，保持现有表单逻辑不变 |
| D3 | 导入成功后展开高级表单 vs 保持折叠 | **保持折叠** | 用户已声明"太复杂"，成功后应直接结晶而非展示更多字段 |
| D4 | 文本截断阈值 | **4000 字符** | SPEC-KIP-0.1 建议 Logic Facet 40% 面积 ≈ 3000-5000 字符 |
| D5 | 文件读取方式 | **FileReader.readAsText('UTF-8')** | 支持中文等多字节编码，不需要二进制读取 |

---

## 6. 问题与解决

| # | 问题 | 原因 | 解决方式 | 耗时 |
| :- | :--- | :--- | :------- | :--- |
| P1 | git heredoc 提交失败 | commit message 包含中文/特殊字符，shell 嵌套引号冲突 | 改用 `-m` 参数双行提交 (title + body) | 5min |
| P2 | TypeScript `FormEvent` 弃用 | TypeScript 6.x 弃用了旧的 React 事件类型 | 替换为 `React.SyntheticEvent` | 2min |
| P3 | Regex `match` 类型推断错误 | TypeScript 严格模式下 `exec()` 返回 `RegExpExecArray \| null` | 显式类型注解 | 1min |
| P4 | 提交按钮在快速模式无文本时可点击 | `disabled` 只依赖 `isForging` | 增加 `(quickMode && !importText.trim())` 条件 | 1min |

---

## 7. 变更清单

### 7.1 新增代码

`parseTextToPayload()` 及其辅助函数 (~110 行):

| 函数 | 行数 | 职责 |
| :--- | :--- | :--- |
| `FORMAT_KEYWORDS` | 12 | 格式→关键词映射表 |
| `TIER_KEYWORDS` | 3 | Tier 检测关键词表 |
| `WAKE_WORD_PREFIXES` | 1 | 唤醒词前缀池 |
| `detectFormat()` | 8 | 格式检测 |
| `detectTier()` | 8 | 晶级检测 |
| `detectBandGap()` | 6 | 带隙检测 |
| `detectEndpoints()` | 8 | URL 提取 |
| `extractName()` | 11 | 名称提取 |
| `extractFirstLine()` | 3 | 首行文本提取 |
| `parseTextToPayload()` | 34 | 主解析函数 |

### 7.2 修改代码

| 文件 | 变更类型 | 说明 |
| :--- | :------- | :--- |
| `src/pages/ForgingPlatform.tsx` | 重写 | +574 / -234 行，增加 Quick Import 模式 |
| `docs/SPEC_20260607_CRYSTAL_STUDIO_DEVELOPMENT.md` | 更新 | 数据流图和铸造台说明 |

### 7.3 本次新增文档

| 文档 | 说明 |
| :--- | :--- |
| (本文件) | 开发过程记录 |

---

## 8. 验证结果

### 8.1 TypeScript 编译

```
$ npx tsc --noEmit
---TSC OK---
```

无错误、无警告。

### 8.2 Vite 生产构建

```
$ npx vite build
transforming...✓ 427 modules transformed.
dist/index.html                   0.46 kB │ gzip:   0.29 kB
dist/assets/index-BcHMcugy.css   15.24 kB │ gzip:   3.48 kB
dist/assets/index-DVFgyjlk.js   381.08 kB │ gzip: 118.67 kB
✓ built in 159ms
```

构建时间 159ms，产物大小稳定。

### 8.3 功能自检清单

| 功能 | 状态 |
| :--- | :--- |
| 文本粘贴 → 自动解析预览 | ✅ |
| 文件上传 (.txt/.md/.json) | ✅ |
| 文件拖放 (Drag & Drop) | ✅ |
| 一键生成按钮 (含条件禁用) | ✅ |
| 导入成功摘要面板 | ✅ |
| 高级设置折叠/展开 | ✅ |
| 实时 Canvas 预览 | ✅ (保持不变) |
| 结晶按钮状态联动 | ✅ |
| 重结晶工作流 | ✅ (保持不变) |
| 整个页面重置 (重新导入) | ✅ |

---

## 9. Git 提交记录

```
1ef2ccf (HEAD -> main, origin/main) feat: add Quick Import to ForgingPlatform
0a5405f docs: add project audit, development plan, and phase completion summary
fd0a059 feat: complete KIP Level 2 Full Conformance
89e963d refactor: restructure docs under SPEC_ and HIST_ prefixes
...
0e61920 (tag: v0.1.0) feat: publish SPEC-KIP-0.1
```

### 提交详情

```
commit 1ef2ccf
Author: Emberois
Date:   2026-06-07

    feat: add Quick Import to ForgingPlatform
    
    Add Quick Import panel with text paste and document upload, auto-parser
    (parseTextToPayload) for crystal name/Band Gap/Tier/format/endpoints,
    real-time parse preview, import success summary with Advanced Settings
    toggle. Default to quick mode for simplified workflow.
```

---

## 10. 后续建议

| 任务 | 优先级 | 说明 |
| :--- | :----- | :--- |
| 添加大模型驱动的解析增强 | 🟢 低 | 当前基于正则匹配，可用 LLM 解析更复杂的文档结构 |
| Linux/macOS 主目录 `~/.krystal` 存储 | 🟢 低 | 用户导入的模板/预设持久化 |
| 多语言文档支持 | 🟢 低 | 快速导入的 placeholder 提示文案国际化 |

---

*Development Process Log — Authored by Emberois — 2026-06-07*
*Released under CC BY-SA 4.0 International License.*