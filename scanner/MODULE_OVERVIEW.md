# YunSeeAI Scanner Module - Overview

## 📁 Module Structure

```
scanner/
│
├── 🐍 Python Backend (Scanning Engine)
│   ├── port_scanner.py          # TCP port scanner (multi-threaded)
│   ├── fingerprint.py           # Web fingerprint detector
│   ├── scanner_main.py          # Unified CLI entry point
│   └── requirements.txt         # Python dependencies (optional)
│
├── 🟢 Node.js Integration Layer
│   ├── scanner-client.js        # Python script executor
│   ├── tools-registry.js        # Tool definitions & handlers
│   ├── ai-integration.js        # NLP & intent parsing
│   └── package.json            # Node.js package config
│
├── 📖 Documentation
│   ├── README.md               # Complete English documentation
│   ├── 使用指南.md              # Chinese quick start guide
│   ├── INTEGRATION_GUIDE.md    # Integration tutorial
│   └── MODULE_OVERVIEW.md      # This file
│
├── 🧪 Testing & Examples
│   ├── test-scanner.js         # Complete test suite
│   └── example-usage.js        # Usage examples
│
└── 📝 Configuration
    └── package.json            # Module metadata
```

## 🔄 Data Flow

```
User Input (Natural Language)
         ↓
   AI Integration Layer
   (ai-integration.js)
         ↓
   Intent Parsing & Tool Selection
         ↓
   Tools Registry
   (tools-registry.js)
         ↓
   Scanner Client
   (scanner-client.js)
         ↓
   Python Scripts
   (port_scanner.py / fingerprint.py)
         ↓
   JSON Results
         ↓
   Format & Present to User
```

## 🎯 Core Components

### 1. Python Scanning Engine

**Purpose**: High-performance scanning using Python

**Files**:
- `port_scanner.py` - Multi-threaded TCP port scanner
- `fingerprint.py` - Web technology detector
- `scanner_main.py` - Unified interface

**Key Features**:
- No external dependencies (uses stdlib only)
- Multi-threaded for speed
- JSON output for easy parsing
- Compatible with Python 3.13+

**Usage**:
```bash
python port_scanner.py example.com
python fingerprint.py https://example.com
python scanner_main.py example.com --scan-type full
```

### 2. Node.js Integration Layer

**Purpose**: Bridge between AI and Python scanners

**Files**:
- `scanner-client.js` - Executes Python scripts via child_process
- `tools-registry.js` - Defines available tools for AI
- `ai-integration.js` - Natural language understanding

**Key Features**:
- Async/await interface
- Error handling
- Result formatting
- ES Modules

**Usage**:
```javascript
import { scanPorts } from './scanner-client.js';
const result = await scanPorts('example.com');
```

### 3. AI Integration

**Purpose**: Let AI understand natural language scan requests

**Capabilities**:
- Parse user intent from natural language
- Extract target from queries
- Map intent to appropriate tool
- Generate natural language responses

**Supported Queries**:
- "What ports are open on example.com?"
- "What framework does https://example.com use?"
- "Scan github.com for me"

### 4. Tool Registry

**Purpose**: Central registry of available scanning tools

**Available Tools**:

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `scan_ports` | Port scanning | target, ports, timeout |
| `scan_fingerprint` | Framework detection | target, timeout |
| `scan_full` | Complete scan | target, ports, timeout |

**Function Calling Format**: Compatible with OpenAI/Anthropic APIs

## 🚀 Quick Start

### 1. Test Python Scripts

```bash
python scanner/port_scanner.py example.com
```

### 2. Test Node.js Integration

```bash
node scanner/test-scanner.js
```

### 3. Use in Your Code

```javascript
import { processQuery } from './scanner/ai-integration.js';

const result = await processQuery("What ports are open on example.com?");
console.log(result.ai_response);
```

## 🔌 Integration Points

### With Your CLI

```javascript
// In your main CLI file
import { processQuery } from './scanner/ai-integration.js';

// Handle user input
if (isScanRequest(userInput)) {
  const result = await processQuery(userInput);
  console.log(result.ai_response);
}
```

### With Your AI Model

```javascript
// Get tool definitions
import { getToolDefinitions } from './scanner/tools-registry.js';
const tools = getToolDefinitions();

// Pass to your AI model
const response = await yourAI.chat({
  messages: [...],
  tools: tools
});
```

### With Function Calling

```javascript
// When AI calls a tool
import { executeTool } from './scanner/tools-registry.js';

const result = await executeTool('scan_ports', {
  target: 'example.com',
  ports: 'common'
});
```

## 📊 Data Formats

### Input Format

**Natural Language**:
```
"I want to know what framework https://example.com uses"
```

**Parsed Intent**:
```json
{
  "success": true,
  "tool": "scan_fingerprint",
  "target": "https://example.com",
  "parameters": {
    "target": "https://example.com"
  }
}
```

### Output Format

