#!/usr/bin/env node

/**
 * Test Full Flow: Trigger → Intent → Target
 */

import { classifyIntent } from './scanner/llm-intent-classifier.js';
import { parseSemanticIntent } from './scanner/semantic-intent-parser.js';

const testQuery = 'http://192.168.20.144/ 用的啥CMS框架';

console.log('🧪 测试完整流程\n');
console.log(`输入: "${testQuery}"\n`);

// Step 1: Check trigger logic
console.log('━━━ 步骤1: 触发检测 ━━━');
const lowerInput = testQuery.toLowerCase();
const hasTarget = /https?:\/\/|(?:\d{1,3}\.){3}\d{1,3}/.test(lowerInput);
const hasTechnicalTerm = ['waf', 'cms', 'framework', 'port', '框架', '端口', '防火墙'].some(t => lowerInput.includes(t));

const scanKeywords = [
  'scan', 'nmap', '扫描', '检测',
  'security audit', 'system security', '安全审计', '系统安全', '安全检查',
  '有waf', '有防火墙', '啥框架', '啥cms', '啥waf',
  '用了什么', '用了啥', '用的什么', '用的啥',
  '用着什么', '用着啥', '使用了什么', '使用了啥',
  '开了哪些', '开放了哪些', '运行了什么',
];

const hasScanKeyword = scanKeywords.some(kw => lowerInput.includes(kw));
const isScanRequest = (hasTarget && hasTechnicalTerm) || hasScanKeyword;

console.log(`hasTarget: ${hasTarget}`);
console.log(`hasTechnicalTerm: ${hasTechnicalTerm}`);
console.log(`hasScanKeyword: ${hasScanKeyword}`);
console.log(`isScanRequest: ${isScanRequest ? '✅ YES' : '❌ NO'}\n`);

if (!isScanRequest) {
  console.log('❌ 触发检测失败！扫描不会执行。');
  process.exit(1);
}

// Step 2: Intent classification
console.log('━━━ 步骤2: 意图分类 ━━━');
const classified = await classifyIntent(testQuery);
console.log(`classified.success: ${classified.success}`);
console.log(`classified.intent: ${classified.intent}`);
console.log(`classified.method: ${classified.method}\n`);

if (!classified.success) {
  console.log('❌ 意图分类失败！');
  process.exit(1);
}

// Step 3: Target extraction
console.log('━━━ 步骤3: 目标提取 ━━━');
const intent = parseSemanticIntent(testQuery);
console.log(`intent.success: ${intent.success}`);
console.log(`intent.intent: ${intent.intent}`);
console.log(`intent.target: ${intent.target}`);
console.log(`intent.tool: ${intent.tool}\n`);

if (!intent.success) {
  console.log('❌ 语义解析失败！');
  process.exit(1);
}

if (!intent.target) {
  console.log('❌ 未提取到目标！扫描会失败。');
  process.exit(1);
}

// Step 4: Final check
console.log('━━━ 步骤4: 最终检查 ━━━');
const needsTarget = intent.intent !== 'security_audit';
const shouldExecute = intent.success && (intent.target || !needsTarget);

console.log(`needsTarget: ${needsTarget}`);
console.log(`shouldExecute: ${shouldExecute ? '✅ YES' : '❌ NO'}\n`);

if (shouldExecute) {
  console.log('✅ 所有检查通过！扫描应该执行。\n');
  console.log('预期输出：');
  console.log('🔍 检测到扫描请求，正在执行扫描...');
  console.log(`   目标: ${intent.target}`);
  console.log(`   类型: ${intent.intent}`);
  console.log('   💡 智能理解: 增强语义分析');
  console.log('');
  console.log('✓ 扫描完成！');
  process.exit(0);
} else {
  console.log('❌ 最终检查失败！扫描不会执行。');
  process.exit(1);
}



