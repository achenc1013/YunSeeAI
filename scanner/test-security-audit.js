/**
 * Test script for Security Audit Semantic Recognition
 */

import { parseSemanticIntent, clearContext } from './semantic-intent-parser.js';

console.log('🧪 安全审计语义识别测试\n');
console.log('='.repeat(60));

const testCases = [
  // Chinese queries
  { input: '检查系统安全', expected: 'security_audit' },
  { input: '安全审计', expected: 'security_audit' },
  { input: '系统安全吗？', expected: 'security_audit' },
  { input: '有没有攻击？', expected: 'security_audit' },
  { input: '检测暴力破解', expected: 'security_audit' },
  { input: '分析系统日志', expected: 'security_audit' },
  { input: '查看配置安全', expected: 'security_audit' },
  { input: '是否有入侵？', expected: 'security_audit' },
  { input: '封禁攻击IP', expected: 'security_audit' },
  { input: '服务器安全检查', expected: 'security_audit' },
  { input: '检查SSH配置', expected: 'security_audit' },
  { input: '有人爆破吗？', expected: 'security_audit' },
  
  // English queries
  { input: 'Security audit', expected: 'security_audit' },
  { input: 'Check system security', expected: 'security_audit' },
  { input: 'Any attacks?', expected: 'security_audit' },
  { input: 'Analyze logs', expected: 'security_audit' },
  { input: 'Is my system secure?', expected: 'security_audit' },
  { input: 'Detect brute force', expected: 'security_audit' },
  { input: 'Check configurations', expected: 'security_audit' },
  
  // Should NOT be security_audit
  { input: 'http://192.168.1.1/ 有waf吗', expected: 'waf' },
  { input: 'http://example.com 开了哪些端口', expected: 'port' },
  { input: 'http://test.com 用了什么CMS', expected: 'cms' }
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  clearContext(); // Clear context for each test
  
  const result = parseSemanticIntent(test.input);
  const success = result.success && result.intent === test.expected;
  
  if (success) {
    passed++;
    console.log(`\n✅ 测试 ${index + 1}: PASS`);
  } else {
    failed++;
    console.log(`\n❌ 测试 ${index + 1}: FAIL`);
  }
  
  console.log(`   输入: "${test.input}"`);
  console.log(`   预期: ${test.expected}`);
  console.log(`   实际: ${result.success ? result.intent : 'FAILED'}`);
  
  if (!success && result.error) {
    console.log(`   错误: ${result.error}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 测试结果:`);
console.log(`   总计: ${testCases.length}`);
console.log(`   通过: ${passed} ✅`);
console.log(`   失败: ${failed} ❌`);
console.log(`   成功率: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log(`\n🎉 所有测试通过！安全审计语义识别工作正常。`);
} else {
  console.log(`\n⚠️  有 ${failed} 个测试失败，需要检查。`);
}