**Port Scan Result**:
```json
{
  "success": true,
  "target": "example.com",
  "target_ip": "93.184.216.34",
  "open_ports": [
    {
      "port": 80,
      "service": "HTTP",
      "state": "open",
      "banner": "nginx/1.18.0"
    }
  ],
  "total_scanned": 20,
  "total_open": 2
}
```

**Fingerprint Result**:
```json
{
  "success": true,
  "target": "https://example.com",
  "technologies": [
    {
      "name": "Nginx",
      "confidence": "high",
      "type": "Web Server"
    },
    {
      "name": "WordPress",
      "confidence": "medium",
      "type": "CMS"
    }
  ],
  "server_info": {
    "server": "nginx/1.18.0",
    "powered_by": "PHP/7.4"
  },
  "total_detected": 2
}
```

## 🛠️ API Summary

### Main APIs

```javascript
// Natural language processing
processQuery(userMessage) -> Promise<Result>

// Direct scanning
scanPorts(target, ports, timeout) -> Promise<Object>
scanFingerprint(target, timeout) -> Promise<Object>
scanFull(target, options) -> Promise<Object>

// Tool execution
executeTool(toolName, args) -> Promise<Object>
getToolDefinitions() -> Array<Object>

// Intent parsing
parseIntent(message) -> Object
formatScanResults(result) -> String
```

### Tool Parameters

**scan_ports**:
- `target` (required): hostname/IP/URL
- `ports` (optional): "common" | "all" | "80,443,8080"
- `timeout` (optional): seconds (default: 5)

**scan_fingerprint**:
- `target` (required): URL
- `timeout` (optional): seconds (default: 10)

**scan_full**:
- `target` (required): hostname/URL
- `ports` (optional): port specification
- `timeout` (optional): seconds (default: 10)

## 🎓 Learning Path

1. **Beginners**: Start with `使用指南.md` (Chinese guide)
2. **Integration**: Read `INTEGRATION_GUIDE.md`
3. **Examples**: Check `example-usage.js`
4. **Testing**: Run `test-scanner.js`
5. **API Details**: See `README.md`

## 🔒 Security Considerations

- ✅ Only scan authorized targets
- ✅ Implement rate limiting
- ✅ Validate user input
- ✅ Log scan activities
- ✅ Handle errors gracefully
- ❌ Don't scan internal IPs
- ❌ Don't expose raw errors to users

## 🚧 Extending the Module

### Add Custom Fingerprints

Edit `fingerprint.py`:
```python
FINGERPRINTS["MyFramework"] = {
    "paths": ["/my-path/"],
    "headers": {"X-Custom": ".*"},
    "body_patterns": ["my-pattern"]
}
```

### Add New Tools

1. Create handler function
2. Register in `tools-registry.js`
3. Update AI prompts if needed

### Customize AI Responses

Edit `ai-integration.js` > `generateResponse()`

## 📈 Performance Metrics

- **Port Scan**: ~50 ports/second
- **Fingerprint**: 1-3 seconds/target
- **Full Scan**: 5-10 seconds
- **Intent Parsing**: < 100ms

## 🧩 Dependencies

### Python
- ✅ Standard library only
- ⚙️ Python 3.13+ required

### Node.js
- ✅ No npm packages required
- ⚙️ ES Modules support (Node 14+)
- ⚙️ child_process (built-in)

## 📋 Checklist for Integration

- [ ] Python 3.13+ installed
- [ ] Test Python scripts work
- [ ] Node.js ES modules enabled
- [ ] Run test suite passes
- [ ] Import scanner modules
- [ ] Add to AI system prompt
- [ ] Register tools with AI
- [ ] Handle function calls
- [ ] Test with real queries
- [ ] Add error handling
- [ ] Implement rate limiting
- [ ] Add logging

## 🎯 Use Cases

1. **Web Application Analysis**
   - Identify technology stack
   - Find open services
   - Security assessment

2. **Network Discovery**
   - Map open ports
   - Service identification
   - Asset inventory

3. **Security Auditing**
   - Pre-deployment checks
   - Configuration review
   - Vulnerability surface mapping

4. **AI-Assisted Operations**
   - Natural language scanning
   - Automated reporting
   - Intelligent recommendations

## 📞 Support & Resources

- **Documentation**: See README.md files
- **Examples**: Run example-usage.js
- **Testing**: Run test-scanner.js
- **Issues**: Check error messages

## 🎉 Features

- ✨ Natural language interface
- ⚡ Fast multi-threaded scanning
- 🎯 Accurate fingerprinting
- 🔧 Easy integration
- 📦 No external dependencies
- 🌍 Works offline
- 🔒 Privacy-focused
- 🛡️ Security-conscious
- 📝 Well documented
- 🧪 Fully tested

---

**YunSeeAI Scanner Module** - Making security scanning intelligent 🛡️

For detailed documentation, see:
- `README.md` - Complete English documentation
- `使用指南.md` - Chinese quick start
- `INTEGRATION_GUIDE.md` - Integration tutorial

