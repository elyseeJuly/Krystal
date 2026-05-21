# Krystal 开发任务追踪

## 阶段 0 — 技术栈初始化
- [x] 确认技术栈：React 18 + Vite + TypeScript
- [x] 确认隐写方案：PNG Chunk 块注入优先
- [x] 确认架构：krystal-core SDK + Crystal Studio 前端分离

## 阶段 1 — 骨架构建期 (Skeleton Phase) ✅ 完成
- [x] 初始化 Vite + React + TypeScript 项目结构
- [x] 建立目录架构 (src/core/)
- [x] 实现 KIP 类型定义 (types.ts)
- [x] 实现 KrystalDecoder (暗轨提取：PNG Chunk kiPl → tEXt → LSB stub)
- [x] 实现 KrystalEncoder (暗轨写入：PNG chunk 注入 + CRC-32)
- [x] 实现 XtalValidator (SHA-256 Web Crypto + Band Gap + 黑名单)
- [x] 阶段1产物：core/index.ts 完整导出

## 阶段 2 — 视觉引擎期 (Sigil Forging Phase) ✅ 完成
- [x] Canvas 蓝图引擎 (1024×1024 六晶面布局)
- [x] 象限锁定锚点渲染 (#FF00FF 2×2px)
- [x] 带隙色彩生成器 + 光晕 (Band Gap Generator)
- [x] 六晶面文本锚点写入 ([INPUT] [LOGIC] 等)
- [x] Data Filigree 金丝条纹伪装渲染
- [x] 晶核区域图片居中裁切置入

## 阶段 3 — 灵魂注入期 (Crystal Runtime Phase) ✅ 完成
- [x] CR 状态机 (CrystalRuntime.ts — useReducer 完整流转)
- [x] useCrystalRuntime() Hook (含 crystallize + loadKrys + refract + cleavage)
- [x] Lattice Mismatch 全屏告警
- [x] Lattice Defect Toast
- [x] 离线降级检测 (navigator.onLine)

## 阶段 4 — 晶体工坊期 (Crystal Studio App) ✅ 完成
- [x] Sigil 设计系统 (Orbitron/Rajdhani/ShareTechMono, CSS Variables)
- [x] 铸造台 (ForgingPlatform.tsx) — 六切面表单 + 实时 Canvas 预览
- [x] 观测站 (Observatory.tsx) — .krys 拖拽上传 + 色散手风琴 + 折射操作
- [x] 全生命周期动画 (Framer Motion)
- [x] 阶段4产物：App.tsx — Tab 导航 + 全局告警覆盖层 + 带隙权限拦截 Modal
- [x] UI 风格重构：Neutral Dreamy Glassmorphism (中性梦幻玻态)
- [x] 专属端口配置：Vite Port 5773 (避免与 EnigmaCard 冲突)
- [x] 跨平台启动器：创建 .command (Mac) & .bat (Win)
- [x] TypeScript 0 错误验证通过
- [x] 历程备份：同步所有历程文档至 GitHub
- [x] 最终提交：GitHub Push (commit: 41e29d9)
- [x] 实时预览：http://localhost:5773/
