/**
 * Test WAF Detection Semantic Recognition
 */

import { parseSemanticIntent, clearContext } from './semantic-intent-parser.js';

console.log("\n🛡️  WAF Detection Semantic Test\n");
console.log("=".repeat(80) + "\n");

const testCases = [
  {
    input: "http://example.com 有什么WAF？",
    expectedIntent: "waf",
    description: "Chinese: 有什么WAF"
  },
  {
    input: "http://example.com 使用了什么防火墙？",
    expectedIntent: "waf",
    description: "Chinese: 使用了什么防火墙"
  },
  {
    input: "http://example.com 有WAF吗？",
    expectedIntent: "waf",
    description: "Chinese: 有WAF吗"
  },
  {
    input: "http://example.com 它有防火墙吗？",
    expectedIntent: "waf",
    description: "Chinese: 它有防火墙吗"
  },
  {
    input: "http://example.com 部署了什么WAF？",
    expectedIntent: "waf",
    description: "Chinese: 部署了什么WAF"
  },
  {
    input: "http://example.com does it have WAF?",
    expectedIntent: "waf",
    description: "English: does it have WAF"
  },
  {
    input: "http://example.com what WAF is using?",
    expectedIntent: "waf",
    description: "English: what WAF is using"
  },
  {
    input: "http://example.com is protected by firewall?",
    expectedIntent: "waf",
    description: "English: is protected by firewall"
  },
  // Context-aware test
  {
    input: "http://192.168.1.100 有WAF吗？",
    expectedIntent: "waf",
    description: "Setup: establish target",
    setupForContext: true
  },
  {
    input: "那它用的啥防火墙？",
    expectedIntent: "waf",
    description: "Context-aware: 那它用的啥防火墙",
    expectUseLastTarget: true
  },
  {
    input: "它有防护吗？",
    expectedIntent: "waf",
    description: "Context-aware: 它有防护吗",
    expectUseLastTarget: true
  }
];

let passCount = 0;
let failCount = 0;

testCases.forEach((testCase, index) => {
  // Clear context before each test (except when testing context-awareness)
  if (!testCase.expectUseLastTarget && !testCase.setupForContext) {
    clearContext();
  }
  
  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`Input: "${testCase.input}"`);
  
  const result = parseSemanticIntent(testCase.input);
  
  if (result.success) {
    const intentMatch = result.intent === testCase.expectedIntent;
    
    console.log(`✅ Parsed successfully`);
    console.log(`   Intent: ${result.intent} ${intentMatch ? '✅' : '❌ Expected: ' + testCase.expectedIntent}`);
    console.log(`   Target: ${result.target}`);
    console.log(`   Method: ${result.method}`);
    
    if (intentMatch) {
      console.log(`   ✅ PASS`);
      passCount++;
    } else {
      console.log(`   ❌ FAIL - Wrong intent`);
      failCount++;
    }
  } else {
    console.log(`❌ Failed to parse: ${result.error}`);
    console.log(`   ❌ FAIL`);
    failCount++;
  }
  
  console.log("\n" + "-".repeat(80) + "\n");
});

console.log("=".repeat(80));
console.log(`\n📊 Test Summary:`);
console.log(`✅ Passed: ${passCount}/${testCases.length}`);
console.log(`❌ Failed: ${failCount}/${testCases.length}`);
console.log(`🎯 Success Rate: ${(passCount / testCases.length * 100).toFixed(1)}%\n`);

console.log("🌟 WAF Detection Features:");
console.log("  • Understands \"有什么WAF\" → waf detection");
console.log("  • Understands \"有防火墙吗\" → waf detection");
console.log("  • Understands \"那它用的啥防火墙\" → waf detection");
console.log("  • Context-aware: remembers last target");
console.log("  • Semantic pattern matching");
console.log("  • Supports 150+ WAF types via WAFW00F\n");

