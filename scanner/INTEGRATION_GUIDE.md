# Integration Guide - YunSeeAI Scanner Module

This guide shows how to integrate the scanner module with your existing YunSeeAI CLI and AI model.

## Quick Start Integration

### Step 1: Import Scanner Module

In your main CLI file (e.g., `cli.js` or `index.js`):

```javascript
import { processQuery } from './scanner/ai-integration.js';
import { getToolDefinitions } from './scanner/tools-registry.js';
import { SCANNER_SYSTEM_PROMPT } from './scanner/ai-integration.js';
```

### Step 2: Add Scanner Tools to AI Model

If you're using function calling with your LLM:

```javascript
// Get scanner tool definitions
const scannerTools = getToolDefinitions();

// Add to your model's tools
const allTools = [
  ...yourExistingTools,
  ...scannerTools
];

// Include scanner system prompt in your system message
const systemMessage = `
${yourExistingSystemPrompt}

${SCANNER_SYSTEM_PROMPT}
`;
```

### Step 3: Handle Scanner Function Calls

When your AI model decides to call a scanner tool:

```javascript
import { executeTool } from './scanner/tools-registry.js';
import { formatScanResults } from './scanner/scanner-client.js';

// In your function call handler:
async function handleFunctionCall(toolName, args) {
  // Check if it's a scanner tool
  if (['scan_ports', 'scan_fingerprint', 'scan_full'].includes(toolName)) {
    const result = await executeTool(toolName, args);
    
    // Format results for AI
    const formatted = formatScanResults(result);
    
    return {
      success: result.success,
      data: result,
      formatted: formatted
    };
  }
  
  // Handle other tools...
}
```

## Integration Patterns

### Pattern 1: Simple Natural Language Processing

For quick integration without complex function calling:

```javascript
import { processQuery } from './scanner/ai-integration.js';

// In your CLI message handler
async function handleUserMessage(message) {
  // Check if message is about scanning
  const scanKeywords = ['scan', 'port', 'framework', 'technology', 'fingerprint'];
  const isScanning = scanKeywords.some(kw => message.toLowerCase().includes(kw));
  
  if (isScanning) {
    const result = await processQuery(message);
    
    if (result.success) {
      console.log(result.ai_response);
      return result;
    } else {
      console.log(`Scan error: ${result.error}`);
      return null;
    }
  }
  
  // Handle other messages with your AI model...
}
```

### Pattern 2: Full LLM Integration with Function Calling

For advanced integration with models supporting function calling (e.g., GPT-4, Claude):

```javascript
import { getToolDefinitions, executeTool } from './scanner/tools-registry.js';

// 1. Initialize your LLM with scanner tools
const tools = getToolDefinitions();

async function chatWithAI(userMessage, conversationHistory = []) {
  const messages = [
    { role: 'system', content: SCANNER_SYSTEM_PROMPT },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];
  
  // Call your LLM (example with OpenAI-style API)
  const response = await yourLLM.chat({
    messages: messages,
    tools: tools,
    tool_choice: 'auto'
  });
  
  // Handle function calls
  if (response.tool_calls) {
    const toolResults = [];
    
    for (const toolCall of response.tool_calls) {
      const result = await executeTool(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments)
      );
      
      toolResults.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolCall.function.name,
        content: JSON.stringify(result)
      });
    }
    
    // Send tool results back to LLM
    const finalResponse = await yourLLM.chat({
      messages: [...messages, response, ...toolResults],
      tools: tools
    });
    
    return finalResponse.content;
  }
  
  return response.content;
}
```

### Pattern 3: Direct Tool Access

For manual control or specific use cases:

```javascript
import { scanPorts, scanFingerprint, scanFull } from './scanner/scanner-client.js';

// Create custom commands
const commands = {
  'scan-ports': async (target) => {
    const result = await scanPorts(target, 'common', 5);
    console.log(JSON.stringify(result, null, 2));
  },
  
  'scan-web': async (target) => {
    const result = await scanFingerprint(target, 10);
    console.log(JSON.stringify(result, null, 2));
  },
  
  'scan-all': async (target) => {
    const result = await scanFull(target, { ports: 'common', timeout: 10 });
    console.log(JSON.stringify(result, null, 2));
  }
};

// In your CLI
if (command in commands) {
  await commands[command](argument);
}
```

## Example: Complete CLI Integration

```javascript
// main.js - Complete example
import readline from 'readline';
import { processQuery } from './scanner/ai-integration.js';
import { getToolDefinitions } from './scanner/tools-registry.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('YunSeeAI - Intelligent Security Assistant');
console.log('Type your commands in natural language...\n');

function prompt() {
  rl.question('You: ', async (input) => {
    if (input.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      rl.close();
      return;
    }
    
    // Check if it's a scanning request
    const scanKeywords = ['scan', 'port', 'framework', 'website', 'technology'];
    const isScanRequest = scanKeywords.some(kw => 
      input.toLowerCase().includes(kw)
    );
    
    if (isScanRequest) {
      console.log('AI: Let me scan that for you...\n');
      
      const result = await processQuery(input);
      
      if (result.success) {
        console.log('AI:', result.ai_response);
      } else {
        console.log('AI: Sorry, I encountered an error:', result.error);
      }
    } else {
      // Handle other queries with your main AI model
      console.log('AI: [Your AI model response here]');
    }
    
    console.log('\n');
    prompt();
  });
}

prompt();
```

## Working with Your Local LLM

### For Ollama Integration

