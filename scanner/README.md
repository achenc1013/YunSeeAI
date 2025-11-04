# YunSeeAI Scanner Module

Asset collection and fingerprinting module for YunSeeAI project. This module provides intelligent scanning capabilities with natural language interface.

## Features

- **Port Scanning**: Discover open ports and running services
- **Fingerprint Detection**: Identify web frameworks, CMS, and technologies
- **Natural Language Interface**: AI understands human queries like "What framework does this website use?"
- **Python Backend**: High-performance scanning using Python (nmap-inspired)
- **Node.js Integration**: Seamless integration with Node.js/TypeScript AI systems

## Architecture

```
scanner/
├── port_scanner.py          # Python port scanning tool
├── fingerprint.py           # Python fingerprint detection
├── scanner_main.py          # Unified Python CLI
├── scanner-client.js        # Node.js client for Python tools
├── tools-registry.js        # Tool definitions and handlers
├── ai-integration.js        # Natural language processing
├── example-usage.js         # Usage examples
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Installation

### 1. Python Setup

Ensure Python 3.13+ is installed:

```bash
python --version
```

Install Python dependencies (optional, uses standard library):

```bash
cd scanner
pip install -r requirements.txt
```

### 2. Node.js Setup

No additional Node.js dependencies required. Uses ES modules.

### 3. Test Installation

Test Python scanners directly:

```bash
# Port scan
python scanner/port_scanner.py example.com

# Fingerprint scan
python scanner/fingerprint.py https://example.com

# Full scan
python scanner/scanner_main.py example.com --scan-type full
```

## Usage

### Method 1: Natural Language Interface (Recommended)

Let AI understand and process user queries:

```javascript
import { processQuery } from './scanner/ai-integration.js';

// User asks in natural language
const result = await processQuery("What framework does https://example.com use?");

console.log(result.ai_response);
// Output: AI-generated natural language response with scan results
```

**Supported Query Examples:**

- "I want to know what framework https://xxx.com uses"
- "What ports are open on example.com?"
- "Scan https://github.com for me"
- "Check what services are running on 192.168.1.1"
- "What technology stack does example.com use?"

### Method 2: Direct Scanner Calls

Use scanner functions directly:

```javascript
import { scanPorts, scanFingerprint, scanFull } from './scanner/scanner-client.js';

// Port scan
const ports = await scanPorts('example.com', 'common', 5);
console.log(ports);

// Fingerprint scan
const fingerprint = await scanFingerprint('https://example.com', 10);
console.log(fingerprint);

// Full scan
const full = await scanFull('example.com', { ports: 'common', timeout: 10 });
console.log(full);
```

### Method 3: Integration with LLM

Integrate with your AI model using function calling:

```javascript
import { getToolDefinitions, executeTool } from './scanner/tools-registry.js';
import { SCANNER_SYSTEM_PROMPT } from './scanner/ai-integration.js';

// 1. Get tool definitions for your LLM
const tools = getToolDefinitions();

// 2. Include system prompt
const systemPrompt = SCANNER_SYSTEM_PROMPT;

// 3. When LLM decides to call a tool:
const toolName = 'scan_fingerprint';  // From LLM's response
const args = { target: 'https://example.com' };  // From LLM's response

const result = await executeTool(toolName, args);
console.log(result);
```

## API Reference

### Scanner Client (`scanner-client.js`)

#### `scanPorts(target, ports, timeout)`

Scan for open ports on target.

**Parameters:**
- `target` (string): Hostname, IP, or URL
- `ports` (string): "common" | "all" | "80,443,8080"
- `timeout` (number): Timeout in seconds (default: 5)

**Returns:** Promise<Object>

```javascript
{
  "success": true,
  "target": "example.com",
  "target_ip": "93.184.216.34",
  "open_ports": [
    {
      "port": 80,
      "service": "HTTP",
      "state": "open"
    }
  ],
  "total_scanned": 20,
  "total_open": 2
}
```

#### `scanFingerprint(target, timeout)`

Identify web technologies and frameworks.

**Parameters:**
- `target` (string): URL to scan
- `timeout` (number): Timeout in seconds (default: 10)

**Returns:** Promise<Object>

```javascript
{
  "success": true,
  "target": "https://example.com",
  "technologies": [
    {
      "name": "Nginx",
      "confidence": "high",
      "type": "Web Server"
    }
  ],
  "server_info": {
    "server": "nginx/1.18.0"
  },
  "total_detected": 3
}
```

#### `scanFull(target, options)`

Comprehensive scan (ports + fingerprint).

**Parameters:**
- `target` (string): Target to scan
- `options` (object): { ports: string, timeout: number }

**Returns:** Promise<Object>

### AI Integration (`ai-integration.js`)

#### `processQuery(userMessage)`

Process natural language query and execute appropriate scan.

**Parameters:**
- `userMessage` (string): User's natural language request

**Returns:** Promise<Object>

```javascript
{
  "success": true,
  "intent": "framework",
  "target": "https://example.com",
  "tool_used": "scan_fingerprint",
  "raw_results": { /* scan results */ },
  "formatted_results": "Human-readable summary",
  "ai_response": "Natural language response"
}
```

#### `parseIntent(userMessage)`

Extract target and determine scan intent from natural language.

**Returns:** Object

```javascript
{
  "success": true,
  "tool": "scan_fingerprint",
  "intent": "framework",
  "target": "https://example.com",
  "parameters": {
    "target": "https://example.com"
  }
}
```

### Tools Registry (`tools-registry.js`)

#### `executeTool(toolName, args)`

Execute a registered tool.

**Available Tools:**
- `scan_ports` - Port scanning
- `scan_fingerprint` - Framework detection
- `scan_full` - Comprehensive scan

#### `getToolDefinitions()`

Get tool definitions in OpenAI function calling format.

## Python CLI Usage

### Port Scanner

```bash
python scanner/port_scanner.py <target> [ports] [timeout]

