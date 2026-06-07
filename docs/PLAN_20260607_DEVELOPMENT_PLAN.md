# Crystal Studio — 开发规划文档

> **Development Plan — KIP Level 2 Full Conformance Implementation**
> Version: 0.1.0 | Author: Emberois | Date: 2026-06-07

---

## 1. 项目总览

### 1.1 项目目标

实现 **KIP (Krystallized Intent Protocol)** 协议的标准前端参考实现 **Crystal Studio**，达成 **KIP Level 2 Full Conformance**。

### 1.2 阶段划分

| 阶段 | 名称 | 周期 | 状态 |
| :--- | :--- | :--- | :--- |
| Phase 0 | 骨架层 (Skeleton) — 核心引擎开发 | 2026-04 中旬 | ✅ 已完成 |
| Phase 1 | 工具链层 (Toolchain) — Xtal 生态 | 2026-04 中旬 | ✅ 已完成 |
| Phase 2 | 秘符铸造 (Sigil Forging) — 视觉渲染引擎 | 2026-04 下旬 | ✅ 已完成 |
| Phase 3 | 灵魂注入 (Soul Injection) — 运行时状态机 | 2026-04 下旬 | ✅ 已完成 |
| Phase 4 | 晶体工坊 (Crystal Studio) — 前端页面 | 2026-04 下旬 ~ 2026-05 | ✅ 已完成 |
| Phase 5 | 晶簇组装 (Cluster Assembly) — 多智能体工作流 | 2026-06 | ✅ 已完成 |

### 1.3 技术路线

```
技术选型:
  React 19 + TypeScript 6 → UI 框架
  Vite 8                 → 构建工具
  Framer Motion 12       → 动画引擎
  Canvas API             → Sigil 视觉渲染
  Web Crypto API         → SHA-256 指纹校验
  OpenAI / Gemini API    → AI 模型折射

架构模式:
  useReducer + Context   → 状态管理 (状态机)
  useCallback            → 性能优化
  受控组件               → 表单管理
  CSS 变量 + glassmorphism → 设计系统
```

---

## 2. 各阶段详细规划

### 2.1 Phase 0 — 骨架层 (Skeleton)

**目标**: 实现 KIP 协议核心数据类型和文件解析/编码引擎

| 任务 | 优先级 | 预估工时 | 依赖 |
| :--- | :----- | :------- | :--- |
| 定义 KIP 核心类型 (Payload, Facets, Fingerprint) | P0 | 2h | 无 |
| 实现 KrystalDecoder — 暗轨解析 (kiPl/tEXt/LSB) | P0 | 4h | 类型定义 |
| 实现 KrystalEncoder — 暗轨写入 (PNG chunk) | P0 | 3h | 类型定义 |
| 实现 XtalValidator — SHA-256 指纹校验 | P0 | 3h | 类型定义 |
| 实现 CrystalRuntime — 状态机 Reducer | P0 | 3h | 类型定义 |
| 实现 parseLightTrack — 明轨文本锚点解析 | P1 | 2h | 类型定义 |
| 核心模块统一导出 index.ts | P1 | 0.5h | 所有核心模块 |

**交付物**: `core/types.ts`, `core/KrystalDecoder.ts`, `core/KrystalEncoder.ts`, `core/XtalValidator.ts`, `core/CrystalRuntime.ts`, `core/index.ts`

### 2.2 Phase 1 — 工具链层 (Toolchain)

**目标**: 构建 Xtal 开发者工具链基础

| 任务 | 优先级 | 预估工时 | 依赖 |
| :--- | :----- | :------- | :--- |
| Xtal-Compiler 基础 (提示词 → JSON 载荷) | P1 | 4h | Phase 0 |
| Xtal-Validator 增强 (黑名单 + 安全审计) | P1 | 2h | Phase 0 |

**交付物**: Xtal 工具链原型（当前阶段以 core/ 模块为基础，后续可独立发布）

### 2.3 Phase 2 — 秘符铸造 (Sigil Forging)

**目标**: 实现 Canvas 三层六面视觉渲染引擎