```javascript
import ollama from 'ollama';
import { getToolDefinitions, executeTool } from './scanner/tools-registry.js';
import { formatScanResults } from './scanner/scanner-client.js';

async function chatWithOllama(message) {
  const tools = getToolDefinitions();
  
  const response = await ollama.chat({
    model: 'llama2',  // or your model
    messages: [
      { 
        role: 'system', 
        content: SCANNER_SYSTEM_PROMPT 
      },
      { 
        role: 'user', 
        content: message 
      }
    ],
    tools: tools
  });
  
  // If model wants to use a tool
  if (response.message.tool_calls) {
    for (const tool of response.message.tool_calls) {
      const result = await executeTool(
        tool.function.name,
        tool.function.arguments
      );
      
      // Format and send back to model
      const formatted = formatScanResults(result);
      return formatted;
    }
  }
  
  return response.message.content;
}
```

### For node-llama-cpp Integration

```javascript
import { LlamaModel, LlamaContext, LlamaChatSession } from 'node-llama-cpp';
import { parseIntent, executeTool } from './scanner/ai-integration.js';

const model = new LlamaModel({ modelPath: './models/your-model.gguf' });
const context = new LlamaContext({ model });
const session = new LlamaChatSession({ context });

async function chat(userMessage) {
  // First, check if it's a scanning request
  const intent = parseIntent(userMessage);
  
  if (intent.success) {
    // Execute the scan
    const scanResult = await executeTool(intent.tool, intent.parameters);
    
    // Generate natural response using LLM
    const prompt = `User asked: "${userMessage}"
Scan results: ${JSON.stringify(scanResult, null, 2)}

Please provide a helpful, natural language response explaining these results to the user.`;
    
    const response = await session.prompt(prompt);
    return response;
  }
  
  // Regular chat
  const response = await session.prompt(userMessage);
  return response;
}
```

## Testing Your Integration

### 1. Test Scanner Independently

```bash
# Test Python scanners
python scanner/port_scanner.py example.com
python scanner/fingerprint.py https://example.com

# Test Node.js integration
node scanner/example-usage.js
```

### 2. Test Natural Language Processing

```javascript
import { parseIntent } from './scanner/ai-integration.js';

const testQueries = [
  "What ports are open on example.com?",
  "What framework does https://github.com use?",
  "Scan google.com"
];

testQueries.forEach(query => {
  const intent = parseIntent(query);
  console.log(`Query: "${query}"`);
  console.log('Intent:', intent);
  console.log('\n');
});
```

### 3. Test Full Integration

Create a test script:

```javascript
// test-integration.js
import { processQuery } from './scanner/ai-integration.js';

const queries = [
  "I want to know what ports are open on scanme.nmap.org",
  "What framework does https://example.com use?",
  "Scan github.com for me"
];

for (const query of queries) {
  console.log(`Testing: "${query}"`);
  const result = await processQuery(query);
  console.log('Success:', result.success);
  console.log('Response:', result.ai_response);
  console.log('\n' + '='.repeat(80) + '\n');
}
```

Run with:
```bash
node test-integration.js
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```javascript
try {
  const result = await processQuery(userMessage);
  
  if (!result.success) {
    console.log(`Scan failed: ${result.error}`);
    // Fallback to general AI response
  }
} catch (error) {
  console.error('Scanner error:', error);
  // Provide user-friendly message
}
```

### 2. Rate Limiting

Prevent abuse by rate limiting scans:

```javascript
const scanCooldown = new Map();
const COOLDOWN_MS = 30000; // 30 seconds

async function rateLimitedScan(target, userId) {
  const lastScan = scanCooldown.get(userId);
  
  if (lastScan && Date.now() - lastScan < COOLDOWN_MS) {
    return {
      success: false,
      error: 'Please wait before scanning again'
    };
  }
  
  scanCooldown.set(userId, Date.now());
  return await processQuery(target);
}
```

### 3. Security Considerations

```javascript
// Validate target before scanning
function isValidTarget(target) {
  // Block localhost/internal IPs
  const blocked = [
    '127.0.0.1',
    'localhost',
    '192.168.',
    '10.',
    '172.16.'
  ];
  
  return !blocked.some(b => target.includes(b));
}

// Use before scanning
if (!isValidTarget(target)) {
  return { success: false, error: 'Invalid target' };
}
```

### 4. Logging and Monitoring

```javascript
import fs from 'fs';

function logScan(userId, target, result) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId,
    target,
    success: result.success,
    toolUsed: result.tool_used
  };
  
  fs.appendFileSync(
    'scan-logs.json',
    JSON.stringify(logEntry) + '\n'
  );
}
```

## Troubleshooting

### Python Not Found

If scanner can't find Python:

```javascript
// scanner-client.js
// Change python to python3 or full path
const pythonProcess = spawn('python3', [scriptPath, ...args]);
// or
const pythonProcess = spawn('/usr/bin/python3', [scriptPath, ...args]);
```

### Timeout Issues

Increase timeouts for slow networks:

```javascript
const result = await scanPorts(target, 'common', 10); // 10s timeout
```

### Permission Issues

Some ports require elevated privileges. Run with:

```bash
# Linux/Mac
sudo node your-cli.js

# Windows
# Run terminal as Administrator
```

## Next Steps

1. **Test the integration** with example queries
2. **Customize prompts** for your AI model
3. **Add logging** and error tracking
4. **Implement rate limiting** for production
5. **Add more fingerprints** as needed

## Support

For issues or questions:
- Check `scanner/README.md` for API documentation
- Run `scanner/example-usage.js` for working examples
- Review error messages from Python scripts

---

Happy integrating! 🚀

