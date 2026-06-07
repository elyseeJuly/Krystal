# Crystal Studio — 开发规范文档

> **KIP Level 2 Full Conformance Implementation**
> Version: 0.1.0 | Author: Emberois | Date: 2026-06-07

---

## 目录

1. [项目概述](#1-项目概述)
2. [架构总览](#2-架构总览)
3. [目录结构](#3-目录结构)
4. [模块实现状态](#4-模块实现状态)
5. [KIP 合规性清单](#5-kip-合规性清单)
6. [开发工作流](#6-开发工作流)
7. [构建与部署](#7-构建与部署)
8. [代码规范](#8-代码规范)
9. [附录](#9-附录)

---

## 1. 项目概述

### 1.1 Crystal Studio

**Crystal Studio** 是 KIP (Krystallized Intent Protocol) 协议的标准前端实现，位于架构的「灵魂与体验层」(Soul & Experience Layer)。它为用户提供：

- **铸造台 Forge** — 创建新的 .krys 晶体文件
- **观测站 Observatory** — 加载、校验、折射已有晶体
- **晶簇工坊 Cluster Workshop** — 组装多个晶体为多 Agent 协同工作流

### 1.2 技术栈

| 技术 | 用途 |
| :--- | :--- |
| React 19 + TypeScript | UI 框架 |
| Vite 8 | 构建工具 |
| Framer Motion | 动画与过渡 |
| Web Crypto API (SHA-256) | 指纹校验 |
| Canvas API | Sigil 视觉渲染 |
| OpenAI / Gemini API | AI 模型折射 |

### 1.3 合规等级

当前实现达到 **KIP Level 2 — Full Conformance**，满足 SPEC-KIP-0.1 §7.2 的全部要求。

---

## 2. 架构总览

### 2.1 三位一体 (Trinity)

```
┌─────────────────────────────────────────────┐
│  Skeleton Layer    │ KIP Protocol + .krys   │
│  (骨架层)           │ File Format Standard   │
├─────────────────────────────────────────────┤
│  Soul & Experience │ Crystal Studio +       │
│  (灵魂与体验层)     │ Sigil Design Language  │
├─────────────────────────────────────────────┤
│  Toolchain Layer   │ Xtal-Compiler +        │
│  (工具链层)         │ Xtal-Validator         │
└─────────────────────────────────────────────┘
```

### 2.2 数据流

```
用户输入 → ForgingPlatform (表单 / 快速导入)
              │
              ├── 快速导入: 粘贴文本/上传文档 → parseTextToPayload()
              │             自动填充 6 个切面 + Band Gap + Tier
              │
              ▼
         SigilForge (Canvas 渲染)
              │
              ▼
         KrystalEncoder (PNG 暗轨注入)
              │
              ▼
         下载 .krys 文件
              │
              ▼
         Observatory (加载)
              │
              ▼
         KrystalDecoder (暗轨解析)
              │
              ├── 成功 → XtalValidator (校验)
              │              │
              │              ▼
              │         Dispersion (色散展示)
              │              │
              │              ▼
              │         Refract (AI 折射)
              │
              └── 失败 → Light Track (OCR 明轨降级)
```

### 2.3 Crystal Runtime 状态机

```
IDLE → MOUNTING → VALIDATING → DISPERSING → REFRACTING → COMPLETE
                   │              │             │
                   ▼              ▼             ▼
               MISMATCH        DEFECT        DEFECT
                   │              │             │
                   ▼              ▼             ▼
               CLEAVAGE ←────────┴─────────────┘
                   │
                   ▼
                 IDLE
```

---

## 3. 目录结构

```
crystal-studio/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.tsx                    # 入口文件
│   ├── App.tsx                     # 根组件 (路由 + 状态管理)
│   ├── App.css                     # 遗留样式 (待迁移)
│   ├── index.css                   # 全局 CSS 变量 + Sigil 设计系统
│   ├── styles/
│   │   └── App.css                 # 布局与组件样式
│   ├── core/                       # 核心引擎层
│   │   ├── index.ts                # 公共 API 导出
│   │   ├── types.ts                # KIP 类型定义
│   │   ├── CrystalRuntime.ts       # 状态机 (Reducer)
│   │   ├── KrystalDecoder.ts       # 暗轨解析 + 明轨降级
│   │   ├── KrystalEncoder.ts       # kiPl 暗轨注入
│   │   ├── XtalValidator.ts        # SHA-256 指纹 + 带隙校验
│   │   └── SigilForge.ts           # Canvas 三层六面渲染
│   ├── hooks/
│   │   └── useCrystalRuntime.ts    # 运行时 Hook (AI 模型适配)
│   ├── pages/
│   │   ├── ForgingPlatform.tsx      # 铸造台
│   │   ├── Observatory.tsx          # 观测站
│   │   └── ClusterWorkshop.tsx      # 晶簇工坊
│   └── assets/
│       └── hero.png
```

---

## 4. 模块实现状态

### 4.1 Phase 0 — 骨架层 (Skeleton)

| 模块 | 文件 | 状态 | 说明 |
| :--- | :--- | :--- | :--- |
| 类型定义 | `types.ts` | ✅ 完成 | BandGap, Facet, KipPayload, CrystalState 等全部类型 |
| 暗轨解码 | `KrystalDecoder.ts` | ✅ 完成 | 支持 kiPl chunk / tEXt chunk / LSB 三优先级 |
| 明轨降级 | `KrystalDecoder.ts` | ✅ 完成 | parseLightTrack() 文本锚点提取 |
| 暗轨编码 | `KrystalEncoder.ts` | ✅ 完成 | kiPl + tEXt 双 chunk 注入，CRC32 校验 |
| 晶格校验 | `XtalValidator.ts` | ✅ 完成 | SHA-256 指纹 + Band Gap + 黑名单 |
| 状态机 | `CrystalRuntime.ts` | ✅ 完成 | 9 状态 + 12 事件完整转换表 |

### 4.2 Phase 2 — 秘符铸造 (Sigil Forging)

| 功能 | 状态 | 说明 |
| :--- | :--- | :--- |
| 三层六面布局 | ✅ 完成 | Core (40%) + Band Gap (2px halo) + 6 Facets |
| 六晶面方位映射 | ✅ 完成 | Crown(top) / Input(UR) / Logic(DR) / Output(bottom) / Inclusion(LL) / Correction(UL) |
| 数据金丝工艺 | ✅ 完成 | 扫描线 + 锚点标签 + 发光阴影 |
| 象限锁定锚点 | ✅ 完成 | 8 个 #FF00FF 2×2px 锚点 |
| 晶核图像注入 | ✅ 完成 | 用户可选上传 sigil 图像 |
| 分辨率约束 | ✅ 完成 | 1024×1024 正方形 |

### 4.3 Phase 3 — 灵魂注入 (Soul Injection)

| 功能 | 状态 | 说明 |
| :--- | :--- | :--- |
| useCrystalRuntime Hook | ✅ 完成 | 完整生命周期管理 |
| 离线检测 | ✅ 完成 | navigator.onLine 事件监听 |
| Tier 3 离线降级 | ✅ 完成 | Correction Facet fallback 自动触发 |
| AI 模型适配 | ✅ 完成 | OpenAI / Gemini / WebLLM / Custom |
| 重结晶工作流 | ✅ 完成 | 加载已有晶体 → 编辑 → 重新结晶 |

### 4.4 Phase 4 — 晶体工坊 (Crystal Studio)

| 页面 | 状态 | 说明 |
| :--- | :--- | :--- |
| 铸造台 Forge | ✅ 完成 | 快速导入 (粘贴文本/上传文档 → 自动解析填充) + 6 Facet 全表单 + Band Gap 选择 + 实时预览 + 下载 |
| 观测站 Observatory | ✅ 完成 | 拖放加载 + 校验 + 色散展示 + 折射 + 明轨降级 |
| 晶簇工坊 Cluster | ✅ 完成 | 多文件拖放 + 交互式连线 + 拓扑排序执行 + 结果展示 |

### 4.5 Phase 5 — 晶簇组装 (Cluster Assembly)

| 功能 | 状态 | 说明 |
| :--- | :--- | :--- |
| 多晶体拖放 | ✅ 完成 | 批量 .krys 文件导入 |
| 交互式连线 | ✅ 完成 | 选择源节点 → 点击目标 → 自定义标签 |
| 拓扑排序 | ✅ 完成 | 按 DAG 依赖顺序执行 |
| 上游数据传递 | ✅ 完成 | 上游输出自动拼接为下游输入 |
| 晶簇校验 | ✅ 完成 | 节点数、连线数、可达性检查 |
| AI 模型配置 | ✅ 完成 | 与 Observatory 共享 modelConfig |
| 步骤结果展示 | ✅ 完成 | 每个节点独立状态卡片 |

---

## 5. KIP 合规性清单

### 5.1 KIP Level 1 — Minimal Conformance

| 要求 | 状态 | 实现 |
| :--- | :--- | :--- |
| 解析 .krys JSON 载荷 (Dark Track) | ✅ | KrystalDecoder.decode() |
| 校验 Crystal Fingerprint (SHA-256) | ✅ | XtalValidator.verifyFingerprint() |
| Band Gap 权限门控 | ✅ | App.tsx handleRefract() + CautionModal |
| CR 状态机实现 | ✅ | CrystalRuntime.ts reducer |

### 5.2 KIP Level 2 — Full Conformance (额外要求)

| 要求 | 状态 | 实现 |
| :--- | :--- | :--- |
| 渲染合规 Krystal 图像 | ✅ | SigilForge.forge() |
| 双轨解析 (Dark + Light) | ✅ | KrystalDecoder + parseLightTrack() |
| 文本锚点嵌入与读取 | ✅ | ANCHOR_KEYWORDS + OCR 面板 |
| 晶簇组装 (Cluster Assembly) | ✅ | ClusterWorkshop.tsx |
| Tier 3 离线降级 | ✅ | useCrystalRuntime.refract() 离线检测 |

---

## 6. 开发工作流

### 6.1 环境要求

- Node.js >= 20
- npm >= 9

### 6.2 本地开发

```bash
cd crystal-studio
npm install
npm run dev        # 启动开发服务器 (默认 http://localhost:5173)
```

### 6.3 代码检查

```bash
npm run lint       # ESLint 代码规范检查
npx tsc --noEmit   # TypeScript 类型检查
```

### 6.4 构建生产版本

```bash
npm run build      # 输出到 dist/
npm run preview    # 预览生产构建
```

### 6.5 Git 工作流

```bash
# 功能分支
git checkout -b feat/feature-name

# 提交规范
git commit -m "feat: description"   # 新功能
git commit -m "fix: description"    # 修复
git commit -m "docs: description"   # 文档
git commit -m "refactor: description" # 重构
```

### 6.6 分支策略

- `main` — 稳定发布分支
- `feat/*` — 功能开发分支
- `fix/*` — 修复分支

---

## 7. 构建与部署

### 7.1 构建产物

```
dist/
├── index.html
└── assets/
    ├── index-[hash].js     # ~374 KB (gzip: ~116 KB)
    └── index-[hash].css    # ~15 KB (gzip: ~3.5 KB)
```

### 7.2 静态部署

Crystal Studio 是纯前端应用，可部署到任何静态托管服务：

- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages

---

## 8. 代码规范

### 8.1 命名约定

| 类别 | 约定 | 示例 |
| :--- | :--- | :--- |
| 组件文件 | PascalCase | `ForgingPlatform.tsx` |
| Hook 文件 | camelCase, use 前缀 | `useCrystalRuntime.ts` |
| 核心模块 | PascalCase | `KrystalDecoder.ts` |
| 类型文件 | camelCase | `types.ts` |
| 接口/类型 | PascalCase | `KipPayload`, `BandGapLevel` |
| 函数 | camelCase | `parseLightTrack()` |
| 常量 | UPPER_SNAKE | `BAND_GAP_COLORS`, `CANVAS_SIZE` |
| CR 事件 | UPPER_SNAKE, CR_ 前缀 | `CR_CRYSTALLIZE`, `CR_REFRACT` |

### 8.2 文件头注释

每个源文件 MUST 包含以下格式的文件头：

```typescript
/**
 * FileName — 中文名
 * Phase N: Phase description
 *
 * Detailed description of the module.
 *
 * KIP Level 2 Full Conformance
 * Author: Emberois | SPEC-KIP-0.1
 */
```

### 8.3 KIP 术语规范

根据 SPEC-KIP-0.1 Appendix C，禁止使用传统软件术语，统一使用 KIP 等效术语：

| 禁止 | 使用 |
| :--- | :--- |
| App / Application | Crystal / Krystal |
| Install | Crystallize |
| Run / Execute / Invoke | Refract |
| Uninstall / Remove | Cleavage |
| Error / Bug / Exception | Lattice Defect |
| Container | Krystal Carrier |
| Plugin / Extension | Facet |
| Pipeline / Workflow | Cluster Assembly |
| Update / Upgrade | Recrystallize |

### 8.4 CSS 变量命名

全局 CSS 变量遵循 kip- 前缀约定，定义在 `index.css` 中：

```css
--kip-safe / --kip-caution / --kip-restricted / --kip-tool / --kip-multimodal
```

---

## 9. 附录

### 9.1 Band Gap 色值速查

| 等级 | 中文 | Hex | 用途 |
| :--- | :--- | :--- | :--- |
| Safe | 安全 | `#0BDA51` | 纯文本/本地执行 |
| Caution | 警告 | `#FFBF00` | 包含外部 API |
| Restricted | 高危 | `#E30022` | 高危权限 |
| Tool | 工具 | `#2979FF` | 外部工具调用 |
| Multimodal | 多模态 | `#B388FF` | 创意/多模态任务 |

### 9.2 文本锚点关键词

```
[CROWN]  [INPUT]  [LOGIC]  [OUTPUT]  [INCLUSION]  [CORRECTION]
```

### 9.3 晶级分类

| Tier | 名称 | 离线能力 | 外部依赖 |
| :--- | :--- | :--- | :--- |
| 1 | Pure Crystal | 100% 离线 | 无 |
| 2 | Enhanced Crystal | 100% 离线 | 无 |
| 3 | Connected Crystal | 降级离线模式 | 可含 Inclusions |

### 9.4 相关文档

- [SPEC-KIP-0.1](../SPEC-KIP-0.1.md) — 核心协议规范
- [Developer Guide](./SPEC_20260424_KIP_DEVELOPER_GUIDE.md) — 完整开发指南
- [Module 1 — Architecture](./modules/SPEC_20260424_MODULE_1_ARCHITECTURE_VOCABULARY.md)
- [Module 2 — UI Rendering](./modules/SPEC_20260424_MODULE_2_UI_VISUAL_RENDERING.md)
- [Module 3 — Data Parsing](./modules/SPEC_20260424_MODULE_3_DATA_PARSING_EXTRACTION.md)
- [Module 4 — State Machine](./modules/SPEC_20260424_MODULE_4_INTERACTION_FLOW_STATE_MACHINE.md)
- [Module 5 — Security](./modules/SPEC_20260424_MODULE_5_SECURITY_FALLBACK.md)

---

*Crystal Studio Development Specification — Authored by Emberois — 2026-06-07*
*Released under CC BY-SA 4.0 International License.*