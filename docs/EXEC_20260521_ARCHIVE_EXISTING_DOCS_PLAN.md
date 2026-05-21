# EXEC_20260521_ARCHIVE_EXISTING_DOCS_PLAN.md — 历史文档规范化重组方案
> **版本号**: V1.0.0
> **基于**: [SPEC_20260520_GLOBAL_DEVELOPMENT_STANDARDS.md](file:///Users/quantumrose/Documents/Emberois/SPEC_20260520_GLOBAL_DEVELOPMENT_STANDARDS.md)
> **创建日期**: 2026-05-21
> **目标**: 将 Krystal 项目现有的历史文档、开发指南及模块规范，按照最新的“分类+日期”双重命名公式与全局分类前缀重新物理归档，并保持全项目内链接的 100% 完整与一致，最终同步至 GitHub。

---

## 一、 技术假设与执行规则 (Explicit Assumptions)
1. **历史真实性**：重命名中使用的日期戳必须反映各文档的实际历史编写/发布日期。对于 2026-04-24（KIP协议发布）与 2026-04-28（Crystal Studio v0.1发布）这两个时间节点创建的文档，分别采用对应时间戳 `20260424` 和 `20260428`。
2. **连接稳定性 (Match Links)**：在物理移动和重命名文件后，必须立刻且精准地更新所有对它们的外部引用（如 `README.md`），杜绝任何断链。
3. **极简操作**：使用最少、最直接的 `git mv` 命令实现物理文件的重命名，保留完整的 Git 提交历史（Commit History）。

---

## 二、 物理重命名映射表 (Rename Mapping)

### 1. 规格说明书与开发指南 (SPEC_)
*   `docs/developer-guide.md` 
    ➔ `docs/SPEC_20260424_KIP_DEVELOPER_GUIDE.md`
*   `docs/modules/Module_1_Architecture_Vocabulary.md` 
    ➔ `docs/modules/SPEC_20260424_MODULE_1_ARCHITECTURE_VOCABULARY.md`
*   `docs/modules/Module_2_UI_Visual_Rendering.md` 
    ➔ `docs/modules/SPEC_20260424_MODULE_2_UI_VISUAL_RENDERING.md`
*   `docs/modules/Module_3_Data_Parsing_Extraction.md` 
    ➔ `docs/modules/SPEC_20260424_MODULE_3_DATA_PARSING_EXTRACTION.md`
*   `docs/modules/Module_4_Interaction_Flow_State_Machine.md` 
    ➔ `docs/modules/SPEC_20260424_MODULE_4_INTERACTION_FLOW_STATE_MACHINE.md`
*   `docs/modules/Module_5_Security_Fallback.md` 
    ➔ `docs/modules/SPEC_20260424_MODULE_5_SECURITY_FALLBACK.md`

### 2. 历史档案与归档 (HIST_)
*   `docs/dev-history/2026-04-24_kip_publication_walkthrough.md` 
    ➔ `docs/dev-history/HIST_20260424_KIP_PUBLICATION_WALKTHROUGH.md`
*   `docs/dev-history/2026-04-24_krystal_development_plan.md` 
    ➔ `docs/dev-history/HIST_20260424_KRYSTAL_DEVELOPMENT_PLAN.md`
*   `docs/dev-history/2026-04-28_crystal_studio_v0.1_task_log.md` 
    ➔ `docs/dev-history/HIST_20260428_CRYSTALSTUDIO_V0.1_TASK_LOG.md`
*   `docs/dev-history/2026-04-28_CrystalStudio_v0.1_TaskLog_FINAL.md` 
    ➔ `docs/dev-history/HIST_20260428_CRYSTALSTUDIO_V0.1_TASKLOG_FINAL.md`
*   `docs/dev-history/2026-04-28_CrystalStudio_v0.1_Walkthrough_FINAL.md` 
    ➔ `docs/dev-history/HIST_20260428_CRYSTALSTUDIO_V0.1_WALKTHROUGH_FINAL.md`

---

## 三、 外部依赖修改方案
我们需要修改 [README.md](file:///Users/quantumrose/Documents/Emberois/Krystal/README.md) 中的第 58-63 行和第 76 行，以修正文档索引中的文件名，保持跳转链接有效。

---

## 四、 验证与同步计划
1. **静态检查**：确认所有 `git mv` 操作无红灯报错。
2. **编译/类型校验**：本重命名仅针对 `docs/` 下的 Markdown 文档，不影响核心代码，但仍需保证前端项目构建顺利。
3. **GitHub 同步**：
   ```bash
   git add .
   git commit -m "refactor: restructure docs under SPEC_ and HIST_ prefixes as per Global Standards"
   git push
   ```
