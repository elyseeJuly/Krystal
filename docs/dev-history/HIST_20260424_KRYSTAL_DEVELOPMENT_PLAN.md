# Krystal 面向对象的全链路开发计划 (Crystal Development Roadmap)

基于 `SPEC-KIP-0.1` 规范与 `developer-guide.md`，为实现**“一次结晶，随处折射”**的视觉 AI 载体生态，我制定了以下从底层协议到前端应用的四个阶段工程化开发计划。

## 0. 技术栈基建选型

为了满足极致的跨平台能力、前端视觉处理需求以及纯本地的运行环境，我们采用以下现代化技术栈：

*   **框架核心**：`React 18` + `Vite` (提供轻量级、快速响应的 Crystal Runtime 环境)
*   **语言**：`TypeScript` (确保状态机流转与 Facet 对象的绝对类型安全)
*   **视觉渲染引擎**：原生 `HTML5 Canvas API` 结合 `WebGL/Three.js` (处理核心的 Sigil 美学层渲染与 1-2px 光晕的 Band Gap 滤镜)
*   **加密与指纹**：`Web Crypto API` (前端原生的 SHA-256 计算，保障完全离线防篡改)
*   **隐写数据处理**：`upng-js` 或 `pako` 用于处理 PNG Chunk 与二进制 LSB (最低有效位) 读写，确保全无损。
*   **样式方案**：原生 CSS3 Variables + `Framer Motion` (实现物理动效的色散与解理动画，杜绝通用组件库的廉价感，遵循 Sigil 美学)。
*   **AI 通信桥梁**：基于 Web-LLM (实现纯本地小模型运行) 或 OpenAI/Gemini SDK 的跨模型适配层。

## 1. 骨架构建期 (The Skeleton Phase) —— Xtal 底层工具链

**目标：实现 `.krys` 文件的无损读写与防篡改校验。**

### 核心任务：
1.  **暗轨处理器 (Dark Track CLI/SDK)**
    *   构建 `KrystalEncoder`：将 JSON 载荷序列化、压缩并写入 PNG 的私有 Chunk (如 `kiPl`)。
    *   构建 `KrystalDecoder`：从图片流中反序列化提取底层的无损 JSON 载荷。
2.  **晶格校验引擎 (Xtal-Validator)**
    *   实现核心校验算法：`Hash(视觉像素数据 + 底层JSON载荷 + 带隙色值)`。
    *   构建安全级别拦截器，对应 `🟢 Safe`, `🟡 Caution`, `🔴 Restricted` 输出状态变量。
3.  **大纲产出**：输出 `@krystal-protocol/core` NPM 核心包，支持 Node.js 与 Browser 双端环境。

## 2. 视觉引擎期 (Sigil Forging Phase) —— 渲染模块开发

**目标：实现 Krystal 图像的 “三层六面” 自动化生成与高保真输出。**

### 核心任务：
1.  **Canvas 蓝图搭建 (Canvas Blueprint)**
    *   固定 1024x1024 尺寸，精准划分辨识区：居中 40% 留给晶核。
    *   实现象限锁定锚点 (Quadrant Lock Anchors)：四角与交叉点渲染 `#FF00FF` 2x2px 定位点。
2.  **带隙色彩生成器 (Band Gap Generator)**
    *   根据安全等级渲染 1-2px 的精确色环（如 `#E30022` 等）。
3.  **明轨编码与锚点写入 (Light Track & Text Anchors)**
    *   实现六晶面排版系统 (Hex-Facet Layout)。
    *   实现基于文本锚点 (如 `[INPUT]`, `[LOGIC]`) 的隐写视觉化排版（Data Filigree 伪装长条纹金丝编码）。
4.  **UI/美学填充支持**
    *   保留 `The Core` 区域给人类审美，开发将基础图片居中裁切置入的核心功能。

## 3. 灵魂注入期 (Crystal Runtime Phase) —— 状态机系统编排

**目标：将组件交互规范化，基于 KIP 协议建立闭环的事件运转流。**

### 核心任务：
1.  **状态机中枢控制 (CR State Machine Controller)**
    *   利用 React `useReducer` 或 `XState` 构建严谨的状态转换器，严格约束 `IDLE -> MOUNTING -> VALIDATING -> DISPERSING -> REFRACTING -> COMPLETE / CLEAVAGE` 流转。
2.  **生命周期钩子编写**
    *   `useCrystallize()`：拦截 Prompt，调用渲染器与编码器，生成 `.krys` 下载。
    *   `useRefract()`：读取用户加载的图片，执行验证、解析、分发，唤起大模型交互通道。
3.  **晶格缺陷/失配防御兜底层**
    *   实现最高层级的 `ErrorBoundary`。当 Xtal-Validator 返回 Hash 不匹配时，强制触发 `CR_MISMATCH` 大屏警告，并锁定系统直至点击"解理 (Cleavage)"。
4.  **离线降级分发器 (Offline Fallback Dispatcher)**
    *   检测到网络失联且晶体属于 Tier 3 时，降级抽取 `[CORRECTION]` 面板代码执行。

## 4. 晶体工坊期 (Crystal Studio App) —— 前端交互与美学封顶

**目标：落地一个极具未来感与魔法工业风格的 “晶体工作台” (Crystal Workbench)。**

### 核心任务：
1.  **全局主题体系 (Sigil Design System)**
    *   抛弃大厂 Flat/Material Design，构建暗黑高对比、霓虹微光泽的深层美学体验。
    *   视觉隐喻：工作台表现为“切割盘(Facet Plate)”与“折射棱镜(Refractive Prism)”。
2.  **全生命周期 UI 映射**
    *   **挂载中**：扫描光束特效解读图片指纹。
    *   **校验中**：带隙闪烁，通过则呈现绿色波纹，高危强制全屏红框阻塞拦截。
    *   **色散**：图片炸裂散开，六个晶面分别飞出化为前端可交互的 Inputs (如输入表单)。
3.  **交互功能模块**
    *   **铸造台 (Forging Platform)**：让用户上传图片、输入核心 Prompt 逻辑、配置依赖，点击“结晶”。
    *   **观测站 (Observatory/Refraction view)**：上传已有的 `.krys` 图片执行使用。

---

## ⚠️ User Review Required

基于以上总体方案，请确认以下三个架构级决策：

1.  **核心库分离**：我计划将 `Xtal-Compiler/Validator` 剥离为无 UI 的纯逻辑 SDK (`krystal-core`)，再由 `Crystal Studio` 引入它构建 GUI。这样便于未来其他终端（比如后端、移动端应用）接入分析系统。您是否同意此拆分？
2.  **存储介质优先**：在暗轨隐写方案中，相比 LSB 最低有效位容易被压缩损坏，由于我们定位于 AI 时代，社交媒体分享频繁，我建议核心采用 **PNG/WebP Chunk 块注入 (EXIF 扩展)** 方案，具备更高的跨平台生存率。
3.  **执行路径**：按照此计划，下一步应该创建具体的工程结构，优先开发 **"阶段 1：骨架构建期 (krystal-core 解析底层)"**。

请对以上计划进行评估并给出指示。一旦核准，我将启动 `krystal-core` SDK 的代码搭建。
