# Crystal Studio — 测试文档

> **Test Suite Documentation — Vitest v3.2.6**
> Author: Emberois | Date: 2026-06-07

---

## 1. 测试框架概览

| 项目 | 值 |
| :--- | :--- |
| **框架** | Vitest v3.2.6 |
| **运行环境** | Node.js (via `vitest run`) |
| **配置文件** | `vite.config.ts` — `test` 属性 |
| **测试文件位置** | `src/core/__tests__/` |
| **测试文件匹配** | `src/**/*.test.ts`, `src/**/*.test.tsx` |
| **总数** | 4 个文件 · 60 个测试用例 · 全部通过 |
| **运行时间** | ~700ms |

### 1.1 快速开始

```bash
# 运行全部测试（CI 模式）
npm test

# 监听模式（开发时）
npm run test:watch

# 运行单个测试文件
npx vitest run src/core/__tests__/CrystalRuntime.test.ts

# 运行单个测试用例（通过名称过滤）
npx vitest run --reporter=verbose -t "happy path"
```

### 1.2 配置说明

测试配置集成在 [`vite.config.ts`](../../crystal-studio/vite.config.ts) 中：

```typescript
test: {
  globals: true,        // 全局 API（describe/it/expect）
  environment: 'node',  // Node.js 环境（无 DOM）
  include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
}
```

---

## 2. 测试文件清单

### 2.1 [`CrystalRuntime.test.ts`](../../crystal-studio/src/core/__tests__/CrystalRuntime.test.ts)

**测试目标**: `core/CrystalRuntime.ts` — CR 状态机 Reducer

| 分组 | 测试数 | 覆盖内容 |
| :--- | :----- | :------- |
| initial state | 1 | IDLE/null payload/null blob/!offline |
| happy path | 7 | IDLE→MOUNTING→VALIDATING→DISPERSING→REFRACTING→COMPLETE→CLEAVAGE→IDLE |
| error paths | 6 | CR_DEFECT/CR_MISMATCH 各阶段、→CLEAVAGE→IDLE 恢复 |
| recrystallize | 1 | COMPLETE→MOUNTING |
| offline | 2 | CR_DETECT_OFFLINE true/false |
| illegal transitions | 4 | 非法事件保持当前状态 |

**关键测试模式**: 使用 `stateAfter(...actions)` 辅助函数模拟多步状态机链：

```typescript
const s = stateAfter(
  { type: 'CR_CRYSTALLIZE' },
  { type: 'PARSE_SUCCESS', payload: MOCK_PAYLOAD, imageBlob: MOCK_BLOB },
  { type: 'VALIDATION_PASS' },
  { type: 'CR_REFRACT' },
  { type: 'REFRACT_COMPLETE' },
);
expect(s.state).toBe('COMPLETE');
```

### 2.2 [`KrystalEncoder.test.ts`](../../crystal-studio/src/core/__tests__/KrystalEncoder.test.ts)

**测试目标**: `core/KrystalEncoder.ts` — 暗轨 PNG chunk 注入引擎

| 分组 | 测试数 | 覆盖内容 |
| :--- | :----- | :------- |
| encode() | 5 | Blob 类型、尺寸增长、PNG 签名保持、JSON 内容嵌入、tEXt chunk 检测 |
| forgeKrys() | 1 | forgeKrys === encode |

**关键测试模式**: 创建最小有效 PNG（68 字节），注入 MOCK_PAYLOAD 后校验：

```typescript
it('should embed payload JSON', async () => {
  const result = await encoder.encode(createMinimalPNG(), MOCK_PAYLOAD);
  const bytes = new Uint8Array(await result.arrayBuffer());
  // 在结果 buffer 中搜索 JSON 字符串
  expect(findBytes(bytes, jsonBytes)).toBe(true);
});
```

### 2.3 [`ForgingParser.test.ts`](../../crystal-studio/src/core/__tests__/ForgingParser.test.ts)

**测试目标**: ForgingPlatform Quick Import 自动解析函数

