# EXEC_20260521_ARCHIVE_EXISTING_DOCS_TASK.md — 历史文档规范化重组进度清单
> **版本号**: V1.0.0
> **创建日期**: 2026-05-21

## 任务执行清单

- [x] **第一部分：物理重组 (Git MV 重命名)**
  - [x] 重命名 `developer-guide.md` 为 `SPEC_20260424_KIP_DEVELOPER_GUIDE.md`
  - [x] 重命名 `docs/modules/` 下的五大模块文档（前缀改为 `SPEC_20260424_`）
    - [x] Module 1 -> `SPEC_20260424_MODULE_1_ARCHITECTURE_VOCABULARY.md`
    - [x] Module 2 -> `SPEC_20260424_MODULE_2_UI_VISUAL_RENDERING.md`
    - [x] Module 3 -> `SPEC_20260424_MODULE_3_DATA_PARSING_EXTRACTION.md`
    - [x] Module 4 -> `SPEC_20260424_MODULE_4_INTERACTION_FLOW_STATE_MACHINE.md`
    - [x] Module 5 -> `SPEC_20260424_MODULE_5_SECURITY_FALLBACK.md`
  - [x] 重命名 `docs/dev-history/` 下的所有历史记录（前缀改为 `HIST_`）
    - [x] 2026-04-24 KIP Publication Walkthrough -> `HIST_20260424_KIP_PUBLICATION_WALKTHROUGH.md`
    - [x] 2026-04-24 Krystal Development Plan -> `HIST_20260424_KRYSTAL_DEVELOPMENT_PLAN.md`
    - [x] 2026-04-28 task log -> `HIST_20260428_CRYSTALSTUDIO_V0.1_TASK_LOG.md`
    - [x] 2026-04-28 TaskLog FINAL -> `HIST_20260428_CRYSTALSTUDIO_V0.1_TASKLOG_FINAL.md`
    - [x] 2026-04-28 Walkthrough FINAL -> `HIST_20260428_CRYSTALSTUDIO_V0.1_WALKTHROUGH_FINAL.md`

- [x] **第二部分：全项目链接同步**
  - [x] 更新 `README.md` 的文档索引表格，映射到重命名后的新文件路径
  - [x] 校验新路径是否可以完全访问，且不出现死链接

- [x] **第三部分：状态沉淀与三方验证**
  - [x] 创建 `EXEC_20260521_ARCHIVE_EXISTING_DOCS_WALKTHROUGH.md`
  - [x] 提交并推送到 GitHub 远程仓库的 `main` 分支

---
> [!NOTE]
> 每当 AI 助手完成清单中的子任务时，须立即更新 `[x]` 标记，确保执行状态的绝对实时与透明。
