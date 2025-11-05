#!/usr/bin/env node

/**
 * Test CMS Intent Recognition
 * Verify that CMS queries are correctly identified
 */

import { classifyIntent } from './llm-intent-classifier.js';

const testCases = [
  // CMS queries - should return 'cms'
  { input: 'http://192.168.20.144/ 用的啥CMS框架？', expected: 'cms' },
  { input: 'http://192.168.20.144/ 啥cms', expected: 'cms' },
  { input: 'http://192.168.20.144/ 什么cms', expected: 'cms' },
  { input: 'http://example.com 用了什么CMS', expected: 'cms' },
  { input: 'https://test.com CMS是什么', expected: 'cms' },
  
  // Framework queries - should return 'framework'
  { input: 'http://192.168.20.144/ 什么框架', expected: 'framework' },
  { input: 'http://192.168.20.144/ 用了啥框架', expected: 'framework' },
  { input: 'http://example.com 技术栈', expected: 'framework' },
  
  // Port queries - should return 'port'
  { input: 'http://192.168.20.144/ 开了哪些端口', expected: 'port' },
  { input: '扫描端口', expected: 'port' },
  
  // WAF queries - should return 'waf'
  { input: 'http://192.168.20.144/ 有waf吗', expected: 'waf' },
  { input: '检测waf', expected: 'waf' },
];

console.log('🧪 CMS Intent Recognition Test\n');

let passed = 0;
let failed = 0;

async function runTests() {
  for (const testCase of testCases) {
    const result = await classifyIntent(testCase.input);
    const success = result.success && result.intent === testCase.expected;
    
    if (success) {
      console.log(`✅ PASS: "${testCase.input}"`);
      console.log(`   → Intent: ${result.intent} (${result.method})\n`);
      passed++;
    } else {
      console.log(`❌ FAIL: "${testCase.input}"`);
      console.log(`   → Expected: ${testCase.expected}`);
      console.log(`   → Got: ${result.intent || 'null'} (${result.method})\n`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`   Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed!`);
    process.exit(1);
  }
}

runTests();

