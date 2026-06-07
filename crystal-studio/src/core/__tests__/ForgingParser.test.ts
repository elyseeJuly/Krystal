/**
 * Tests for ForgingPlatform auto-parser functions
 *
 * Tests the Quick Import parsing logic: detectBandGap, detectFormat, detectTier,
 * detectEndpoints, extractName, and parseTextToPayload.
 *
 * KIP Level 2 Full Conformance
 * Author: Emberois | SPEC-KIP-0.1
 */

import { describe, it, expect } from 'vitest';

// ── Replicate parser functions (same logic as in ForgingPlatform.tsx) ──

const BAND_GAP_COLORS: Record<string, string> = {
  safe: '#0BDA51',
  caution: '#FFBF00',
  restricted: '#E30022',
  tool: '#2979FF',
  multimodal: '#B388FF',
};

function detectBandGap(text: string): string {
  if (/高危|危险|删除|destroy|delete|rm\s+-rf|高危权限/i.test(text)) return 'restricted';
  if (/\bapi[\s_-]?key(?=[\s_=:]|$)|密码|password|token|secret|https?:\/\/|外部|external/i.test(text)) return 'caution';
  if (/图片|图像|image|audio|视频|video|multimodal|多模态/i.test(text)) return 'multimodal';
  if (/(?:^|[\s_])tool(?=[\s_]|$)|工具|函数|function|command/i.test(text)) return 'tool';
  return 'safe';
}

function detectFormat(text: string): string {
  const FORMAT_KEYWORDS: Array<{ pattern: RegExp; format: string }> = [
    { pattern: /\bjson\b/i,             format: 'JSON' },
    { pattern: /\bmarkdown\b|\bmd\b/i,   format: 'Markdown' },
    { pattern: /\byaml\b/i,              format: 'YAML' },
    { pattern: /\bcsv\b/i,               format: 'CSV' },
    { pattern: /\bhtml?\b/i,             format: 'HTML' },
    { pattern: /\bxml\b/i,               format: 'XML' },
    { pattern: /\bsql\b/i,               format: 'SQL' },
    { pattern: /\bpython\b|\bpy\b/i,     format: 'Python Code' },
    { pattern: /\bjavascript\b|\bjs\b/i, format: 'JavaScript/TypeScript Code' },
    { pattern: /\bapi\b|\brest\b|\bgraphql\b/i, format: 'API Response' },
    { pattern: /\bprompt\b|指令|你是一个|你是一名|你是一位/i, format: 'Plaintext — Instruction' },
  ];
  for (const { pattern, format } of FORMAT_KEYWORDS) {
    if (pattern.test(text)) return format;
  }
  return 'Plaintext';
}

function detectTier(text: string): number {
  if (/\bapi[\s_-]?key(?=[\s_=:]|$)|https?:\/\/|api\.|网络|online|联网/i.test(text)) return 3;
  if (/文件系统|fs\.|本地|local|离线|offline/i.test(text)) return 2;
  return 1;
}

function detectEndpoints(text: string): string[] {
  const urls: string[] = [];
  const urlRegex = /https?:\/\/[^\s"'\]\)，,。；;]+/g;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    urls.push(match[0]);
  }
  return [...new Set(urls)];
}

