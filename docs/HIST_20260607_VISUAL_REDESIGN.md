# 开发过程记录 — 晶核视觉重渲染 + GitHub Pages 修复

> **Development Process Log — Sigil Visual Redesign & GitHub Pages Fix**
> Date: 2026-06-07 | Author: Emberois
> Session: 3 (continued from HIST_20260607_EXPORT_ENHANCE.md)

---

## 1. 会话概述

| 项目 | 内容 |
| :--- | :--- |
| **日期** | 2026-06-07 (Session 3) |
| **焦点** | 晶核视觉重渲染 + GitHub Actions CI 修复 |
| **用户反馈** | 导出的.krys文件不是一张可看图、大模型可直接读取的图片 |
| **涉及文件** | `SigilForge.ts`, `KrystalEncoder.test.ts`, `ForgingParser.test.ts`, `Types.test.ts`, `ClusterWorkshop.tsx`, `vite.config.ts`, `.github/workflows/static.yml`, `public/404.html` |
| **产出版本** | commit `84ec7cd` |

---

## 2. 问题分析

### 2.1 GitHub Actions 构建失败

| # | 问题 | 根因 | 修复 |
| :- | :--- | :--- | :--- |
| G1 | 7 个 TS 错误阻断 `tsc -b` | `tsconfig.app.json` 中 `noUnusedLocals: true` | 移除未使用变量、修复类型索引 |
| G2 | `tsc --noEmit` 能过但 `tsc -b` 不能 | `tsc -b` 使用项目引用 (`tsconfig.json` 委派 `tsconfig.app.json`) | 删 `node_modules/.tmp/tsbuildinfo` 后重试 |

### 2.2 晶核视觉不可读

| # | 问题 | 影响 | 严重级别 |
| :- | :--- | :--- | :------- |
| V1 | 6 晶面文字仅 8px | 人类看不清，AI 视觉模型无法 OCR | 🔴 高 |
| V2 | 背景 `rgba(8,8,16,0.92)` 极暗 | 文字几乎不可见 | 🔴 高 |
| V3 | 文字颜色为 `${accentColor}CC` 半透明 | 雪上加霜，完全不可读 | 🔴 高 |
| V4 | 无晶体概要信息 | 打开图片不知道这个 Krystal 是干嘛的 | 🟡 中 |

---

## 3. 修复方案 — SigilForge 完全重写

### 3.1 字体尺寸提升

| 用途 | 旧值 | 新值 |
| :--- | :--- | :--- |
| 面板标签 | 10px bold | 13px bold |
| 晶体名称标题 | 12px bold | 16px bold |
| 面板内容 | 8px | 11px |
| 底部信息 | — | 9px |

### 3.2 六晶面重设计

**Top Crown Facet** — 不再是暗色数据丝线，而是：
- 背景：`${accentColor}22` 半透明色块
- 居中显示晶体名称（16px bold + 发光）
- 第二行显示版本 · 唤醒词 · Tier 等级

**其他 5 面板** — 使用 `drawFacetPanel`：
- 渐变背景（深色但有层次）：`rgba(10,10,24,0.95)` → `rgba(16,12,28,0.92)`
- 面板名称 13px bold + 发光
- 数据条纹金丝工艺（隔 6px 水平线，`${accentColor}15`）
- 内容 11px 自动换行截断

### 3.3 视觉结构

```
┌──────────────────────────────────────────┐
│  [CORRECTION]        [INPUT]              │
│                     [CRYSTAL NAME]        │
│                v1.0 · wake word · Tier 3  │
│                ┌──────────────────┐       │
│  [INCLUSION]   │   8面宝石晶体     │ [LOGIC]│
│                │   带隙色光环      │       │
│                │   (3px双环)      │       │
│                └──────────────────┘       │
│                [OUTPUT]                   │
│   KIP v0.1 · SAFE · SHA-256 abc123...    │
└──────────────────────────────────────────┘
```

### 3.4 Band Gap 增强

