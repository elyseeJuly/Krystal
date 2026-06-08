# 开发过程记录 — 导出功能增强 + GitHub Pages 修复

> **Development Process Log — Export Enhancement & GitHub Pages Fix**
> Date: 2026-06-07 | Author: Emberois
> Previous: `HIST_20260607_DEVELOPMENT_PROCESS.md`

---

## 1. 会话概述

| 项目 | 内容 |
| :--- | :--- |
| **日期** | 2026-06-07 |
| **焦点** | 导出功能完善 + GitHub Pages 404 修复 |
| **用户反馈** | "目前只实现了导入功能，没有实现导出功能"、"修复GitHub pages404的问题" |
| **涉及文件** | `SigilForge.ts`, `KrystalEncoder.ts`, `ForgingPlatform.tsx`, `vite.config.ts`, `.github/workflows/static.yml`, `public/404.html` (新建) |
| **产出版本** | commit `3ae47aa` + `76f218e` |

---

## 2. 问题分析

### 2.1 导出功能缺陷

审计发现导出流程存在 3 个问题：

| # | 问题 | 影响 | 严重级别 |
| :- | :--- | :--- | :------- |
| E1 | 默认晶核使用简陋渐变替代 | 用户不传图时输出的 .krys 视觉效果差 | 🟡 中 |
| E2 | KrystalEncoder.encode() 硬编码 IHDR 位置 `8+25` | 某些浏览器生成的 PNG 可能 IHDR 位置不同 → chunk 注入位置错误 → 文件损坏 | 🔴 高 |
| E3 | 导出成功后无视觉反馈 | 用户不知道下载已完成 | 🟡 中 |

### 2.2 GitHub Pages 404 诊断

| # | 问题 | 根因 | 严重级别 |
| :- | :--- | :--- | :------- |
| G1 | Workflow 部署了整个仓库根目录 | `path: '.'` → 部署的是源码目录而非构建产物 | 🔴 高 |
| G2 | Vite 缺少 `base` 配置 | 在 `elyseeJuly.github.io/Krystal/` 下 JS/CSS 路径应为 `/Krystal/assets/...` | 🔴 高 |
| G3 | 缺少 SPA 404 回退 | GitHub Pages 对 `/Krystal/forge` 等子路径返回 404 | 🔴 高 |

---

## 3. 修复方案

### 3.1 默认晶核 — 8 面宝石晶体

在 `SigilForge.drawCore()` 中，当 `sigilImage` 为 null 时绘制完整的宝石图形：

```
Layer 结构:
┌────────────────────────┐
│  1. 径向渐变背景        │
│     #2a2a4a → #06060e  │
│                        │
│  2. 8 个三角切面        │
│     交替亮度:            │
│     i%2=0 → 40% 透明度  │
│     i%2=1 → 55% 透明度  │
│                        │
│  3. 十字星芒高光         │
│     rgba(255,255,255,   │
│           0.12)         │
│                        │
│  4. 外发光边框 + 内环    │
└────────────────────────┘
```

### 3.2 Encode — IDAT 搜索式注入

将 `KrystalEncoder.encode()` 从硬编码 `8 + 25` 改为：

```
1. 扫描 buffer 搜索 "IDAT" chunk type
   → 找到后在其前插入 kiPl + tEXt chunk
2. 若未找到 IDAT，搜索 "IEND"
3. 最后回退: 8 + 25
```

### 3.3 导出成功 Banner

在 `ForgingPlatform.tsx` 中添加：

- `exportSuccess` 状态 + `wasForgingRef` 跟踪 `isForging` 下降沿
- 导出完成时显示绿色 Banner，5 秒自动消失：
  ```
  ✅ Krystal 已导出 — Code_Reviewer_v1.0.0.krys
  .krys 文件已下载到本地
  ```

### 3.4 GitHub Pages 修复

| 修复 | 文件 | 变更内容 |
| :--- | :--- | :------- |
| 构建+部署 | `static.yml` | 添加 `setup-node` step + `npm ci` + `npm run build`，部署目录改为 `crystal-studio/dist` |
| 基础路径 | `vite.config.ts` | `base: mode === 'production' ? '/Krystal/' : '/'` |
| SPA 回退 | `public/404.html` | 新建，2 秒后自动重定向至 `/Krystal/`，保留路径参数 |

---

## 4. 实现步骤

### Step 1 — 审计导出流程

**操作**: 完整阅读 `useCrystalRuntime.crystallize()` + `SigilForge.forge()` + `KrystalEncoder.encode()`

**发现**:
- crystallize 流程完整: forge → computeFingerprint → forgeKrys → download
- SigilForge 默认晶核仅是深色渐变 + 6 条线
- Encode 假设 IHDR 总是 `8+25`

### Step 2 — 重写默认晶核