| 分组 | 测试数 | 覆盖内容 |
| :--- | :----- | :------- |
| detectBandGap | 6 | safe/caution/restricted/multimodal/tool + 优先级 |
| detectFormat | 5 | JSON/Markdown/Code/Instruction/Plaintext |
| detectTier | 3 | Tier 1/2/3 |
| detectEndpoints | 3 | URL 提取/去重/空 |
| extractName | 3 | 文件名/首行/Markdown 符号 |
| parse integration | 5 | 含 API 文档 / 纯文本 / 长文本截断 / 图像检测 / CSV 检测 |

**覆盖的正则边界情况**:
- 中文 `图片` → multimodal ✓
- 中文 `api_key=xxx` → caution ✓（`\b` 在中英边界生效）
- 中文 `你是一个` → format: Instruction ✓
- 中文 `本地` → Tier 2 ✓
- `https://...` → Tier 3 + caution ✓
- `rm -rf /` → restricted ✓

### 2.4 [`Types.test.ts`](../../crystal-studio/src/core/__tests__/Types.test.ts)

**测试目标**: `core/types.ts` — KIP 类型常量值

| 分组 | 测试数 | 覆盖内容 |
| :--- | :----- | :------- |
| BAND_GAP_COLORS | 7 | 5 色值 × HEX 格式 + 数量 + sRGB 格式 |
| QUADRANT_LOCK_COLOR | 1 | #FF00FF |

---

## 3. 测试数据策略

### 3.1 Mock 数据

所有测试文件使用模块级 `MOCK_PAYLOAD` 常量：

```typescript
const MOCK_PAYLOAD: KipPayload = {
  kipVersion: '0.1',
  crystalId: 'test-uuid',
  crystalName: 'Test Crystal',
  // ... 完整 6 Facet 结构
  fingerprint: { algorithm: 'SHA-256', hash: 'abc123', covers: [...] },
};
```

### 3.2 最小 PNG

Encoder 测试使用运行时生成的最小有效 PNG（1×1 像素灰度图, 68 bytes），避免依赖外部文件。

### 3.3 状态机链

CrystalRuntime 测试使用 `stateAfter(...)` 函数构建状态转换链，确保每个状态转换的前置条件完整。

---

## 4. 边界条件覆盖

| 维度 | 测试用例示例 |
| :--- | :----------- |
| 空值 | `detectEndpoints('纯文本内容')` → `[]` |
| 长文本 | 5000 字符 → 截断至 4022（4000 + 注释） |
| 非法状态转换 | `CR_REFRACT` 从 `IDLE` → 保持 `IDLE` |
| 优先级冲突 | `使用 API key 来删除数据` → `restricted`（覆盖 caution） |
| Unicode 中文 | `分析图片` / `你是一个` / `删除` / `本地` |
| 特殊字符 | `rm -rf /` / `api_key=xxx` / `https://example.com` |

---

## 5. CI 集成

```bash
# 完整 CI 流程
npm test                 # 单元测试
npx tsc --noEmit         # TypeScript 编译检查
npx vite build           # 生产构建验证
```

---

## 6. 测试覆盖率目标

| 模块 | 当前覆盖 | 目标 |
| :--- | :------- | :--- |
| CrystalRuntime (reducer) | 21 tests — 全部状态转换 | ✅ |
| KrystalEncoder (encode) | 5 tests — 核心路径 | 🔄 需添加边缘路径 |
| ForgingParser (5 检测器) | 25 tests — 全部检测器 | ✅ |
| Types (常量值) | 8 tests — 全部常量 | ✅ |
| KrystalDecoder | 0 tests | 🔴 待添加 |
| XtalValidator | 0 tests | 🔴 待添加（需 crypto mock） |
| SigilForge | 0 tests | 🔴 待添加（需 Canvas mock） |

---

*Test Suite Documentation — Authored by Emberois — 2026-06-07*
*Released under CC BY-SA 4.0 International License.*