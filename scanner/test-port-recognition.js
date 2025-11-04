/**
 * Test script to verify port number recognition
 */

import { parseIntent } from './ai-integration.js';

// Test cases
const testCases = [
    {
        input: "http://192.168.20.144/ 这个网站用了啥CMS框架？",
        expectedTarget: "http://192.168.20.144/",
        expectedPort: "default (80 for HTTP)",
        description: "No port specified - should use default 80"
    },
    {
        input: "http://192.168.20.155:12345/ 这个网站用了啥CMS框架？",
        expectedTarget: "http://192.168.20.155:12345/",
        expectedPort: "12345",
        description: "Port 12345 specified"
    },
    {
        input: "https://example.com 用了什么CMS？",
        expectedTarget: "https://example.com",
        expectedPort: "default (443 for HTTPS)",
        description: "HTTPS no port - should use default 443"
    },
    {
        input: "http://192.168.1.1:8080 的CMS是什么？",
        expectedTarget: "http://192.168.1.1:8080",
        expectedPort: "8080",
        description: "Port 8080 specified"
    },
    {
        input: "192.168.1.1 使用了什么框架？",
        expectedTarget: "192.168.1.1",
        expectedPort: "default (will be prefixed with https://)",
        description: "No scheme, no port"
    }
];

console.log("\n🧪 Port Recognition Test\n");
console.log("=".repeat(80) + "\n");

testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`Input: "${testCase.input}"`);
    
    const result = parseIntent(testCase.input);
    
    if (result.success) {
        console.log(`✅ Target extracted: ${result.target}`);
        console.log(`   Expected: ${testCase.expectedTarget}`);
        console.log(`   Expected port: ${testCase.expectedPort}`);
        
        // Check if port is preserved
        const hasPort = result.target.match(/:(\d+)/);
        if (hasPort) {
            console.log(`   📌 Port detected: ${hasPort[1]}`);
        } else {
            console.log(`   📌 No explicit port (will use default)`);
        }
        
        const match = result.target === testCase.expectedTarget;
        console.log(`   ${match ? '✅ PASS' : '❌ FAIL'}`);
    } else {
        console.log(`❌ Failed to parse: ${result.error}`);
    }
    
    console.log("\n" + "-".repeat(80) + "\n");
});

console.log("Test completed! ✅");