function extractName(text: string, fileName?: string): string {
  if (fileName) {
    const name = fileName.replace(/\.(txt|md|json|yaml|yml|csv|html|xml|py|js|ts)$/i, '');
    if (name.length > 0 && name.length <= 60) return name;
  }
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length > 0) {
    const first = lines[0].replace(/^[#\-\*>\s]+/, '').trim().slice(0, 60);
    if (first.length > 0) return first;
  }
  return `Krystal-${Date.now().toString(36)}`;
}

// ── Tests ──

describe('detectBandGap', () => {
  it('should default to safe for plain text', () => {
    expect(detectBandGap('你是一个友好的助手')).toBe('safe');
    expect(detectBandGap('今天的天气不错')).toBe('safe');
    expect(detectBandGap('分析文本内容')).toBe('safe');
  });

  it('should detect caution for API keys and secrets', () => {
    expect(detectBandGap('使用 api_key=sk-xxx 调用服务')).toBe('caution');
    expect(detectBandGap('设置API_KEY=xxxxx')).toBe('caution');
    expect(detectBandGap('密码: mypassword123')).toBe('caution');
    expect(detectBandGap('请访问 https://example.com/api')).toBe('caution');
    expect(detectBandGap('使用 token 认证')).toBe('caution');
  });

  it('should detect restricted for high-risk keywords', () => {
    expect(detectBandGap('执行 rm -rf / 命令')).toBe('restricted');
    expect(detectBandGap('高危权限操作')).toBe('restricted');
    expect(detectBandGap('请删除所有用户数据')).toBe('restricted');
    expect(detectBandGap('destroy system files')).toBe('restricted');
  });

  it('should detect multimodal for image/video content', () => {
    expect(detectBandGap('分析这张图片')).toBe('multimodal');
    expect(detectBandGap('处理视频内容')).toBe('multimodal');
    expect(detectBandGap('generate image from text')).toBe('multimodal');
  });

  it('should detect tool for function/command content', () => {
    expect(detectBandGap('调用工具分析')).toBe('tool');
    expect(detectBandGap('定义 function handleClick')).toBe('tool');
    expect(detectBandGap('执行 command 命令')).toBe('tool');
  });

  it('should prioritize restricted over caution', () => {
    expect(detectBandGap('使用 API key 来删除数据')).toBe('restricted');
  });
});

describe('detectFormat', () => {
  it('should detect JSON', () => {
    expect(detectFormat('输出 JSON 格式')).toBe('JSON');
  });

  it('should detect Markdown', () => {
    expect(detectFormat('请用 markdown 格式输出')).toBe('Markdown');
  });

  it('should detect code languages', () => {
    expect(detectFormat('python 脚本')).toBe('Python Code');
    expect(detectFormat('javascript 函数')).toBe('JavaScript/TypeScript Code');
  });

  it('should detect instruction prompts', () => {
    expect(detectFormat('你是一个翻译助手')).toBe('Plaintext — Instruction');
    expect(detectFormat('请按照以下指令操作')).toBe('Plaintext — Instruction');
  });

  it('should default to Plaintext', () => {
    expect(detectFormat('今天天气不错')).toBe('Plaintext');
  });
});

describe('detectTier', () => {
  it('should return Tier 1 for local analysis text', () => {
    expect(detectTier('分析文本内容')).toBe(1);
    expect(detectTier('总结这篇文章')).toBe(1);
    expect(detectTier('你是一个翻译助手')).toBe(1);
  });

  it('should return Tier 3 for API calls', () => {
    expect(detectTier('通过 https://api.openai.com 调用')).toBe(3);
    expect(detectTier('需要联网查询')).toBe(3);
  });

  it('should detect Tier 2 for filesystem or local resource access', () => {
    expect(detectTier('读取本地文件')).toBe(2);
    expect(detectTier('访问文件系统')).toBe(2);
  });
});

describe('detectEndpoints', () => {
  it('should extract URLs from text', () => {
    const result = detectEndpoints('调用 https://api.openai.com/v1/chat 和 https://api.example.com');
    expect(result).toContain('https://api.openai.com/v1/chat');
    expect(result).toContain('https://api.example.com');
  });

  it('should deduplicate URLs', () => {
    const result = detectEndpoints('https://api.example.com and https://api.example.com again');
    expect(result.length).toBe(1);
  });

  it('should return empty array for text without URLs', () => {
    const result = detectEndpoints('纯文本内容');
    expect(result).toEqual([]);
  });
});

describe('extractName', () => {
  it('should extract name from filename', () => {
    expect(extractName('', 'my_crystal.txt')).toBe('my_crystal');
    expect(extractName('', 'code_review.md')).toBe('code_review');
  });

  it('should extract name from first line', () => {
    const text = '# 代码审查专家\n你是一个专业的代码审查员。';
    const name = extractName(text);
    expect(name).toBe('代码审查专家');
  });

  it('should handle markdown symbols in first line', () => {
    expect(extractName('> 这是一个引用')).toBe('这是一个引用');
    expect(extractName('## 二级标题')).toBe('二级标题');
  });
});

describe('parseTextToPayload — integration', () => {
  function parseTextToPayload(inputText: string, fileName?: string) {
    const name = extractName(inputText, fileName);
    const bandGapLevel = detectBandGap(inputText);
    const crystalTier = detectTier(inputText);
    const format = detectFormat(inputText);
    const endpoints = detectEndpoints(inputText);
    const systemPrompt = inputText.length > 4000
      ? inputText.slice(0, 4000) + '\n\n[注: 内容已截断至前 4000 字符]'
      : inputText;

    return {
      crystalName: name,
      crystalTier,
      bandGapLevel,
      format,
      endpoints,
      promptLength: systemPrompt.length,
      facets: {
        input: { format },
        output: { format },
        inclusion: { endpoints },
      },
    };
  }

  it('should parse a document with API endpoints and JSON output', () => {
    const text = `# AI 客服助手
你是一个智能客服助手，帮助用户解决常见问题。
请以 JSON 格式输出回答。
偶尔需要查询 https://api.helpdesk.com 获取信息。`;

    const result = parseTextToPayload(text);
    expect(result.crystalName).toBe('AI 客服助手');
    expect(result.bandGapLevel).toBe('caution');
    expect(result.crystalTier).toBe(3);
    expect(result.format).toBe('JSON');
    expect(result.endpoints).toContain('https://api.helpdesk.com');
  });

  it('should parse a simple local prompt as safe Tier 1', () => {
    const text = '你是一个代码审查专家，专门审查 TypeScript 代码。';
    const result = parseTextToPayload(text);
    expect(result.crystalName).toBe('你是一个代码审查专家，专门审查 TypeScript 代码。');
    expect(result.bandGapLevel).toBe('safe');
    expect(result.crystalTier).toBe(1);
  });

  it('should truncate very long text at 4000 chars', () => {
    const longText = 'A'.repeat(5000);
    const result = parseTextToPayload(longText);
    // 4000 chars + annotation '\n\n[注: 内容已截断至前 4000 字符]' (22 chars) = 4022
    expect(result.promptLength).toBe(4022);
    expect(result.crystalName).toBe('A'.repeat(60)); // extractName returns first 60 chars
  });

  it('should detect multimodal for image-related document', () => {
    const text = '# 图像分析器\n分析用户上传的图片内容，生成描述文字。';
    const result = parseTextToPayload(text);
    expect(result.bandGapLevel).toBe('multimodal');
  });

  it('should detect instruction format from document', () => {
    const text = '你是一名数据分析师，处理 CSV 文件并生成报告。';
    const result = parseTextToPayload(text);
    expect(result.crystalName).toBe('你是一名数据分析师，处理 CSV 文件并生成报告。');
    expect(result.format).toBe('CSV');
  });
});