| 任务 | 优先级 | 预估工时 | 依赖 |
| :--- | :----- | :------- | :--- |
| Canvas 初始化 + 1024×1024 画布 | P0 | 1h | 无 |
| Layer 1: Core (晶核) — 渐变/图像渲染 | P0 | 3h | 无 |
| Layer 2: Band Gap (带隙) — 发光色环 | P0 | 2h | 色值定义 |
| Layer 3: 六晶面 — 数据金丝工艺绘制 | P0 | 4h | 无 |
| 象限锁定锚点 (#FF00FF 2×2px) | P1 | 1h | 无 |
| 文字锚点标签渲染 ([CROWN] 等) | P1 | 1h | 无 |
| 晶核图像上传 + 中心裁剪 | P1 | 2h | 无 |
| 字体加载 + 回退 | P2 | 1h | 无 |

**交付物**: `core/SigilForge.ts`

### 2.4 Phase 3 — 灵魂注入 (Soul Injection)

**目标**: 实现 Crystal Runtime 运行时 Hook，连接状态机与 React UI

| 任务 | 优先级 | 预估工时 | 依赖 |
| :--- | :----- | :------- | :--- |
| useCrystalRuntime Hook 框架 | P0 | 2h | Phase 0 |
| 离线检测 (navigator.onLine) | P0 | 1h | 无 |
| loadKrys — 文件加载与解析 | P0 | 3h | KrystalDecoder |
| crystallize — Sigil 铸造 + 编码 + 下载 | P0 | 4h | SigilForge + KrystalEncoder |
| refract — AI 模型折射 (OpenAI) | P0 | 4h | 无 |
| refract — AI 模型折射 (Gemini) | P1 | 2h | 无 |
| refract — WebLLM 本地模型 (模拟) | P2 | 2h | 无 |
| Tier 3 离线降级 (Correction Facet) | P0 | 2h | 无 |
| Recrystallize 重结晶工作流 | P1 | 2h | 无 |
| Band Gap 色值标签辅助函数 | P1 | 0.5h | 无 |

**交付物**: `hooks/useCrystalRuntime.ts`

### 2.5 Phase 4 — 晶体工坊 (Crystal Studio)

**目标**: 实现三个核心用户界面页面

#### 2.5.1 铸造台 (ForgingPlatform)

| 任务 | 优先级 | 预估工时 | 依赖 |
| :--- | :----- | :------- | :--- |
| 表单框架 + Crown Facet (名称/版本/唤醒词) | P0 | 2h | 无 |
| Band Gap 选择器 (5 级按钮组) | P0 | 2h | 无 |
| Logic Facet (System Prompt 输入) | P0 | 1h | 无 |
| Input/Output Facet 表单 | P1 | 1h | 无 |
| Inclusion Facet (API 端点/知识引用) | P1 | 1h | 无 |
| Correction Facet (降级提示/冗余代码) | P1 | 1h | 无 |
| Sigil 图像上传组件 | P1 | 1h | 无 |
| Canvas 实时预览 (400ms 防抖) | P0 | 3h | SigilForge |
| 重结晶预填逻辑 | P1 | 1h | 无 |
| 下载 .krys 文件 | P0 | 1h | KrystalEncoder |

#### 2.5.2 观测站 (Observatory)

| 任务 | 优先级 | 预估工时 | 依赖 |
| :--- | :----- | :------- | :--- |
| 文件拖放加载 | P0 | 2h | useCrystalRuntime |
| 晶体信息面板 (名称/版本/作者/Tier) | P0 | 2h | 无 |
| 六晶面色散 (手风琴展开) | P0 | 2h | 无 |
| AI 模型配置面板 (Provider/Key/URL) | P0 | 2h | 无 |
| 折射输入 + 执行 | P0 | 2h | useCrystalRuntime |
| 折射结果展示 | P0 | 2h | 无 |
| 明轨 OCR 降级面板 | P1 | 2h | parseLightTrack |
| 带隙安全模态 (Caution/Restricted) | P0 | 3h | 无 |
| 重结晶跳转按钮 | P1 | 1h | 无 |

#### 2.5.3 根组件 (App.tsx)

| 任务 | 优先级 | 预估工时 | 依赖 |
| :--- | :----- | :------- | :--- |
| 三标签页导航 (Forge/Observe/Cluster) | P0 | 2h | ForgingPlatform + Observatory |
| 条件页面渲染 | P0 | 1h | 无 |
| 晶格失配全屏覆盖层 | P0 | 2h | 无 |
| 晶格缺陷 Toast 提示 | P1 | 1h | 无 |
| 底部状态条 (Runtime 状态) | P1 | 1h | 无 |
| 在线/离线指示器 | P1 | 0.5h | 无 |

**交付物**: `pages/ForgingPlatform.tsx`, `pages/Observatory.tsx`, `App.tsx`

### 2.6 Phase 5 — 晶簇组装 (Cluster Assembly)

**目标**: 实现多晶体多智能体协同工作流

| 任务 | 优先级 | 预估工时 | 依赖 |
| :--- | :----- | :------- | :--- |
| ClusterWorkshop 页面框架 | P0 | 2h | 无 |
| 多文件拖放 + KIP 解析 | P0 | 3h | KrystalDecoder |
| 节点网格展示 (Band Gap 着色) | P0 | 2h | 无 |
| 交互式连线创建 (选源 → 点目标) | P0 | 4h | 无 |
| 连线列表 + 删除 | P1 | 1h | 无 |
| 连线标签自定义 | P1 | 1h | 无 |
| 晶簇拓扑校验 (节点/连线/可达性) | P0 | 2h | 无 |
| 拓扑排序执行 (Kahn 算法) | P0 | 3h | 无 |
| 上游数据传递 (链式输出→输入) | P0 | 2h | 无 |
| AI 模型折射集成 (复用 modelConfig) | P0 | 3h | useCrystalRuntime |
| 模拟折射模式 (无 API Key 时) | P1 | 2h | 无 |
| 步骤结果卡片展示 (4 状态) | P0 | 3h | 无 |
| AI 模型配置面板 | P1 | 2h | 无 |
| 离线指示器 | P2 | 0.5h | 无 |

**交付物**: `pages/ClusterWorkshop.tsx`

---

## 3. 剩余任务排期

审计时 (2026-06-07) 发现 Phase 0-4 已全部完成，剩余 Phase 5 晶簇组装任务未完成，此外还有以下补充任务：

### 3.1 高优先级 (立即执行)

| 任务 | 所属阶段 | 计划工时 | 实际工时 | 说明 |
| :--- | :------- | :------- | :------- | :--- |
| 修复 App.tsx cluster 渲染 Bug | Phase 4 | 0.5h | 0.3h | 标签页落入 else 分支 |
| 重写 ClusterWorkshop 交互式连线 | Phase 5 | 3h | 2h | 选源→目标→标签 |
| 实现拓扑排序执行 | Phase 5 | 2h | 1.5h | Kahn BFS 算法 |
| 实现上游数据传递 | Phase 5 | 1h | 0.5h | 链式输出→输入 |
| 实现步骤结果展示 | Phase 5 | 2h | 1h | 4 状态卡片 |
| 实现晶簇拓扑校验 | Phase 5 | 1h | 0.5h | 节点/连线/可达性 |

### 3.2 中优先级 (开发规范)

| 任务 | 计划工时 | 实际工时 | 说明 |
| :--- | :------- | :------- | :--- |
| 开发规范文档 | 2h | 1h | 架构/模块/合规/代码规范 |
| 项目审计报告 | 2h | 1.5h | 模块级+合规级审计 |
| 开发规划文档 | 1h | 1h | 本文件 |
| 开发总结文档 | 1h | 0.5h | 完成情况总结 |

### 3.3 低优先级 (后续迭代)

| 任务 | 说明 |
| :--- | :--- |
| 单元测试 (Decoder/Encoder/Validator) | 提升代码健壮性 |
| LSB 暗轨提取实现 | 增加一种暗轨路径 |
| 晶簇执行取消功能 | 长执行链的中断支持 |
| `FormEvent` 类型迁移 | 消除 TypeScript 6.x 警告 |
| 清除 `App.css` 冗余文件 | 样式文件清理 |

---

## 4. 风险评估

### 4.1 技术风险

| 风险 | 概率 | 影响 | 应对策略 |
| :--- | :--- | :--- | :------- |
| TypeScript 6.x 类型变化 | 低 | 中 | 跟踪发布说明，及时迁移 |
| Vite 8 构建变更 | 低 | 低 | 锁定版本，升级前测试 |
| OpenAI API 接口变更 | 中 | 低 | 抽象适配层，支持多 Provider |
| Canvas 渲染兼容性 | 低 | 低 | 使用标准 Canvas API |

### 4.2 规范风险

| 风险 | 概率 | 影响 | 应对策略 |
| :--- | :--- | :--- | :------- |
| KIP 协议版本升级 | 低 | 中 | 关注 SPEC 更新，按版本迁移 |
| CC BY-SA 4.0 合规 | 低 | 低 | 保持署名和许可证 |

---

## 5. 里程碑

| 里程碑 | 日期 | 交付物 | 状态 |
| :----- | :--- | :----- | :--- |
| M1 — Phase 0 核心引擎完成 | 2026-04 中旬 | core/ 5 模块 | ✅ |
| M2 — Phase 2 Sigil 渲染引擎完成 | 2026-04 下旬 | SigilForge.ts | ✅ |
| M3 — Phase 3 运行时 Hook 完成 | 2026-04 下旬 | useCrystalRuntime.ts | ✅ |
| M4 — Phase 4 前端页面完成 | 2026-04 底 | Forging/Observatory/App | ✅ |
| M5 — 项目审计完成 | 2026-06-07 | AUDIT 报告 | ✅ |
| M6 — Phase 5 晶簇组装完成 | 2026-06-07 | ClusterWorkshop.tsx | ✅ |
| M7 — 开发规范文档完成 | 2026-06-07 | SPEC/PLAN/SUMMARY 文档 | ✅ |
| M8 — GitHub 同步 | 2026-06-07 | commit + push | ✅ |

---

*Crystal Studio Development Plan — Authored by Emberois — 2026-06-07*
*Released under CC BY-SA 4.0 International License.*