| 元素 | 旧 | 新 |
| :--- | :- | :- |
| 发光 | `shadowBlur: 12` | `shadowBlur: 20` |
| 环宽 | 2px | 3px + 1px 第二环 |
| 标签 | 无 | 右上角显示 `SAFE` / `CAUTION` 等 |

### 3.5 底部指纹行

新增页脚：`KIP v0.1 · SAFE · SHA-256 abcdef123456…`

---

## 4. 实现步骤

### Step 1 — `npm run build` 失败诊断

**操作**: 运行 `npm run build` → 看到 7 个 TS 错误

**发现**: `tsconfig.app.json` 的 `noUnusedLocals: true` 将测试文件中的未使用变量视为错误

**修复文件**:
- `ForgingParser.test.ts`: 移除未使用的 `BAND_GAP_COLORS`
- `KrystalEncoder.test.ts`: 移除 `iendData`；`kipBytes` 改用字符串搜索
- `Types.test.ts`: 类型索引修复（`string` → `keyof typeof`）
- `ClusterWorkshop.tsx`: 移除 `getAssembly`、`fromNodes`、`BAND_GAP_LABELS`

### Step 2 — SigilForge 重写

**操作**: 重写整个 `src/core/SigilForge.ts`

**主要变更**:
- 新增 `drawWrappedText()` — 通用自动换行 + 裁剪 + 截断标记
- 新增 `drawFacetPanel()` — 统一面板背景/标签/金丝/内容
- 顶部 Crown 改为居中发光标题
- 底部新增页脚行
- `drawCore()` 宝石亮度提升、中心高光点
- Band Gap 从 2px 增至 3px + 文字标签 + 第二外环

### Step 3 — 构建验证

```
npm test:      60/60 passed
npm run build: tsc -b ✓ → vite build ✓ (157ms)
```

---

## 5. 关键决策

| # | 决策 | 理由 |
| :- | :--- | :--- |
| D1 | 11px 面板内容字体 | 1024px canvas + 188px 面板宽度下，11px 每行约 16 字符，兼顾可读性和信息量 |
| D2 | 3px Band Gap + 1px 外层 | SPEC 原定 1-2px，但作为安全指示器需要更醒目 |
| D3 | 不在 Core 中显示面板内容 | Core 40% 区域按 SPEC 仅作为美学层，所有文字信息放在六晶面 |
| D4 | 底部指纹行 | 人眼和 AI 视觉模型均可确认晶体完整性，辅助 OCR 校验 |

---

## 6. 变更清单

| 文件 | 变更 | 说明 |
| :--- | :--- | :--- |
| `src/core/SigilForge.ts` | **重写** | 完全重写视觉渲染：字体提升、面板重设计、Band Gap 增强、新 footer |
| `src/core/__tests__/ForgingParser.test.ts` | 修改 | 移除未使用的 `BAND_GAP_COLORS` |
| `src/core/__tests__/KrystalEncoder.test.ts` | 修改 | 移除 `iendData`、`kipBytes` → 字符串搜索 |
| `src/core/__tests__/Types.test.ts` | 修改 | 类型索引 `keyof typeof` |
| `src/pages/ClusterWorkshop.tsx` | 修改 | 移除 `getAssembly`、`fromNodes`、`BAND_GAP_LABELS` |
| `.github/workflows/static.yml` | 修改 | 构建 + 部署 dist |
| `crystal-studio/vite.config.ts` | 修改 | 条件 `base` + 修复类型引用 |
| `crystal-studio/public/404.html` | **新建** | SPA 回退页面 |

---

## 7. Git 提交记录

```
6299629 docs: add dev process log; fix: GitHub Pages 404 - build+deploy dist, SPA 404 fallback, conditional base
84ec7cd fix: resolve 7 TypeScript errors in npm run build (tsc -b)
```

`84ec7cd` — 修复所有 `tsc -b` 错误 + 重写 SigilForge 视觉渲染

---

*Development Process Log — Authored by Emberois — 2026-06-07*
*Released under CC BY-SA 4.0 International License.*