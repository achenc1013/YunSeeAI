/**
 * Test Script for YunSeeAI Scanner Module
 * Run this to verify scanner is working correctly
 */

import { scanPorts, scanFingerprint, scanFull } from './scanner-client.js';
import { processQuery, parseIntent } from './ai-integration.js';
import { executeTool, getToolDefinitions } from './tools-registry.js';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

async function testPythonScripts() {
  header('Test 1: Python Scripts Availability');
  
  try {
    log('Testing port scanner...', 'yellow');
    const portResult = await scanPorts('example.com', 'common', 3);
    
    if (portResult.success) {
      log('✓ Port scanner works!', 'green');
      log(`  Found ${portResult.total_open} open ports`, 'blue');
    } else {
      log('✗ Port scanner failed: ' + portResult.error, 'red');
      return false;
    }
    
    log('\nTesting fingerprint scanner...', 'yellow');
    const fpResult = await scanFingerprint('https://example.com', 5);
    
    if (fpResult.success) {
      log('✓ Fingerprint scanner works!', 'green');
      log(`  Detected ${fpResult.total_detected} technologies`, 'blue');
    } else {
      log('✗ Fingerprint scanner failed: ' + fpResult.error, 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log('✗ Error: ' + error.message, 'red');
    return false;
  }
}

async function testIntentParsing() {
  header('Test 2: Natural Language Intent Parsing');
  
  const testCases = [
    {
      query: "What ports are open on example.com?",
      expectedTool: "scan_ports"
    },
    {
      query: "I want to know what framework https://github.com uses",
      expectedTool: "scan_fingerprint"
    },
    {
      query: "Scan google.com for me",
      expectedTool: "scan_full"
    }
  ];
  
  let passed = 0;
  
  for (const test of testCases) {
    log(`Query: "${test.query}"`, 'yellow');
    const intent = parseIntent(test.query);
    
    if (intent.success && intent.tool === test.expectedTool) {
      log(`✓ Correctly identified tool: ${intent.tool}`, 'green');
      log(`  Target: ${intent.target}`, 'blue');
      passed++;
    } else {
      log(`✗ Expected ${test.expectedTool}, got ${intent.tool}`, 'red');
    }
    console.log();
  }
  
  log(`Passed: ${passed}/${testCases.length}`, passed === testCases.length ? 'green' : 'red');
  return passed === testCases.length;
}

async function testToolExecution() {
  header('Test 3: Tool Execution via Registry');
  
  try {
    log('Testing scan_ports tool...', 'yellow');
    const portResult = await executeTool('scan_ports', {
      target: 'example.com',
      ports: 'common',
      timeout: 3
    });
    
    if (portResult.success) {
      log('✓ scan_ports executed successfully', 'green');
    } else {
      log('✗ scan_ports failed', 'red');
      return false;
    }
    
    log('\nTesting scan_fingerprint tool...', 'yellow');
    const fpResult = await executeTool('scan_fingerprint', {
      target: 'https://example.com',
      timeout: 5
    });
    
    if (fpResult.success) {
      log('✓ scan_fingerprint executed successfully', 'green');
    } else {
      log('✗ scan_fingerprint failed', 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log('✗ Error: ' + error.message, 'red');
    return false;
  }
}

async function testNaturalLanguageProcessing() {
  header('Test 4: Complete Natural Language Processing');
  
  const testQuery = "What ports are open on example.com?";
  
  log(`User Query: "${testQuery}"`, 'yellow');
  log('Processing...', 'yellow');
  
  try {
    const result = await processQuery(testQuery);
    
    if (result.success) {
      log('\n✓ Query processed successfully!', 'green');
      log('\nAI Response:', 'cyan');
      console.log(result.ai_response);
      
      log('\nTechnical Details:', 'blue');
      log(`  Intent: ${result.intent}`, 'blue');
      log(`  Target: ${result.target}`, 'blue');
      log(`  Tool Used: ${result.tool_used}`, 'blue');
      
      return true;
    } else {
      log('✗ Query processing failed: ' + result.error, 'red');
      return false;
    }
  } catch (error) {
    log('✗ Error: ' + error.message, 'red');
    return false;
  }
}

async function testToolDefinitions() {
  header('Test 5: Tool Definitions for LLM');
  
  try {
    const definitions = getToolDefinitions();
    
    log(`Found ${definitions.length} tool definitions`, 'yellow');
    
    for (const tool of definitions) {
      log(`\n✓ ${tool.function.name}`, 'green');
      log(`  Description: ${tool.function.description}`, 'blue');
      log(`  Parameters: ${Object.keys(tool.function.parameters.properties).join(', ')}`, 'blue');
    }
    
    if (definitions.length === 3) {
      log('\n✓ All tool definitions present', 'green');
      return true;
    } else {
      log('\n✗ Expected 3 tools, found ' + definitions.length, 'red');
      return false;
    }
  } catch (error) {
    log('✗ Error: ' + error.message, 'red');
    return false;
  }
}

async function testErrorHandling() {
  header('Test 6: Error Handling');
  
  try {
    log('Testing with invalid target...', 'yellow');
    const result = await processQuery("Scan invalid-target-xyz.nonexistent");
    
    if (!result.success) {
      log('✓ Error handled correctly', 'green');
      log(`  Error message: ${result.error}`, 'blue');
    } else {
      log('✗ Should have failed with invalid target', 'red');
      return false;
    }
    
    log('\nTesting with no target in query...', 'yellow');
    const result2 = await processQuery("What framework is used?");
    
    if (!result2.success) {
      log('✓ Missing target detected correctly', 'green');
      log(`  Error message: ${result2.error}`, 'blue');
    } else {
      log('✗ Should have failed with no target', 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log('✗ Unexpected error: ' + error.message, 'red');
    return false;
  }
}

async function runAllTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                  YunSeeAI Scanner Module - Test Suite                     ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════════════════╝', 'cyan');
  
  const tests = [
    { name: 'Python Scripts', fn: testPythonScripts },
    { name: 'Intent Parsing', fn: testIntentParsing },
    { name: 'Tool Execution', fn: testToolExecution },
    { name: 'Natural Language Processing', fn: testNaturalLanguageProcessing },
    { name: 'Tool Definitions', fn: testToolDefinitions },
    { name: 'Error Handling', fn: testErrorHandling }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      log(`\n✗ Test "${test.name}" crashed: ${error.message}`, 'red');
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  header('Test Summary');
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  
  results.forEach(result => {
    const symbol = result.passed ? '✓' : '✗';
    const color = result.passed ? 'green' : 'red';
    log(`${symbol} ${result.name}`, color);
  });
  
  console.log('\n' + '='.repeat(80));
  const summaryColor = passedTests === totalTests ? 'green' : 'red';
  log(`\nTotal: ${passedTests}/${totalTests} tests passed`, summaryColor);
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Scanner module is working correctly.', 'green');
    log('You can now integrate it with your AI CLI.', 'cyan');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'yellow');
    log('Make sure Python 3.13+ is installed and in your PATH.', 'yellow');
  }
  
  console.log('\n');
  
  return passedTests === totalTests;
}

// Run tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  log('\n✗ Test suite crashed: ' + error.message, 'red');
  console.error(error);
  process.exit(1);
});

