<div align="center">

# 💎 Krystal — Krystallized Intent Protocol (KIP)

**将 AI 能力封装为视觉编码、自包含、可执行图像文件的开放标准。**
**An open standard for encapsulating AI capabilities into visually-encoded, self-contained executable files.**

[![Status](https://img.shields.io/badge/Status-Archived-inactive?style=for-the-badge)](https://github.com/elyseeJuly/Krystal)
[![Spec Version](https://img.shields.io/badge/SPEC-KIP_0.1_(Draft)-blueviolet?style=for-the-badge)](./SPEC-KIP-0.1.md)
[![License](https://img.shields.io/badge/License-CC_BY--SA_4.0-orange?style=for-the-badge)](./LICENSE)
[![Author](https://img.shields.io/badge/Author-Emberois-teal?style=for-the-badge)](https://github.com/elyseeJuly)

</div>

---

> ## ⚠️ 已归档 / Archived
>
> **本项目为实验级作品。技术层面的实际实现与理想设计之间存在巨大差距，因此选择将仓库归档，仅作为学习与参考用途保留。**
>
> **This is an experimental-grade project. There is a substantial gap between the technical implementation and the ideal design; the repository has therefore been archived and is preserved for learning and reference purposes only.**
>
> 归档后仓库为只读状态，不再接受 Issue、Pull Request 或任何形式的更新。

---

## 📖 项目简介

**KIP（Krystallized Intent Protocol，晶化意图协议）** 定义了一种新的 AI 能力分发范式：

> 将 AI 提示词、逻辑与执行指令打包进一个**可视化图像文件**（`.krys`），使其同时具备**人类审美价值**与**多模态 AI 可读性**，可在任意多模态 AI 模型上执行。

可类比为 **"AI Prompts 的 Docker，但容器是一颗宝石。"**

### 核心特性

| 特性 | 说明 |
| :--- | :--- |
| 🌐 **模型无关** | 任意多模态 AI 均可读取并执行 `.krys` 文件 |
| 📦 **自包含** | 单一文件 = 完整 AI 能力载体 |
| 🛡️ **防篡改** | SHA-256 指纹 + Band Gap 色彩校验 |
| 🗜️ **抗压缩** | 双轨解析机制，可在社交媒体压缩后存活 |
| ✈️ **离线优先** | Tier 1-2 Krystals 可在本地模型上 100% 离线运行 |
| 🎨 **审美丰富** | Sigil 设计语言——赛博朋克与古典宝石几何的融合 |

---

## 📐 架构 — 三位一体 (The Trinity)

```
┌─────────────────────────────────────────────┐
│  Skeleton Layer    │ KIP Protocol + .krys   │
│  (骨架层)           │ 文件格式标准            │
├─────────────────────────────────────────────┤
│  Soul & Experience │ Crystal Studio +       │
│  (灵魂与体验层)     │ Sigil Design Language  │
├─────────────────────────────────────────────┤
│  Toolchain Layer   │ Xtal-Compiler +        │
│  (工具链层)         │ Xtal-Validator         │
└─────────────────────────────────────────────┘
```

| 层 | 名称 | 说明 |
| :--- | :--- | :--- |
| **骨架层** | KIP Protocol | 定义数据编码与文件结构的核心协议标准 |
| **灵魂与体验层** | Crystal Studio | 面向终端用户的应用与美学设计语言 |
| **工具链层** | Xtal Ecosystem | 编译器、校验器与开发者基础设施 |

---

## 📂 项目结构

```
Krystal/
├── SPEC-KIP-0.1.md                         ← KIP 核心协议规范
├── README.md                                ← 项目主页（本文件）
├── LICENSE                                  ← CC BY-SA 4.0
├── crystal-studio/                          ← Crystal Studio 前端应用
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx                         ← 入口
│       ├── App.tsx                          ← 根组件
│       ├── core/                            ← 核心引擎层
│       │   ├── types.ts                     ← KIP 类型定义
│       │   ├── CrystalRuntime.ts            ← 状态机
│       │   ├── KrystalDecoder.ts            ← 暗轨解码
│       │   ├── KrystalEncoder.ts            ← 暗轨编码
│       │   ├── XtalValidator.ts             ← 指纹校验
│       │   └── SigilForge.ts               ← Canvas 渲染
│       ├── hooks/
│       │   └── useCrystalRuntime.ts         ← 运行时 Hook
│       └── pages/
│           ├── ForgingPlatform.tsx           ← 铸造台
│           ├── Observatory.tsx               ← 观测站
│           └── ClusterWorkshop.tsx           ← 晶簇工坊
└── docs/                                     ← 完整文档集
    ├── SPEC_20260424_KIP_DEVELOPER_GUIDE.md  ← 开发指南
    ├── SPEC_20260607_CRYSTAL_STUDIO_DEVELOPMENT.md ← 开发规范
    ├── USERGUIDE_20260607_CRYSTAL_STUDIO.md  ← 用户指南
    ├── AUDIT_20260607_PROJECT_AUDIT.md       ← 项目审计报告
    ├── PLAN_20260607_DEVELOPMENT_PLAN.md     ← 开发规划
    ├── SUMMARY_20260607_PHASE_COMPLETION.md  ← 阶段总结
    ├── TEST_20260607_TEST_SUITE.md           ← 测试套件说明
    ├── HIST_20260607_DEVELOPMENT_PROCESS.md  ← 开发历程
    ├── modules/                              ← 模块规范文档 (5 个)
    └── dev-history/                          ← 开发历史记录 (4 个)
```

---

## 🔬 核心技术要点

### 文件格式 (`.krys`)

双层容器结构：

- **视觉层** (PNG/WebP)：人类可见的图像
- **隐写层** (Steganographic Layer)：机器可读的 JSON 载荷

载荷包含：`kip_version`、`crystal_id`、`crystal_tier`、`band_gap_level`、`facets`（六切面）、`fingerprint`（SHA-256）。

### 视觉编码 — 三层六面布局

| 层 | 名称 | 说明 |
| :--- | :--- | :--- |
| **Core (晶核)** | 人类审美层 | 占画布 40%，纯粹美学价值 |
| **Band Gap (带隙)** | 状态指示层 | 1-2px 发光晕，5 级颜色权限门控 |
| **6 Facets (六晶面)** | 模型执行层 | 数据金丝工艺高密度编码 |

**六切面方向映射**：

| 位置 | 切面 | 信息占比 | 内容 |
| :--- | :--- | :------- | :--- |
| 👑 顶部 | Crown | 10% | 名称、版本、唤醒词 |
| ↗️ 右上 | Input | 15% | 输入格式与 schema |
| ↘️ 右下 | Logic | 40% | 核心 System Prompt |
| 👢 底部 | Output | 15% | 输出格式与语气模板 |
| ↙️ 左下 | Inclusion | 10% | 外部知识索引 |
| ↖️ 左上 | Correction | 10% | 纠错冗余与反幻觉 |

### 双轨解析机制

| 优先级 | 轨道 | 方法 | 目标保真度 |
| :----- | :--- | :--- | :--------- |
| 1 (最高) | 暗轨 | LSB 隐写、PNG chunk 提取 | 100% 无损 JSON |
| 2 (降级) | 明轨 | 多模态 AI 视觉读取文本锚点 | ≥70% 核心逻辑恢复 |

### 晶级分类 (Crystal Tier)

| Tier | 名称 | 离线能力 | 外部依赖 |
| :--- | :--- | :------- | :------- |
| **1** | Pure Crystal | ✅ 100% 离线 | 无 |
| **2** | Enhanced Crystal | ✅ 100% 离线 | 无，逻辑更丰富 |
| **3** | Connected Crystal | ⚠️ 降级模式 | 可含 Inclusions，必须提供本地 fallback |

### Band Gap 权限门控

| 级别 | 颜色 | Hex | 前端行为 |
| :--- | :--- | :-- | :------- |
| 🟢 Safe | 孔雀石绿 | `#0BDA51` | 静默折射 |
| 🟡 Caution | 琥珀金 | `#FFBF00` | 弹窗确认 |
| 🔴 Restricted | 辰砂红 | `#E30022` | 强制确认后执行 |
| 🔵 Tool | 标准蓝 | `#2979FF` | 工具调用提示 |
| 🟣 Multimodal | 幻影紫 | `#B388FF` | 多模态任务 |

### Crystal Runtime 状态机

```
IDLE → MOUNTING → VALIDATING → DISPERSING → REFRACTING → COMPLETE → CLEAVAGE
                    ↓                                         ↓
              LATTICE_DEFECT / LATTICE_MISMATCH
```

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- npm ≥ 9

### 安装与运行

```bash
cd crystal-studio
npm install
npm run dev          # 启动开发服务器 (http://localhost:5773)
```

### 常用命令

```bash
npm run build        # 生产构建
npm run test         # 运行测试 (Vitest)
npm run lint         # ESLint 检查
npm run preview      # 预览生产构建
```

### 使用流程

**终端用户**：
1. 打开 Crystal Studio → `http://localhost:5773`
2. **铸造台 (Forge)**：粘贴文本或上传文档 → 点击"一键生成" → 下载 `.krys` 文件
3. **观测站 (Observe)**：拖入 `.krys` 文件查看切面或通过 AI 模型折射执行
4. **晶簇工坊 (Cluster)**：将多个 Krystal 组合为多智能体协作工作流

**开发者**：
1. 阅读 [SPEC-KIP-0.1](./SPEC-KIP-0.1.md) 协议规范
2. 参照 [开发指南](./docs/SPEC_20260424_KIP_DEVELOPER_GUIDE.md) 实现
3. 运行测试：`cd crystal-studio && npm test`
4. 构建生产包：`cd crystal-studio && npm run build`

---

## 📚 完整文档索引

| 文档 | 说明 |
| :--- | :--- |
| [**SPEC-KIP-0.1.md**](./SPEC-KIP-0.1.md) | 📋 核心协议规范 (RFC 风格) |
| [**开发指南**](./docs/SPEC_20260424_KIP_DEVELOPER_GUIDE.md) | 🔧 面向 AI Agent 与开发者的完整实现指南 |
| [**开发规范**](./docs/SPEC_20260607_CRYSTAL_STUDIO_DEVELOPMENT.md) | 📐 Crystal Studio 架构与编码标准 |
| [**用户指南**](./docs/USERGUIDE_20260607_CRYSTAL_STUDIO.md) | 📖 Crystal Studio 分步使用说明 |
| [**测试套件**](./docs/TEST_20260607_TEST_SUITE.md) | 🧪 测试架构与覆盖说明 |
| [**项目审计**](./docs/AUDIT_20260607_PROJECT_AUDIT.md) | 🔍 SPEC 合规性与代码质量审计 |
| [**开发规划**](./docs/PLAN_20260607_DEVELOPMENT_PLAN.md) | 🗺️ Phase 0–5 路线图与剩余任务 |
| [**开发历程**](./docs/HIST_20260607_DEVELOPMENT_PROCESS.md) | 📝 按时间顺序的开发记录 |
| [**阶段总结**](./docs/SUMMARY_20260607_PHASE_COMPLETION.md) | 📊 里程碑完成报告 |
| [**模块 1**](./docs/modules/SPEC_20260424_MODULE_1_ARCHITECTURE_VOCABULARY.md) | 🏗️ 架构与词汇参考 |
| [**模块 2**](./docs/modules/SPEC_20260424_MODULE_2_UI_VISUAL_RENDERING.md) | 🎨 UI 渲染与视觉物理 |
| [**模块 3**](./docs/modules/SPEC_20260424_MODULE_3_DATA_PARSING_EXTRACTION.md) | 📡 数据解析与提取协议 |
| [**模块 4**](./docs/modules/SPEC_20260424_MODULE_4_INTERACTION_FLOW_STATE_MACHINE.md) | 🔄 交互流程与状态机 |
| [**模块 5**](./docs/modules/SPEC_20260424_MODULE_5_SECURITY_FALLBACK.md) | 🛡️ 安全与离线降级 |

---

## 🛠️ 技术栈

| 类别 | 技术 |
| :--- | :--- |
| 语言 | TypeScript 6.x |
| 框架 | React 19 |
| 构建 | Vite 8 |
| 测试 | Vitest 3 |
| 动画 | Framer Motion 12 |
| 压缩 | pako (zlib) |
| 协议 | CC BY-SA 4.0 |

---

## 📊 质量度量

| 维度 | 数值 |
| :--- | :--- |
| 核心模块 | 5 个 TypeScript 模块 |
| UI 页面 | 3 个 React 页面 |
| 代码总量 | ~2,900 行 |
| KIP Level 1 合规 | 6/6 (100%) |
| KIP Level 2 合规 | 5/5 (100%) |
| TypeScript 严格模式 | 启用 |
| 生产构建 | JS 374 KB (gzip 116 KB) / CSS 15 KB (gzip 3.5 KB) |

---

## 📄 许可证

本项目基于 [**Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**](./LICENSE) 协议发布。

- ✅ 可分享、改编与二次创作
- ✅ 可用于商业用途
- ⚠️ 必须署名 **Emberois**
- ⚠️ 衍生作品必须使用相同协议

---

<div align="center">

**Created by Emberois · 2026**

*Crystallizing the future of AI capability distribution.*

</div>
