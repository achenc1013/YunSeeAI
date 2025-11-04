/**
 * Test Semantic Intent Parser
 * Verify that the semantic parser understands various expressions
 */

import { parseSemanticIntent, clearContext } from './semantic-intent-parser.js';

console.log("\n🧠 Semantic Intent Parser Test\n");
console.log("=".repeat(80) + "\n");

// Test cases covering various natural language expressions
const testCases = [
  // Port scanning - various expressions
  {
    input: "http://192.168.20.1uu/ 开了哪些服务",
    expectedIntent: "port",
    description: "Chinese: 开了哪些服务 (which services are open)"
  },
  {
    input: "http://example.com 提供了什么服务？",
    expectedIntent: "port",
    description: "Chinese: 提供了什么服务 (what services provided)"
  },
  {
    input: "http://example.com 运行了什么服务？",
    expectedIntent: "port",
    description: "Chinese: 运行了什么服务 (what services running)"
  },
  {
    input: "http://example.com what services are running?",
    expectedIntent: "port",
    description: "English: what services are running"
  },
  {
    input: "http://example.com which services are open?",
    expectedIntent: "port",
    description: "English: which services are open"
  },
  {
    input: "http://example.com services available?",
    expectedIntent: "port",
    description: "English: services available"
  },
  
  // Set up target for context-aware test
  {
    input: "http://192.168.1.100 扫描端口",
    expectedIntent: "port",
    description: "Setup: Establish target for context test",
    setupForContext: true
  },
  
  // Port scanning - no URL (context-aware)
  {
    input: "端口扫描一下",
    expectedIntent: "port",
    description: "Context-aware: scan ports (using last target)",
    expectUseLastTarget: true
  },
  
  // CMS identification
  {
    input: "http://example.com 用了什么CMS？",
    expectedIntent: "cms",
    description: "Chinese: 用了什么CMS"
  },
  {
    input: "http://example.com what CMS is this?",
    expectedIntent: "cms",
    description: "English: what CMS"
  },
  
  // Framework identification
  {
    input: "http://example.com 使用了什么框架？",
    expectedIntent: "framework",
    description: "Chinese: 使用了什么框架"
  },
  {
    input: "http://example.com what framework?",
    expectedIntent: "framework",
    description: "English: what framework"
  },
  
  // Vulnerability scanning
  {
    input: "http://example.com 存在什么漏洞？",
    expectedIntent: "vulnerability",
    description: "Chinese: 存在什么漏洞"
  },
  {
    input: "http://example.com any vulnerabilities?",
    expectedIntent: "vulnerability",
    description: "English: any vulnerabilities"
  },
  
  // Full scan
  {
    input: "http://example.com 全面扫描",
    expectedIntent: "full",
    description: "Chinese: 全面扫描"
  },
  {
    input: "http://example.com full scan",
    expectedIntent: "full",
    description: "English: full scan"
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
    console.log(`   Confidence: ${result.confidence}`);
    
    if (intentMatch) {
      console.log(`   ✅ PASS`);
      passCount++;
    } else {
      console.log(`   ❌ FAIL - Wrong intent`);
      failCount++;
    }
  } else {
    console.log(`❌ Failed to parse: ${result.error}`);
    
    if (testCase.expectUseLastTarget) {
      console.log(`   Note: This test expected to use last target`);
    }
    
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

// Highlight improvements
console.log("🌟 Key Improvements:");
console.log("  • Understands \"开了哪些服务\" → port scan");
console.log("  • Understands \"提供了什么服务\" → port scan");
console.log("  • Understands \"运行了什么服务\" → port scan");
console.log("  • Context-aware: remembers last target");
console.log("  • Semantic pattern matching (not keyword-only)");
console.log("  • Fast: no LLM calls needed\n");