# Examples:
python scanner/port_scanner.py example.com
python scanner/port_scanner.py example.com common 5
python scanner/port_scanner.py example.com "80,443,8080" 3
python scanner/port_scanner.py example.com all 2
```

### Fingerprint Scanner

```bash
python scanner/fingerprint.py <target> [timeout]

# Examples:
python scanner/fingerprint.py https://example.com
python scanner/fingerprint.py example.com 10
```

### Main Scanner (Unified)

```bash
python scanner/scanner_main.py <target> [options]

# Options:
#   --scan-type {port,fingerprint,full}
#   --ports {common,all,PORT_LIST}
#   --timeout SECONDS
#   --json

# Examples:
python scanner/scanner_main.py example.com --scan-type full
python scanner/scanner_main.py example.com --scan-type port --ports "80,443"
python scanner/scanner_main.py example.com --scan-type fingerprint --json
```

## Examples

See `example-usage.js` for complete examples:

```bash
node scanner/example-usage.js
```

## Security Considerations

⚠️ **Important:**
- Only scan targets you own or have permission to scan
- Unauthorized port scanning may be illegal in your jurisdiction
- Use responsibly and ethically
- Some scans may be detected by IDS/IPS systems
- Respect rate limits and avoid aggressive scanning

## Troubleshooting

### Python not found

Ensure Python is in your PATH:

```bash
python --version
# or
python3 --version
```

If using `python3`, modify `scanner-client.js`:

```javascript
const pythonProcess = spawn('python3', [scriptPath, ...args]);
```

### Permission denied for port scanning

Some port scans require elevated privileges:

```bash
# Linux/Mac
sudo node your-script.js

# Windows (Run as Administrator)
```

### Timeout errors

Increase timeout for slow networks:

```javascript
await scanPorts('example.com', 'common', 10);  // 10 seconds timeout
```

### SSL/TLS errors

For fingerprint scanning, SSL verification is disabled by default for flexibility. In production, consider enabling verification.

## Extending the Module

### Add Custom Fingerprints

Edit `fingerprint.py` and add to `FINGERPRINTS` dictionary:

```python
"MyFramework": {
    "paths": ["/my-path/"],
    "headers": {"X-Custom-Header": "pattern"},
    "body_patterns": ["unique-string"],
    "cookies": ["my_cookie"]
}
```

### Add New Tools

1. Create tool handler in `scanner-client.js`
2. Register in `tools-registry.js`:

```javascript
{
  name: 'my_tool',
  description: 'What the tool does',
  parameters: { /* schema */ },
  handler: async (args) => { /* implementation */ }
}
```

## Performance

- **Port scanning**: ~50 ports/second (multi-threaded)
- **Fingerprint detection**: 1-3 seconds per target
- **Full scan**: 5-10 seconds (depends on ports scanned)

## Dependencies

### Python
- Standard library only (no external packages required)
- Optional: `requests`, `beautifulsoup4` for enhanced scanning

### Node.js
- ES Modules support (Node.js 14+)
- No external npm packages required

## License

Part of YunSeeAI project - Open source security scanner.

## Contributing

Contributions welcome! Please ensure:
- Code is in English (comments, variables, functions)
- Python 3.13+ compatibility
- Proper error handling
- Security best practices

## Credits

Inspired by:
- Nmap (Network Mapper)
- Wappalyzer (Technology detection)
- SafeLine WAF project

---

**YunSeeAI Scanner Module** - Intelligent asset collection with AI 🛡️