**操作**: 在 `SigilForge.drawCore()` 中替换 fallback 分支

**代码变更**:
```typescript
// Before: 6 lines + radial gradient
// After: 8-faceted gemstone with shimmer
const facets = 8;
for (let i = 0; i < facets; i++) {
  // Draw two triangles per facet iteration
  // Alternating brightness: 0.3-0.55 vs 0.2-0.35
}
// Cross-shaped highlight (4 lines at π/8 offset)
// Outer glow border + inner accent ring
```

### Step 3 — 重写 KrystalEncoder.encode()

**操作**: 替换硬编码位置为 IDAT 搜索

**代码变更**:
```typescript
// Before:
const insertionPoint = 8 + 25;

// After:
// Search for 'IDAT' chunk type in buffer
for (let i = 8; i < buffer.length - 4; i++) {
  if (/* match I, D, A, T */) {
    idatIndex = i; break;
  }
}
// Fallback to IEND, then 8+25
const insertionPoint = idatIndex - 4;
```

### Step 4 — 添加导出反馈

**操作**: 在 `ForgingPlatform.tsx` 中添加状态跟踪和 Banner

```typescript
const [exportSuccess, setExportSuccess] = useState(false);
const wasForgingRef = useRef(false);

useEffect(() => {
  if (wasForgingRef.current && !isForging && importSuccess) {
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 5000);
  }
  wasForgingRef.current = isForging;
}, [isForging, importSuccess]);
```

### Step 5 — 修复 GitHub Pages

**操作**:
1. 重写 `static.yml` — 构建 + 部署 dist
2. `vite.config.ts` — 条件 `base`
3. 创建 `public/404.html`

### Step 6 — 验证

```
TSC:     ---TSC OK---
Tests:   60/60 passed
Build:   243ms, dist/ 含 index.html + 404.html + assets/
PNG:     dist/index.html 中资源路径为 /Krystal/assets/...
```

---

## 5. 关键决策记录

| # | 决策 | 选项 | 选择理由 |
| :- | :--- | :--- | :------- |
| D1 | IDAT 搜索的起始偏移量 | **`i = 8`** (PNG 签名后) | IHDR 之前没有其他 chunk，8 是安全的起点 |
| D2 | `base` 控制方式 | **`defineConfig(({ mode }) => ...)`** | 利用 Vite 内置的 mode 参数，无需额外环境变量 |
| D3 | 404 重定向延迟 | **2 秒** | 让用户看到跳转提示信息，不突兀 |
| D4 | 8 面 vs 6 面宝石 | **8 面** | 8 面对称更接近真实宝石切工，偶数面便于交替亮度 |

---

## 6. 问题与解决

| # | 问题 | 原因 | 解决方式 | 耗时 |
| :- | :--- | :--- | :------- | :--- |
| P1 | `vite.config.ts` 中 `test` 属性类型错误 | Vite 8 不支持直接引用 `vitest` 类型 | 改为 `/// <reference types="vitest/config" />` | 2min |
| P2 | GitHub push 被拒绝 | 远程有新的提交 | `git stash && git pull --rebase && git stash pop` | 3min |
| P3 | package-lock.json 未提交导致 rebase 失败 | 有未暂存的 package-lock.json 变更 | 单独 commit + push | 2min |

---

## 7. 变更清单

| 文件 | 变更 | 说明 |
| :--- | :--- | :--- |
| `src/core/SigilForge.ts` | 修改 | 默认晶核从渐变→完整 8 面宝石图形 |
| `src/core/KrystalEncoder.ts` | 修改 | encode() IDAT 搜索式 chunk 注入 |
| `src/pages/ForgingPlatform.tsx` | 修改 | 添加导出成功 Banner |
| `vite.config.ts` | 修改 | 条件 `base` + 修复类型引用 |
| `.github/workflows/static.yml` | 重写 | 构建 + 部署 dist |
| `public/404.html` | 新建 | SPA 回退页面 |
| `package-lock.json` | 修改 | vitest 依赖锁定 |

---

## 8. Git 提交记录

```
3ae47aa fix: enhance export flow — default gemstone sigil, robust PNG injection, download feedback
76f218e chore: commit package-lock.json (vitest dependency)
```

**`3ae47aa` 详情**:
- SigilForge: 8 面宝石晶体（径向渐变 + 三角面 + 星芒高光 + 发光边框 + 内环）
- KrystalEncoder: IDAT chunk 搜索式注入（原硬编码 8+25）
- ForgingPlatform: 导出成功 Banner（动画渐入，5s 自动消失）
- 构建验证: TSC + 60 tests + Vite build 全部通过

**`76f218e`**:
- commit: vitest 依赖的 package-lock.json

---

*Development Process Log — Authored by Emberois — 2026-06-07*
*Released under CC BY-SA 4.0 International License.*