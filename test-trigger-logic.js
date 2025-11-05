#!/usr/bin/env node

/**
 * Test CommandHandler Scan Trigger Logic
 */

const testCases = [
  // Should trigger (has target + technical term)
  { input: 'http://192.168.20.144/ 用的啥CMS框架', shouldTrigger: true },
  { input: 'http://192.168.20.144/ 啥cms', shouldTrigger: true },
  { input: 'http://192.168.20.144/ 什么框架', shouldTrigger: true },
  { input: 'http://192.168.20.144/ 有waf吗', shouldTrigger: true },
  { input: 'http://192.168.20.144/ 开了哪些端口', shouldTrigger: true },
  { input: '192.168.1.1 有防火墙吗', shouldTrigger: true },
  
  // Should trigger (has scan keywords)
  { input: '扫描一下', shouldTrigger: true },
  { input: '系统安全检查', shouldTrigger: true },
  { input: '安全审计', shouldTrigger: true },
  
  // Should NOT trigger (no target, general questions)
  { input: '什么是CMS', shouldTrigger: false },
  { input: 'base64解密', shouldTrigger: false },
  { input: '5L2g5aW9', shouldTrigger: false },
  { input: '什么是WAF', shouldTrigger: false },
];

console.log('🧪 Testing Scan Trigger Logic\n');

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const lowerInput = testCase.input.toLowerCase();
  
  // Simulate CommandHandler logic
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
  
  const success = isScanRequest === testCase.shouldTrigger;
  
  if (success) {
    console.log(`✅ PASS: "${testCase.input}"`);
    console.log(`   → Trigger: ${isScanRequest ? 'YES' : 'NO'} (expected: ${testCase.shouldTrigger ? 'YES' : 'NO'})`);
    console.log(`   → hasTarget: ${hasTarget}, hasTechnicalTerm: ${hasTechnicalTerm}, hasScanKeyword: ${hasScanKeyword}\n`);
    passed++;
  } else {
    console.log(`❌ FAIL: "${testCase.input}"`);
    console.log(`   → Expected: ${testCase.shouldTrigger ? 'TRIGGER' : 'NO TRIGGER'}`);
    console.log(`   → Got: ${isScanRequest ? 'TRIGGER' : 'NO TRIGGER'}`);
    console.log(`   → hasTarget: ${hasTarget}, hasTechnicalTerm: ${hasTechnicalTerm}, hasScanKeyword: ${hasScanKeyword}\n`);
    failed++;
  }
}

console.log('='.repeat(60));
console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
console.log(`   Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failed} test(s) failed!`);
  process.exit(1);
}

