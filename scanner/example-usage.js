/**
 * Example Usage of YunSeeAI Scanner Module
 * Demonstrates how to integrate scanner with AI
 */

import { processQuery } from './ai-integration.js';
import { scanPorts, scanFingerprint, scanFull } from './scanner-client.js';

/**
 * Example 1: Process natural language queries
 */
async function exampleNaturalLanguage() {
  console.log('=== Example 1: Natural Language Processing ===\n');
  
  const queries = [
    "I want to know what framework https://example.com uses",
    "What ports are open on example.com?",
    "Scan github.com for me"
  ];
  
  for (const query of queries) {
    console.log(`User Query: "${query}"`);
    console.log('Processing...\n');
    
    const result = await processQuery(query);
    
    if (result.success) {
      console.log(result.ai_response);
    } else {
      console.log(`Error: ${result.error}`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

/**
 * Example 2: Direct tool usage
 */
async function exampleDirectCalls() {
  console.log('=== Example 2: Direct Scanner Calls ===\n');
  
  // Port scan
  console.log('1. Port Scanning example.com...');
  const portResult = await scanPorts('example.com', 'common', 5);
  console.log(JSON.stringify(portResult, null, 2));
  console.log('\n');
  
  // Fingerprint scan
  console.log('2. Fingerprinting https://example.com...');
  const fpResult = await scanFingerprint('https://example.com', 10);
  console.log(JSON.stringify(fpResult, null, 2));
  console.log('\n');
  
  // Full scan
  console.log('3. Full scan of example.com...');
  const fullResult = await scanFull('example.com', { ports: 'common', timeout: 10 });
  console.log(JSON.stringify(fullResult, null, 2));
  console.log('\n');
}

/**
 * Example 3: Integration with AI model
 */
async function exampleAIIntegration() {
  console.log('=== Example 3: AI Model Integration ===\n');
  
  // This demonstrates how to use scanner with an AI model
  // In your actual implementation, you would integrate with your LLM
  
  const userMessage = "What ports are open on scanme.nmap.org?";
  console.log(`User: ${userMessage}\n`);
  
  // Process the query
  const result = await processQuery(userMessage);
  
  if (result.success) {
    console.log('AI Assistant Response:');
    console.log(result.ai_response);
    
    console.log('\n--- Technical Details ---');
    console.log(`Tool used: ${result.tool_used}`);
    console.log(`Target: ${result.target}`);
    console.log(`Intent: ${result.intent}`);
  } else {
    console.log(`Error: ${result.error}`);
  }
}

/**
 * Example 4: Custom scan configuration
 */
async function exampleCustomScan() {
  console.log('=== Example 4: Custom Scan Configuration ===\n');
  
  const target = 'example.com';
  
  // Scan specific ports
  console.log('1. Scanning specific ports (80, 443, 8080)...');
  const customPorts = await scanPorts(target, '80,443,8080', 3);
  console.log(`Found ${customPorts.total_open} open ports`);
  console.log('\n');
  
  // Scan all ports (1-1024)
  console.log('2. Scanning all common ports (1-1024)...');
  const allPorts = await scanPorts(target, 'all', 2);
  console.log(`Found ${allPorts.total_open} open ports out of ${allPorts.total_scanned}`);
  console.log('\n');
}

/**
 * Main function - Run examples
 */
async function main() {
  console.log('\n🚀 YunSeeAI Scanner Module - Example Usage\n');
  console.log('='.repeat(80));
  console.log('\n');
  
  // Uncomment the examples you want to run
  
  // await exampleNaturalLanguage();
  // await exampleDirectCalls();
  await exampleAIIntegration();
  // await exampleCustomScan();
  
  console.log('\n✅ Examples completed!\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  exampleNaturalLanguage,
  exampleDirectCalls,
  exampleAIIntegration,
  exampleCustomScan
};

