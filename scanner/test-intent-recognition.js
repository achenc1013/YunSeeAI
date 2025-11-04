/**
 * Test script to verify intelligent intent recognition
 */

import { parseIntent } from './ai-integration.js';

console.log("\n🧪 Intent Recognition Test\n");
console.log("=".repeat(80) + "\n");

// Test cases mimicking real user interactions
const testCases = [
    {
        description: "用户问CMS",
        input: "http://192.168.20.144/ 这个网站用了什么CMS？",
        expectedIntent: "cms",
        expectedTarget: "http://192.168.20.144/"
    },
    {
        description: "用户问开通了哪些服务（应识别为端口扫描）",
        input: "http://192.168.20.144/ 这个网站开通了哪些服务？",
        expectedIntent: "port",
        expectedTarget: "http://192.168.20.144/"
    },
    {
        description: "用户说端口扫描（无URL，应使用上次的目标）",
        input: "端口扫描一下",
        expectedIntent: "port",
        expectedTarget: "http://192.168.20.144/" // 从上一次查询
    },
    {
        description: "用户问提供了什么服务（端口扫描）",
        input: "http://example.com 提供了什么服务？",
        expectedIntent: "port",
        expectedTarget: "http://example.com"
    },
    {
        description: "用户问运行了什么服务（端口扫描）",
        input: "192.168.1.1 运行了什么服务？",
        expectedIntent: "port",
        expectedTarget: "192.168.1.1"
    },
    {
        description: "用户问框架",
        input: "http://example.com 使用了什么框架？",
        expectedIntent: "framework",
        expectedTarget: "http://example.com"
    },
    {
        description: "用户问漏洞",
        input: "http://example.com 有什么漏洞？",
        expectedIntent: "vulnerability",
        expectedTarget: "http://example.com"
    },
    {
        description: "用户要求扫描端口（无URL）",
        input: "扫描端口",
        expectedIntent: "port",
        expectedTarget: "http://example.com" // 从上一次
    }
];

let passCount = 0;
let failCount = 0;

testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`Input: "${testCase.input}"`);
    
    const result = parseIntent(testCase.input);
    
    if (result.success) {
        const intentMatch = result.intent === testCase.expectedIntent;
        const targetMatch = result.target === testCase.expectedTarget;
        
        console.log(`✅ Parsed successfully`);
        console.log(`   Intent: ${result.intent} ${intentMatch ? '✅' : '❌ Expected: ' + testCase.expectedIntent}`);
        console.log(`   Target: ${result.target} ${targetMatch ? '✅' : '❌ Expected: ' + testCase.expectedTarget}`);
        
        if (intentMatch && targetMatch) {
            console.log(`   ✅ PASS`);
            passCount++;
        } else {
            console.log(`   ❌ FAIL`);
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
console.log(`\nTest Summary:`);
console.log(`✅ Passed: ${passCount}/${testCases.length}`);
console.log(`❌ Failed: ${failCount}/${testCases.length}`);
console.log(`\nSuccess Rate: ${(passCount / testCases.length * 100).toFixed(1)}%\n`);

